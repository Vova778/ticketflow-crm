import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';

// HTTP contract tests use real JWT guards, DTO validation and services with a database double.
describe('TicketFlow HTTP API', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const db = {
    user: {
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(3),
      findMany: jest.fn().mockResolvedValue([]),
    },
    ticket: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    ticketComment: { create: jest.fn() },
  };
  const token = (id = 1) =>
    jwt.sign({ sub: id, email: 'ignored@test.test', role: 'ADMIN' });
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    setupApp(app);
    await app.init();
    jwt = module.get(JwtService);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    db.user.findUnique.mockImplementation(
      ({ where }: { where: { id: number } }) =>
        Promise.resolve({
          id: where.id,
          email: 'test@test.test',
          role: where.id === 3 ? 'ADMIN' : where.id === 2 ? 'MANAGER' : 'USER',
          isActive: where.id !== 99,
        }),
    );
    db.ticket.findFirst.mockResolvedValue(null);
    db.ticket.findUnique.mockResolvedValue({
      id: 10,
      createdById: 1,
      assignedToId: null,
      status: 'OPEN',
    });
  });
  afterAll(async () => {
    await app.close();
  });

  it('serves health and Swagger', async () => {
    await request(app.getHttpServer()).get('/health/db').expect(200);
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const document = response.body as { paths: Record<string, unknown> };
    expect(document.paths['/tickets/{id}/comments']).toBeDefined();
    expect(document.paths['/dashboard/statistics']).toBeDefined();
  });
  it('requires JWT', async () => {
    await request(app.getHttpServer()).get('/tickets').expect(401);
  });
  it('rejects inactive accounts with a valid JWT', async () => {
    await request(app.getHttpServer())
      .get('/tickets')
      .auth(token(99), { type: 'bearer' })
      .expect(401);
  });
  it('uses current database role rather than JWT role', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .auth(token(), { type: 'bearer' })
      .expect(403);
  });
  it('lets admin list users', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .auth(token(3), { type: 'bearer' })
      .expect(200);
  });
  it('transforms pagination and scopes search', async () => {
    await request(app.getHttpServer())
      .get('/tickets?page=2&perPage=3&search=login')
      .auth(token(), { type: 'bearer' })
      .expect(200);
    const args = db.ticket.findMany.mock.calls[0] as [
      { skip: number; take: number; where: { AND: unknown[] } },
    ];
    expect(args[0].skip).toBe(3);
    expect(args[0].take).toBe(3);
    expect(args[0].where.AND).toContainEqual({ createdById: 1 });
  });
  it.each([
    'page=0',
    'perPage=101',
    'status=INVALID',
    'page=hello',
    'unknown=yes',
  ])('rejects invalid query %s', async (query) => {
    await request(app.getHttpServer())
      .get('/tickets?' + query)
      .auth(token(), { type: 'bearer' })
      .expect(400);
  });
  it.each([
    { title: null },
    { status: null },
    { createdById: 2 },
    { assignedToId: '2' },
  ])('rejects invalid ticket update %j', async (body) => {
    await request(app.getHttpServer())
      .patch('/tickets/10')
      .auth(token(3), { type: 'bearer' })
      .send(body)
      .expect(400);
  });
  it('hides foreign ticket comments', async () => {
    await request(app.getHttpServer())
      .get('/tickets/10/comments')
      .auth(token(), { type: 'bearer' })
      .expect(404);
    await request(app.getHttpServer())
      .post('/tickets/10/comments')
      .auth(token(), { type: 'bearer' })
      .send({ content: 'Hello' })
      .expect(404);
  });
  it('creates a comment with authenticated author', async () => {
    db.ticket.findFirst.mockResolvedValue({ id: 10 });
    db.ticketComment.create.mockResolvedValue({ id: 1, content: 'Hello' });
    await request(app.getHttpServer())
      .post('/tickets/10/comments')
      .auth(token(), { type: 'bearer' })
      .send({ content: 'Hello' })
      .expect(201);
    const args = db.ticketComment.create.mock.calls[0] as [
      { data: { author: unknown } },
    ];
    expect(args[0].data.author).toEqual({ connect: { id: 1 } });
  });
  it('rejects forged comment author', async () => {
    await request(app.getHttpServer())
      .post('/tickets/10/comments')
      .auth(token(), { type: 'bearer' })
      .send({ content: 'Hello', authorId: 3 })
      .expect(400);
  });
  it('denies deletion to users', async () => {
    await request(app.getHttpServer())
      .delete('/tickets/10')
      .auth(token(), { type: 'bearer' })
      .expect(403);
  });
});
