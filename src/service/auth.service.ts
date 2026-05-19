import { User } from '@/entity';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async login(body: { nickname?: string; phone?: string }) {
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
