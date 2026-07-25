import { ExtractJwt, Strategy } from 'passport-jwt';
//Importation de la stratégie JWT et des fonctions d'extraction du token JWT depuis le module passport-jwt
import { PassportStrategy } from '@nestjs/passport';
//Importation des modules nécessaires pour la stratégie JWT, y compris PassportStrategy et les fonctions d'extraction du token JWT
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EmployeService } from 'src/employe/employe.service';

// 1. Déclaration du Payload directement ici: son interface définit la structure des données contenues dans le JWT
export interface JwtPayload {
  sub: number;// L'identifiant de l'utilisateur (employé) dans la base de données
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // 2. Le constructeur avec l'injection du service (EmployeService dans notre projet)
  constructor(private readonly employeService: EmployeService) {
    super({
      // Configuration de la stratégie JWT, y compris l'extraction du token depuis l'en-tête Authorization et la clé secrète pour vérifier le token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // La clé secrète utilisée pour vérifier la signature du token JWT. Elle est définie dans le fichier .env
      secretOrKey: process.env.JWT_SECRET || 'CLE_PAR_DEFAUT_DEV',
    });
  }

  // 3. La méthode validate() qui est appelée automatiquement par Passport après la vérification du token JWT. Elle reçoit le payload décodé du token et doit retourner les informations de l'utilisateur (employé) correspondant.
  async validate(payload: JwtPayload) {
    // Les données retournées ici seront injectées automatiquement dans req.user
    const user = await this.employeService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...result } = user as any; // Exclusion du mot de passe de l'objet user avant de le retourner
    return result;
  }
}
