import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TicketStatus,
  UserRole,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListTicketsQueryDto, currentUser: AuthUser) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 10;
    const skip = (page - 1) * perPage;

    const where: Prisma.TicketWhereInput = {
      AND: [
        this.getVisibilityWhere(currentUser),
        this.getFiltersWhere(query, currentUser),
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: perPage,
        orderBy: {
          createdAt: 'desc',
        },
        select: this.getTicketListSelect(),
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async findOne(id: number, currentUser: AuthUser) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id,
        AND: [this.getVisibilityWhere(currentUser)],
      },
      select: this.getTicketDetailsSelect(),
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async create(dto: CreateTicketDto, currentUser: AuthUser) {
    const assignedToId = await this.resolveAssignedToIdOnCreate(
      dto.assignedToId,
      currentUser,
    );

    return this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        createdById: currentUser.id,
        assignedToId,
      },
      select: this.getTicketDetailsSelect(),
    });
  }

  async update(id: number, dto: UpdateTicketDto, currentUser: AuthUser) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdById: true,
        assignedToId: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!this.canAccessTicket(ticket, currentUser)) {
      throw new NotFoundException('Ticket not found');
    }

    const data = await this.resolveUpdateData(dto, ticket, currentUser);

    return this.prisma.ticket.update({
      where: { id },
      data,
      select: this.getTicketDetailsSelect(),
    });
  }

  async remove(id: number, currentUser: AuthUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can delete tickets');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    await this.prisma.ticket.delete({
      where: { id },
    });

    return {
      message: 'Ticket deleted successfully',
    };
  }

  private getVisibilityWhere(currentUser: AuthUser): Prisma.TicketWhereInput {
    if (currentUser.role === UserRole.ADMIN) {
      return {};
    }

    if (currentUser.role === UserRole.MANAGER) {
      return {
        OR: [
          {
            assignedToId: currentUser.id,
          },
          {
            assignedToId: null,
          },
        ],
      };
    }

    return {
      createdById: currentUser.id,
    };
  }

  private getFiltersWhere(
    query: ListTicketsQueryDto,
    currentUser: AuthUser,
  ): Prisma.TicketWhereInput {
    const filters: Prisma.TicketWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    if (currentUser.role === UserRole.ADMIN) {
      return {
        ...filters,
        ...(query.createdById ? { createdById: query.createdById } : {}),
        ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
      };
    }

    if (currentUser.role === UserRole.MANAGER) {
      return {
        ...filters,
        ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
      };
    }

    return filters;
  }

  private canAccessTicket(
    ticket: {
      createdById: number;
      assignedToId: number | null;
    },
    currentUser: AuthUser,
  ): boolean {
    if (currentUser.role === UserRole.ADMIN) {
      return true;
    }

    if (currentUser.role === UserRole.MANAGER) {
      return ticket.assignedToId === currentUser.id || ticket.assignedToId === null;
    }

    return ticket.createdById === currentUser.id;
  }

  private async resolveAssignedToIdOnCreate(
    assignedToId: number | undefined,
    currentUser: AuthUser,
  ): Promise<number | null | undefined> {
    if (currentUser.role === UserRole.USER) {
      return null;
    }

    if (currentUser.role === UserRole.MANAGER) {
      if (!assignedToId) {
        return currentUser.id;
      }

      if (assignedToId !== currentUser.id) {
        throw new ForbiddenException('Manager can only assign tickets to themselves');
      }

      return assignedToId;
    }

    if (!assignedToId) {
      return null;
    }

    await this.ensureManagerExists(assignedToId);

    return assignedToId;
  }

  private async resolveUpdateData(
    dto: UpdateTicketDto,
    ticket: {
      status: TicketStatus;
      createdById: number;
      assignedToId: number | null;
    },
    currentUser: AuthUser,
  ): Promise<Prisma.TicketUpdateInput> {
    if (currentUser.role === UserRole.ADMIN) {
      if (dto.assignedToId !== undefined && dto.assignedToId !== null) {
        await this.ensureManagerExists(dto.assignedToId);
      }

      return {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assignedTo: this.resolveAssignedToRelation(dto.assignedToId),
      };
    }

    if (currentUser.role === UserRole.MANAGER) {
      if (dto.assignedToId !== undefined && dto.assignedToId !== currentUser.id) {
        throw new ForbiddenException('Manager can only assign tickets to themselves');
      }

      return {
        status: dto.status,
        priority: dto.priority,
        assignedTo: this.resolveAssignedToRelation(dto.assignedToId),
      };
    }

    if (ticket.createdById !== currentUser.id) {
      throw new ForbiddenException('You can only update your own tickets');
    }

    if (ticket.status !== TicketStatus.OPEN) {
      throw new BadRequestException('Only OPEN tickets can be edited by user');
    }

    if (dto.status || dto.priority || dto.assignedToId !== undefined) {
      throw new ForbiddenException(
        'User can only update title and description of own OPEN tickets',
      );
    }

    return {
      title: dto.title,
      description: dto.description,
    };
  }

  private resolveAssignedToRelation(assignedToId: number | null | undefined) {
    if (assignedToId === undefined) {
      return undefined;
    }

    if (assignedToId === null) {
      return {
        disconnect: true,
      };
    }

    return {
      connect: {
        id: assignedToId,
      },
    };
  }

  private async ensureManagerExists(managerId: number) {
    const manager = await this.prisma.user.findFirst({
      where: {
        id: managerId,
        role: UserRole.MANAGER,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!manager) {
      throw new BadRequestException('Assigned manager not found');
    }
  }

  private getTicketListSelect() {
    return {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: this.getUserSelect(),
      },
      assignedTo: {
        select: this.getUserSelect(),
      },
      _count: {
        select: {
          comments: true,
        },
      },
    } satisfies Prisma.TicketSelect;
  }

  private getTicketDetailsSelect() {
    return {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: this.getUserSelect(),
      },
      assignedTo: {
        select: this.getUserSelect(),
      },
      comments: {
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: this.getUserSelect(),
          },
        },
      },
    } satisfies Prisma.TicketSelect;
  }

  private getUserSelect() {
    return {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    } satisfies Prisma.UserSelect;
  }
}