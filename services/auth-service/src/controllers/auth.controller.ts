import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthService } from '../auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'register' })
  async register(@Payload() data: CreateUserDto) {
    try {
      return await this.authService.createUser(data);
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() data: LoginDto) {
    try {
      const user = await this.authService.validateUser(data.email, data.password);
      if (!user) {
        throw new RpcException('Invalid email or password');
      }
      return await this.authService.login(user);
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw new RpcException(error.message);
    }
  }
}
