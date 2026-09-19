import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EmployeService } from '../../employe/employe.service';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  isManager: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly employeService: EmployeService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'CLE_PAR_DEFAUT_DEV',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.employeService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return {
      ...user,
      role: payload.role,
      isManager: payload.isManager ?? false,
    };
  }
}