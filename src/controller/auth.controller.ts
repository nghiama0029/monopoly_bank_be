import { User } from '@/entity';
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Post('login')
  async login(@Body() body: { nickname?: string; phone?: string }) {
    if (!body.nickname && !body.phone) {
      throw new BadRequestException('Nickname hoặc phone là bắt buộc');
    }

    let user = await this.userRepo.findOne({
      where: [{ nickname: body.nickname ?? '' }, { phone: body.phone ?? '' }],
    });

    if (!user) {
      user = this.userRepo.create({
        nickname: body.nickname ?? `user_${Date.now()}`,
        phone: body.phone,
      });
      await this.userRepo.save(user);
    }

    return {
      message: 'Login thành công',
      user,
    };
  }
}
