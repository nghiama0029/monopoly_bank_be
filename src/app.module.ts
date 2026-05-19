import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Property,
  Room,
  RoomProperty,
  RoomUser,
  Transaction,
  User,
} from './entity';
import { AuthController, GameController, RoomController } from './controller';
import { GameGateway } from './gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      url: process.env.DATABASE_URL || 'mysql://appuser:apppass@localhost:3306/appdb',
      entities: [User, Room, RoomUser, Property, RoomProperty, Transaction],
      autoLoadEntities: true,
      synchronize: true, // ❗ Dùng true khi dev, false khi production
    }),
    TypeOrmModule.forFeature([
      User,
      Room,
      RoomUser,
      Property,
      RoomProperty,
      Transaction,
    ]),
  ],
  providers: [GameGateway],
  controllers: [AuthController, RoomController, GameController],
})
export class AppModule {}
