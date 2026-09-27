import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';

describe('AuthService', () => {
  const db = { user: { findUnique: jest.fn() } };
  const service = new AuthService(
    db as unknown as PrismaService,
    new JwtService(),
  );
  it('rejects duplicate registration', async () => {
    db.user.findUnique.mockResolvedValue({ id: 1 });
    await expect(
      service.register({ email: 'a@test.test', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects unknown credentials', async () => {
    db.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'a@test.test', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('rejects inactive users', async () => {
    db.user.findUnique.mockResolvedValue({ isActive: false });
    await expect(
      service.login({ email: 'a@test.test', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
