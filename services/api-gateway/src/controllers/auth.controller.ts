import { Controller, Post, Body, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: CreateUserDto) {
    try {
      const response = await firstValueFrom(
        this.authService.send({ cmd: 'register' }, registerDto).pipe(
          timeout(5000),
        ),
      );
      return response;
    } catch (error) {
      const status = error.message?.includes('already exists')
        ? HttpStatus.CONFLICT
        : HttpStatus.BAD_REQUEST;
      throw new HttpException(error.message || 'Registration failed', status);
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    try {
      const response = await firstValueFrom(
        this.authService.send({ cmd: 'login' }, loginDto).pipe(
          timeout(5000),
        ),
      );
      return response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
