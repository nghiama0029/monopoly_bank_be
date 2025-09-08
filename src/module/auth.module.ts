import { Module } from '@nestjs/common';
import { AuthController } from '@/controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
})
export class AuthModule {}
