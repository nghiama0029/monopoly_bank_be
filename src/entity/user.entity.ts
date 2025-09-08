import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Room } from './room.entity';
import { RoomUser } from './room-user.entity';
import { RoomProperty } from './room-property.entity';
import { Transaction } from './transaction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nickname: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 2000 })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Room, (room) => room.createdBy)
  createdRooms: Room[];

  @OneToMany(() => RoomUser, (ru) => ru.user)
  roomUsers: RoomUser[];

  @OneToMany(() => RoomProperty, (rp) => rp.owner)
  properties: RoomProperty[];

  @OneToMany(() => Transaction, (t) => t.fromUser)
  transactionsFrom: Transaction[];

  @OneToMany(() => Transaction, (t) => t.toUser)
  transactionsTo: Transaction[];
}
