import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
/*Garde d'authentification JWT pour protéger les routes nécessitant une authentification:
le but et prendre la decision finale d'avoir un accès ou non a une route en fonction de 
la validité du token JWT fourni par le client*/
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
