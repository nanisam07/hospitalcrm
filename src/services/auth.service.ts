import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { LoginDto, RegisterDto } from '../validators/auth.validator';
import logger from '../config/logger';

export class AuthService {
  private userRepository: UserRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.auditRepository = new AuditRepository();
  }

  async login(credentials: LoginDto) {
    const { email, password } = credentials;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Failed login attempt for email: ${email} - User not found`);
      throw new Error('Invalid email or password');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      logger.warn(`Failed login attempt for email: ${email} - Password mismatch`);
      throw new Error('Invalid email or password');
    }

    const secret = process.env.JWT_SECRET || 'supersecret';
    const expires = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      secret,
      { expiresIn: expires as any }
    );

    // Audit Log
    const roleString = user.role.toString();
    await this.auditRepository.log(
      user.id,
      roleString,
      `${roleString.charAt(0) + roleString.slice(1).toLowerCase()} Login`,
      `User ${user.email} successfully logged in.`
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(data: RegisterDto, actorId: string, actorRole: string) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    });

    await this.auditRepository.log(
      actorId,
      actorRole,
      'User Registered',
      `Registered new user ${newUser.email} with role ${newUser.role} by ${actorId}.`
    );

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };
  }
}
export default AuthService;
