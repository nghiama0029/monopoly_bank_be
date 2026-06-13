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
import { AuthController, GameController, RoomController, AppController } from './controller';
import { GameGateway } from './gateway';
import { ConfigModule } from '@nestjs/config';
import { AuthService, GameService, RoomService } from './service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      url:
        process.env.DATABASE_URL ||
        'mysql://appuser:apppass@localhost:3306/appdb',
      entities: [User, Room, RoomUser, Property, RoomProperty, Transaction],
      autoLoadEntities: true,
      synchronize: true, // ❗ Dùng true khi dev, false khi production
      ssl:
        process.env.DB_SSL === 'true' ||
        (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('tidb'))
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
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
  providers: [GameGateway, AuthService, RoomService, GameService],
  controllers: [AuthController, RoomController, GameController, AppController],
})
export class AppModule {}
