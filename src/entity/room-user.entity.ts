import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';

export type TColor = 'red' | 'blue' | 'green' | 'yellow';

@Entity('room_users')
export class RoomUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Room, (room) => room.roomUsers, { onDelete: 'CASCADE' })
  room: Room;

  @ManyToOne(() => User, (user) => user.roomUsers, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: 2000 })
  balance: number;

  @Column({
    default: 'red',
    type: 'enum',
    enum: ['red', 'blue', 'green', 'yellow'],
  })
  color: TColor;

  @CreateDateColumn()
  joinedAt: Date;
}
