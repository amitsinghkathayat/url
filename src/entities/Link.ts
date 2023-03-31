import { Entity, Column, PrimaryColumn, ManyToOne, Relation } from 'typeorm';
import { User } from './User';

@Entity()
export class Link {
  @PrimaryColumn()
  linkId: string;

  @Column()
  originalUrl: string;

  @Column({ default: 0 })
  numHits: number;

  @Column()
  lastAccessedOn: Date;

  @ManyToOne(() => User, (user) => user.links)
  user: Relation<User>;
}
