import { AuthService } from '@/service';
import { Controller, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { nickname?: string; phone?: string }) {
    return this.authService.login(body);
  }
}
