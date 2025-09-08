import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { RoomUser } from './room-user.entity';
import { RoomProperty } from './room-property.entity';
import { Transaction } from './transaction.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'int' })
  currentTurnUserId: number | null;

  @ManyToOne(() => User, (user) => user.createdRooms)
  createdBy: User;

  @Column({
    type: 'enum',
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting',
  })
  status: 'waiting' | 'playing' | 'finished';

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => RoomUser, (ru) => ru.room, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  roomUsers: RoomUser[];

  @OneToMany(() => RoomProperty, (rp) => rp.room, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  roomProperties: RoomProperty[];

  @OneToMany(() => Transaction, (t) => t.room, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  transactions: Transaction[];

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: 2000 })
  balance: number;
}
