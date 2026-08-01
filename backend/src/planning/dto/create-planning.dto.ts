import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsString, Matches } from 'class-validator';

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

  @ApiProperty({ example: '08:00', description: 'Heure de début théorique (Format HH:mm)' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Heure au format HH:mm attendu (ex: '08:00')",
  })
  heureDebut!: string;

  @ApiProperty({ example: '16:00', description: 'Heure de fin théorique (Format HH:mm)' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Heure au format HH:mm attendu (ex: '16:00')",
  })
  heureFin!: string;

  @ApiProperty({ example: 'NORMAL', description: 'Type de journée : NORMAL, REPOS ou POSTE_NUIT' })
  @IsString()
  @IsNotEmpty()
  type_travail!: string;

  @ApiProperty({
    example: [5, 6],
    description: 'Jours de repos pour le planning (0=Dimanche, 1=Lundi, ..., 6=Samedi)',
    required: false,
  })
  @IsInt({ each: true })
  @IsNotEmpty()
  joursRepos!: number[] | string;
}
