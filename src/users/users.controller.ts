import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { TCurrentUser } from 'src/auth/types/current-user.type';
import { Public } from '../auth/decorators/public.decorator';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.registerUser(registerUserDto);
  }

  @Get('me')
  getCurrentUser(@CurrentUser() user: TCurrentUser) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
