import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '@/entity';
import { RoomController } from '@/controller';

@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  controllers: [RoomController],
})
export class RoomModule {}
