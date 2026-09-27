import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  it('delegates to the service', () => {
    const service = { getMe: jest.fn().mockReturnValue('result') };
    const controller = new AuthController(service as unknown as AuthService);
    expect(controller.me({ id: 1, email: 'a@test.test', role: 'USER' })).toBe(
      'result',
    );
    expect(service.getMe).toHaveBeenCalledWith(1);
  });
});
