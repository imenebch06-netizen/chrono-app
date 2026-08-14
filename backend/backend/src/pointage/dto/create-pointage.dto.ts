import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePointageDto {
  @ApiProperty({ example: 1, description: "ID de l'employé" })
  @IsInt()
  @IsNotEmpty()
  employeId!: number;

  @ApiProperty({ example: '08:00', description: "Heure d'arrivée (HH:mm)" })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Format HH:mm requis (ex: '08:00')" })
  heureDebut!: string;

  @ApiPropertyOptional({ example: '17:30', description: 'Heure de départ (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Format HH:mm requis (ex: '17:30')" })
  heureFin?: string;

  @ApiProperty({ example: '2026-07-31', description: 'Date du pointage (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La date doit être au format YYYY-MM-DD' })
  date!: string;
}
