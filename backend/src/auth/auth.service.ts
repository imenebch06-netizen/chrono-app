import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeService } from '../employe/employe.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeService: EmployeService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingEmploye = await this.employeService.findByEmail(registerDto.email);
    if (existingEmploye) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const employe = await this.employeService.create(registerDto);

    const isManager = await this.checkIfManager(employe.id);

    const token = this.generateToken(employe.id, employe.email, employe.role, isManager);

    return {
      user: { ...employe, isManager },
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const employe = await this.employeService.findByEmail(loginDto.email);
    if (!employe) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, employe.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isManager = await this.checkIfManager(employe.id);

    const token = this.generateToken(employe.id, employe.email, employe.role, isManager);

    const { password, ...employeWithoutPassword } = employe;

    return {
      user: { ...employeWithoutPassword, isManager },
      access_token: token,
    };
  }


  private async checkIfManager(employeId: number): Promise<boolean> {
    const managedOrg = await this.prisma.organization.findFirst({
      where: { managerId: employeId },
    });
    return !!managedOrg;
  }

  private generateToken(userId: number, email: string, role: string, isManager: boolean): string {
    const payload = {
      sub: userId,
      email,
      role,
      isManager,
    };
    return this.jwtService.sign(payload);
  }

async forgotPassword(email: string): Promise<{ resetToken: string }> {
  const employe = await this.employeService.findByEmail(email);
  if (!employe) {
    throw new NotFoundException('Aucun compte associé à cet email');
  }

  const resetToken = this.jwtService.sign(
    { sub: employe.id, email: employe.email, purpose: 'RESET_PASSWORD' },
    { expiresIn: '15m' },
  );

  console.log(`Token de réinitialisation pour ${email}: ${resetToken}`);

  return { resetToken };
}

async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
  const { token, newPassword } = resetPasswordDto;

  try {
    const payload = this.jwtService.verify(token);

    if (payload.purpose !== 'RESET_PASSWORD') {
      throw new UnauthorizedException('Token invalide');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.employe.update({
      where: { id: payload.sub },
      data: { password: hashedPassword },
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  } catch (error) {
    throw new UnauthorizedException('Token expiré ou invalide');
  }
}

async verifyResetToken(token: string): Promise<{ valid: boolean }> {
  try {
    const payload = this.jwtService.verify(token);

    if (payload.purpose !== 'RESET_PASSWORD') {
      throw new UnauthorizedException('Token invalide');
    }

    return { valid: true };
  } catch (error) {
    throw new UnauthorizedException('Token expiré ou invalide');
  }
}
}
