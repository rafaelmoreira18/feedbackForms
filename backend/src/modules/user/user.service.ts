import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * holding_admin sees all users; hospital_admin sees only their own tenant.
   */
  async findAll(requestingUser: { role: string; tenantId: string | null }): Promise<Omit<User, 'password'>[]> {
    const where = requestingUser.role === 'holding_admin'
      ? {}
      : { tenantId: requestingUser.tenantId ?? undefined };
    const users = await this.userRepository.find({ where });
    return users.map(({ password, ...user }) => user);
  }
}
