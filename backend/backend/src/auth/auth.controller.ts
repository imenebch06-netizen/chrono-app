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
  Query
} from '@nestjs/common';
import express from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inscription d’un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Compte créé avec succès.' })
  @ApiResponse({ status: 400, description: 'Données de formulaire invalides.' })
  @ApiResponse({ status: 409, description: 'Cet email est déjà utilisé.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur et récupération du token' })
  @ApiResponse({ status: 200, description: 'Connexion réussie.' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir le profil de l’utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès.' })
  @ApiResponse({ status: 401, description: 'Non autorisé (Token manquant ou invalide).' })
  getProfile(@Request() req) {
    return {
      message: 'Vous êtes connecté',
      user: req.user,
    };
  }
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  @ApiResponse({ status: 200, description: 'Lien/Token généré avec succès.' })
  @ApiResponse({ status: 404, description: 'Aucun compte associé à cet email.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialisation du mot de passe avec le token JWT' })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié avec succès.' })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }


  @Get('verify-reset-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier la validité du token de réinitialisation' })
  @ApiResponse({ status: 200, description: 'Token valide.' })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré.' })
  async verifyResetToken(@Query('token') token: string) {
    return this.authService.verifyResetToken(token);
  }
}

