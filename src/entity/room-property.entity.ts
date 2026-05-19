import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Room } from './room.entity';
import { Property } from './property.entity';
import { User } from './user.entity';

@Entity('room_properties')
export class RoomProperty {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Room, (room) => room.roomProperties, { onDelete: 'CASCADE' })
  room: Room;

  @ManyToOne(() => Property, (property) => property.roomProperties)
  property: Property;

  @ManyToOne(() => User, (user) => user.properties, { nullable: true })
  owner: User | null;

  @Column({ default: false })
  mortgaged: boolean;
}
