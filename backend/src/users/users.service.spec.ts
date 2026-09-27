import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

describe('UsersService', () => {
  const db = {
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 1, role: 'ADMIN', isActive: true }),
      update: jest.fn(),
    },
  };
  const service = new UsersService(db as unknown as PrismaService);
  const admin = { id: 1, email: 'admin@test.test', role: 'ADMIN' as const };
  it('prevents self-deactivation', async () => {
    await expect(
      service.update(1, { isActive: false }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('prevents self-demotion', async () => {
    await expect(
      service.update(1, { role: 'USER' }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
