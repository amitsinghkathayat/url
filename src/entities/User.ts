import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Relation } from 'typeorm';
import { Link } from './Link';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isPro: boolean;

  @OneToMany(() => Link, (link) => link.user)
  links: Relation<Link>[];
}
