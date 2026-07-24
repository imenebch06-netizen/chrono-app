import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EmployeService } from 'src/employe/employe.service';

// 1. Déclaration du Payload directement ici
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // 2. Le constructeur avec l'injection du service (EmployeService dans notre projet)
  constructor(private readonly employeService: EmployeService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'CLE_PAR_DEFAUT_DEV',
    });
  }

  // 3. La méthode validate() that validates the JWT payload and returns the user from the database
  async validate(payload: JwtPayload) {
    // Les données retournées ici seront injectées automatiquement dans req.user
    const user = await this.employeService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...result } = user as any; // Exclude password from the returned user object
    return result;
  }
}
