import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UserService {
  private users: User[] = [];

  constructor() {
    this.seedAdmin();
  }

  private async seedAdmin() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    this.users.push({
      id: '1',
      email: 'admin@hospital.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'admin',
    });
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  findAll(): Omit<User, 'password'>[] {
    return this.users.map(({ password, ...user }) => user);
  }
}
