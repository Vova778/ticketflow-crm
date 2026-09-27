import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

describe('TicketsController', () => {
  it('delegates to the service', () => {
    const service = { findAll: jest.fn().mockReturnValue('result') };
    const controller = new TicketsController(
      service as unknown as TicketsService,
    );
    const user = { id: 1, email: 'a@test.test', role: 'USER' as const };
    expect(controller.findAll({ page: 1, perPage: 10 }, user)).toBe('result');
    expect(service.findAll).toHaveBeenCalledWith(
      { page: 1, perPage: 10 },
      user,
    );
  });
});
