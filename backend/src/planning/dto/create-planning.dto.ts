import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';


export class CreatePlanningItemDto {
  @ApiProperty({ example: 24, description: "ID de l'employé concerné" })
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
    example: 'NORMAL',
    description:'Type de régime : NORMAL, SHIFT_3X8, SHIFT_4X6, WEEKEND_FERIE, CONTINGENCE, FLEXIBLE',
  })
  @IsString()
  @IsNotEmpty()
  type_travail!: string;

  @ApiPropertyOptional({ example: '08:00', description: 'Heure de début' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  heureDebut?: string;

  @ApiPropertyOptional({ example: '16:00', description: 'Heure de fin' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  heureFin?: string;

  @ApiPropertyOptional({example: 'NUIT_PROFONDE',
    description:
      '3X8: MATIN, SOIR, NUIT | 4X6: NUIT_PROFONDE, MATIN, APRES_MIDI, SOIR | Spéciaux: WEEKEND, MAREE', })
  @IsOptional()
  @IsString()
  typeShift?: string;

  @ApiPropertyOptional({ example: '09:30' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  plageFixeDebut?: string;

  @ApiPropertyOptional({ example: '15:30' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  plageFixeFin?: string;

  @ApiPropertyOptional({ example: [5, 6], description: 'Jours de repos' })
  @IsOptional()
  joursRepos?: number[] | string;
}


export class CreatePlanningDto {
  @ApiProperty({
    type: [CreatePlanningItemDto],
    description: 'Liste des plannings à attribuer',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlanningItemDto)
  planning!: CreatePlanningItemDto[];
}