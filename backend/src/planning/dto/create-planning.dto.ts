import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreatePlanningDto {
  @ApiProperty({ example: 1, description: "ID de l'employé concerné" })
  @IsInt()
  @IsNotEmpty()
  employeId!: number;

  @ApiProperty({
    example: '2026-08-01T00:00:00.000Z',
    description: 'Début de la période de planning',
  })
  @IsDateString()
  @IsNotEmpty()
  dateDebut!: string;

  @ApiProperty({
    example: '2026-08-31T23:59:59.000Z',
    description: 'Fin de la période de planning',
  })
  @IsDateString()
  @IsNotEmpty()
  dateFin!: string;

  @ApiProperty({
    example: 'SHIFT_3X8',
    description: 'Type de régination : NORMAL, SHIFT_3X8, FLEXIBLE, REPOS',
  })
  @IsString()
  @IsNotEmpty()
  type_travail!: string; // 'NORMAL' | 'SHIFT_3X8' | 'FLEXIBLE' | 'REPOS'

  // ──── 1. HORAIRES CLASSIQUES OU DE SHIFT ────
  @ApiPropertyOptional({
    example: '06:00',
    description: 'Heure de début théorique / du shift',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Format HH:mm attendu (ex: '06:00')",
  })
  heureDebut?: string;

  @ApiPropertyOptional({
    example: '14:00',
    description: 'Heure de fin théorique / du shift',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Format HH:mm attendu (ex: '14:00')",
  })
  heureFin?: string;

  // ──── 2. OPTION POUR MODE 3X8 (SHIFTS) ────
  @ApiPropertyOptional({
    example: 'MATIN',
    description: 'Type de shift si 3x8 : MATIN, SOIR, NUIT',
  })
  @IsOptional()
  @IsString()
  typeShift?: string; // 'MATIN' | 'SOIR' | 'NUIT'

  // ──── 3. OPTION POUR HORAIRES FLEXIBLES (PLAGE FIXE) ────
  @ApiPropertyOptional({
    example: '09:30',
    description: 'Début de la plage de présence obligatoire (Horaires flexibles)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  plageFixeDebut?: string;

  @ApiPropertyOptional({
    example: '15:30',
    description: 'Fin de la plage de présence obligatoire (Horaires flexibles)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  plageFixeFin?: string;

  // ──── 4. JOURS DE REPOS ────
  @ApiPropertyOptional({
    example: [5, 6],
    description: 'Jours de repos (0=Dimanche, 1=Lundi, ..., 6=Samedi)',
  })
  @IsOptional()
  joursRepos?: number[] | string;
}