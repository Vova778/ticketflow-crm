import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  it('delegates to the service', () => {
    const service = { findAll: jest.fn().mockReturnValue('result') };
    const controller = new UsersController(service as unknown as UsersService);
    expect(controller.findAll({ page: 1, perPage: 10 })).toBe('result');
    expect(service.findAll).toHaveBeenCalledWith({ page: 1, perPage: 10 });
  });
});
