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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '3306', 10),
      username: process.env.DATABASE_USER || 'appuser',
      password: process.env.DATABASE_PASSWORD || 'apppass',
      database: process.env.DATABASE_NAME || 'appdb',
      entities: [User, Room, RoomUser, Property, RoomProperty, Transaction],
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
