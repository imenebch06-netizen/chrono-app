import {
  Controller,
  HttpStatus,
  Post,
  Get,
  HttpCode,
  Body,
  Request,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import express from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentification') // Regroupe toutes ces routes sous l'onglet "Authentification" dans Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // Limitation du nombre de requêtes pour éviter les abus (5 requêtes par minute - par éxemple)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  // Route pour l'inscription d'un nouvel utilisateur
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inscription d’un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Compte créé avec succès.' })
  @ApiResponse({ status: 400, description: 'Données de formulaire invalides.' })
  @ApiResponse({ status: 409, description: 'Cet email est déjà utilisé.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  // Route pour la connexion d'un utilisateur existant
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur et récupération du token' })
  @ApiResponse({ status: 200, description: 'Connexion réussie.' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  // Route protégée pour obtenir le profil de l'utilisateur connecté: ceci necessite un token JWT valide dans l'en-tête Authorization(et on remarquera qu'on doit d'abord récupérer le token via swagger UI ou via la route /login)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth() // Affiche le petit cadenas dans Swagger UI pour insérer le jeton JWT
  @ApiOperation({ summary: 'Obtenir le profil de l’utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès.' })
  @ApiResponse({ status: 401, description: 'Non autorisé (Token manquant ou invalide).' })
  getProfile(@Request() req) {
    return {
      message: 'Vous êtes connecté',
      user: req.user,
    };
  }
  // Route pour récupérer le token CSRF global (utile pour les formulaires côté client, et assure la protection contre les attaques CSRF)
  @Get('csrf-token')
  @ApiOperation({ summary: 'Récupérer le token CSRF global' })
  getCsrfToken(@Req() req: any, @Res() res: express.Response) {
    const csrfToken = req.csrfToken ? req.csrfToken() : '';
    return res.json({ csrfToken });
  }
}
