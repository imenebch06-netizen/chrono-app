import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeService } from '../employe/employe.service';
import { PrismaService } from '../prisma/prisma.service'; // Injected pour vérifier rapidement le managerId
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeService: EmployeService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService, // 🔑 Injection de Prisma pour tester l'organisation gérée
  ) {}

  // =========================================================================
  // REGISTER
  // =========================================================================
  async register(registerDto: RegisterDto) {
    const existingEmploye = await this.employeService.findByEmail(registerDto.email);
    if (existingEmploye) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Création de l'utilisateur via le DTO
    const employe = await this.employeService.create(registerDto);

    // Vérification du statut Manager (généralement false à l'inscription)
    const isManager = await this.checkIfManager(employe.id);

    // Génération du token enrichi
    const token = this.generateToken(employe.id, employe.email, employe.role, isManager);

    return {
      user: { ...employe, isManager },
      access_token: token,
    };
  }

  // =========================================================================
  // LOGIN
  // =========================================================================
  async login(loginDto: LoginDto) {
    const employe = await this.employeService.findByEmail(loginDto.email);
    if (!employe) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, employe.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // 🔑 Vérification si cet employé est le responsable d'au moins une organisation
    const isManager = await this.checkIfManager(employe.id);

    // 🔑 Génération du token contenant role et isManager
    const token = this.generateToken(employe.id, employe.email, employe.role, isManager);

    // Suppression du mot de passe de la réponse
    const { password, ...employeWithoutPassword } = employe;

    return {
      user: { ...employeWithoutPassword, isManager },
      access_token: token,
    };
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Vérifie si un employé est désigné comme managerId dans une organisation
   */
  private async checkIfManager(employeId: number): Promise<boolean> {
    const managedOrg = await this.prisma.organization.findFirst({
      where: { managerId: employeId },
    });
    return !!managedOrg;
  }

  /**
   * Génère le token JWT complet avec rôle et statut manager
   */
  private generateToken(userId: number, email: string, role: string, isManager: boolean): string {
    const payload = {
      sub: userId,
      email,
      role,
      isManager,
    };
    return this.jwtService.sign(payload);
  }
}