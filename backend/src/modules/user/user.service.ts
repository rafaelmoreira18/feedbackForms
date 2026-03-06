import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, User } from './user.entity';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const existingAdmin = await this.userRepository.findOne({
      where: { email: 'admin@hospital.com' },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = this.userRepository.create({
        email: 'admin@hospital.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'admin',
      });
      await this.userRepository.save(admin);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find();
    return users.map(({ password, ...user }) => user);
  }
}
