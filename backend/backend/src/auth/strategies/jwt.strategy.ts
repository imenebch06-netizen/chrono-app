import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EmployeService } from '../../employe/employe.service'; // Chemin ajusté

// 🔑 1. Interface enrichie avec "role" et "isManager"
export interface JwtPayload {
  sub: number;       // ID de l'employé
  email: string;     // Email
  role: string;      // EMPLOYE ou ADMIN
  isManager: boolean;// true si responsable d'une organisation
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly employeService: EmployeService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'CLE_PAR_DEFAUT_DEV',
    });
  }

  // 🔑 2. La méthode validate() réinjecte ces infos dans req.user
  async validate(payload: JwtPayload) {
    const user = await this.employeService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    // req.user contiendra les données du profil + le rôle et le statut manager issus du token
    return {
      ...user,
      role: payload.role,
      isManager: payload.isManager ?? false,
    };
  }
}