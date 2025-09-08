import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RoomProperty } from './room-property.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  rent: number;

  @Column()
  mortgageValue: number;

  @OneToMany(() => RoomProperty, (rp) => rp.property)
  roomProperties: RoomProperty[];
}
