/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers are typed as any. */
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';

const user: AuthUser = { id: 1, email: 'user@test.test', role: 'USER' };
const manager: AuthUser = {
  id: 2,
  email: 'manager@test.test',
  role: 'MANAGER',
};
const admin: AuthUser = { id: 3, email: 'admin@test.test', role: 'ADMIN' };

describe('Tickets policies', () => {
  const db = {
    ticket: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    user: { findFirst: jest.fn() },
    ticketComment: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  const service = new TicketsService(db as unknown as PrismaService);
  beforeEach(() => {
    jest.clearAllMocks();
    db.ticket.findMany.mockResolvedValue([]);
    db.ticket.count.mockResolvedValue(0);
    db.ticket.findUnique.mockResolvedValue({
      id: 10,
      createdById: 1,
      assignedToId: null,
      status: 'OPEN',
    });
  });

  it.each([
    [user, { createdById: 1 }],
    [manager, { OR: [{ assignedToId: 2 }, { assignedToId: null }] }],
    [admin, {}],
  ])('scopes lists for $role', async (actor, scope) => {
    await service.findAll(
      { page: 2, perPage: 5, search: 'login', assignedToId: 99 },
      actor,
    );
    expect(db.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        where: expect.objectContaining({
          AND: expect.arrayContaining([scope]),
        }),
      }),
    );
  });
  it('hides inaccessible details', async () => {
    db.ticket.findFirst.mockResolvedValue(null);
    await expect(service.findOne(10, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('allows user text edits on own OPEN ticket', async () => {
    await service.update(10, { title: 'Updated title' }, user);
    expect(db.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'Updated title', description: undefined },
        where: expect.objectContaining({ status: 'OPEN' }),
      }),
    );
  });
  it('denies user status changes', async () => {
    await expect(
      service.update(10, { status: 'CLOSED' }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('denies user edits after OPEN', async () => {
    db.ticket.findUnique.mockResolvedValue({
      createdById: 1,
      assignedToId: 2,
      status: 'CLOSED',
    });
    await expect(
      service.update(10, { title: 'Updated' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('denies editing another user ticket', async () => {
    db.ticket.findUnique.mockResolvedValue({
      createdById: 99,
      assignedToId: 2,
      status: 'OPEN',
    });
    await expect(
      service.update(10, { title: 'Updated' }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('denies manager text edits and reassignment to another manager', async () => {
    await expect(
      service.update(10, { title: 'Updated' }, manager),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.update(10, { assignedToId: 99 }, manager),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('allows manager to claim unassigned tickets', async () => {
    await service.update(
      10,
      { assignedToId: 2, status: 'IN_PROGRESS' },
      manager,
    );
    expect(db.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedTo: { connect: { id: 2 } } }),
      }),
    );
  });
  it('rejects inactive or non-manager assignees', async () => {
    db.user.findFirst.mockResolvedValue(null);
    await expect(
      service.update(10, { assignedToId: 99 }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('allows admin to unassign', async () => {
    await service.update(10, { assignedToId: null }, admin);
    expect(db.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedTo: { disconnect: true } }),
      }),
    );
  });
  it.each([user, manager])('denies deletion for $role', async (actor) => {
    await expect(service.remove(10, actor)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(db.ticket.delete).not.toHaveBeenCalled();
  });
  it('allows admin deletion', async () => {
    await service.remove(10, admin);
    expect(db.ticket.delete).toHaveBeenCalledWith({ where: { id: 10 } });
  });
  it('hides comments on inaccessible tickets', async () => {
    db.ticket.findFirst.mockResolvedValue(null);
    await expect(
      service.findComments(10, { page: 1, perPage: 20 }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.createComment(10, { content: 'Hello' }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.ticketComment.create).not.toHaveBeenCalled();
  });
  it('uses authenticated comment author', async () => {
    db.ticket.findFirst.mockResolvedValue({ id: 10 });
    await service.createComment(10, { content: ' Hello ' }, user);
    expect(db.ticketComment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: 'Hello',
          author: { connect: { id: 1 } },
        }),
      }),
    );
  });
  it('rejects blank comments', async () => {
    await expect(
      service.createComment(10, { content: '  ' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('scopes dashboard counts and returns zeros for empty statuses', async () => {
    db.ticket.groupBy
      .mockResolvedValueOnce([{ status: 'OPEN', _count: { _all: 2 } }])
      .mockResolvedValueOnce([{ priority: 'HIGH', _count: { _all: 2 } }]);
    const result = await service.statistics(user);
    expect(result.total).toBe(2);
    expect(result.byStatus.CLOSED).toBe(0);
    expect(db.ticket.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { createdById: 1 } }),
    );
  });
});
