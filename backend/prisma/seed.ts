import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.$transaction(async (tx) => {
    const admin = await tx.user.upsert({
      where: { email: 'admin@ticketflow.test' },
      update: {},
      create: {
        email: 'admin@ticketflow.test',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      },
    });

    const manager = await tx.user.upsert({
      where: { email: 'manager@ticketflow.test' },
      update: {},
      create: {
        email: 'manager@ticketflow.test',
        passwordHash,
        firstName: 'Manager',
        lastName: 'User',
        role: UserRole.MANAGER,
      },
    });

    const user = await tx.user.upsert({
      where: { email: 'user@ticketflow.test' },
      update: {},
      create: {
        email: 'user@ticketflow.test',
        passwordHash,
        firstName: 'Client',
        lastName: 'User',
        role: UserRole.USER,
      },
    });

    const existing = await tx.ticket.findFirst({
      where: { createdById: user.id },
    });
    if (existing) {
      console.log('Demo users ready; existing tickets preserved.');
      return;
    }

    const firstTicket = await tx.ticket.create({
      data: {
        title: 'Cannot login to dashboard',
        description:
          'User reports that they cannot login to the dashboard after password reset.',
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        createdById: user.id,
        assignedToId: manager.id,
      },
    });

    const secondTicket = await tx.ticket.create({
      data: {
        title: 'Billing page loads slowly',
        description:
          'The billing page takes more than 10 seconds to load for some users.',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.MEDIUM,
        createdById: user.id,
        assignedToId: manager.id,
      },
    });

    const thirdTicket = await tx.ticket.create({
      data: {
        title: 'Need access to reports',
        description:
          'Client asks to enable access to monthly analytics reports.',
        status: TicketStatus.WAITING_FOR_CLIENT,
        priority: TicketPriority.LOW,
        createdById: user.id,
        assignedToId: null,
      },
    });

    await tx.ticketComment.createMany({
      data: [
        {
          ticketId: firstTicket.id,
          authorId: user.id,
          content: 'I tried resetting the password, but login still fails.',
        },
        {
          ticketId: firstTicket.id,
          authorId: manager.id,
          content: 'Thanks, I will check the auth logs and get back to you.',
        },
        {
          ticketId: secondTicket.id,
          authorId: manager.id,
          content: 'I can reproduce the issue. Looks like a slow DB query.',
        },
        {
          ticketId: thirdTicket.id,
          authorId: admin.id,
          content: 'Please confirm which reports should be enabled.',
        },
      ],
    });

    console.log('Seed completed successfully');
    console.log({
      users: {
        admin: admin.email,
        manager: manager.email,
        user: user.email,
      },
      password: 'password123',
      tickets: [firstTicket.id, secondTicket.id, thirdTicket.id],
    });
  });
}

main()
  .catch((error) => {
    console.error('Seed failed');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
