import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
//Importation des modules nécessaires pour le service d'authentification, y compris JwtService pour la gestion des tokens JWT et les exceptions pour gérer les erreurs d'authentification et de conflit
import * as bcrypt from 'bcrypt';
//Importation de bcrypt pour le hachage et la vérification des mots de passe
import { EmployeService } from '../employe/employe.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeService: EmployeService,
    private readonly jwtService: JwtService,
  ) {}
  // Méthode pour l'inscription d'un nouvel utilisateur
  async register(registerDto: RegisterDto) {
    const existingEmploye = await this.employeService.findByEmail(registerDto.email);
    if (existingEmploye) {
      throw new ConflictException('Cet email est déjà utilisé');
    }
    //Création d'un utilisateur employe grace au DTO 
    const employe = await this.employeService.create(registerDto);
    //Géneration du token
    const token = this.generateToken(employe.id, employe.email);

    return {
      user: employe,
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

    const token = this.generateToken(employe.id, employe.email);

    // Suppression du mot de passe de la réponse
    const { password, ...employeWithoutPassword } = employe;

    return {
      user: employeWithoutPassword,
      access_token: token,
    };
  }

  private generateToken(userId: number, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
