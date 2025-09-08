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
      url: process.env.DATABASE_URL,
      entities: [User, Room, RoomUser, Property, RoomProperty, Transaction],
      autoLoadEntities: true,
      synchronize: true, // bật khi dev
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
