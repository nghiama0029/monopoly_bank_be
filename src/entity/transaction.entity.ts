import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';

export type TTransactionType =
  | 'pass_start'
  | 'buy'
  | 'rent'
  | 'tax'
  | 'trade'
  | 'mortgage'
  | 'redeem';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Room, (room) => room.transactions, { onDelete: 'CASCADE' })
  room: Room;

  @ManyToOne(() => User, (user) => user.transactionsFrom, { nullable: true })
  fromUser: User;

  @ManyToOne(() => User, (user) => user.transactionsTo, { nullable: true })
  toUser: User;

  @Column()
  amount: number;

  @Column({
    type: 'enum',
    enum: ['pass_start', 'buy', 'rent', 'tax', 'trade', 'mortgage', 'redeem'],
  })
  type: TTransactionType;

  @CreateDateColumn()
  createdAt: Date;
}
