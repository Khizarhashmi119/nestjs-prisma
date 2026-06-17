import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { EnvSchema } from 'src/config/env.schema';
import { DatabaseService } from '../common/database.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService<EnvSchema, true>,
  ) {}

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, firstName, lastName, password } = registerUserDto;

    const user = await this.databaseService.user.findFirst({
      where: {
        email,
      },
    });

    if (user) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await argon2.hash(password, {
      secret: Buffer.from(this.configService.get('ARGON2_SECRET')),
    });

    const newUser = await this.databaseService.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: passwordHash,
        role: {
          connect: {
            name: 'USER',
          },
        },
      },
      omit: {
        password: true,
      },
      include: {
        role: true,
      },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role.name,
    };
  }
}
