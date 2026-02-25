import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const createdUser = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
    });

    const saved = await createdUser.save();
    const { password, ...userWithoutPassword } = saved.toObject();
    return userWithoutPassword;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).select('+password');
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('-password').exec();
  }
}
