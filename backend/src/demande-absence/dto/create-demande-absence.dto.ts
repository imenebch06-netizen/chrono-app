import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsDateString,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
export enum StatutDemande {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE',
}

export enum TypeDemande {
  CONGE = 'CONGE',
  ABSENCE = 'ABSENCE',
  RECUPERATION = 'RECUPERATION',
}

export class CreateDemandeAbsenceDto {
  @ApiProperty({ enum: TypeDemande, example: TypeDemande.CONGE })
  @IsEnum(TypeDemande)
  @IsNotEmpty()
  typeDemande!: TypeDemande;

  @ApiProperty({ example: '2026-08-01T08:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  dateDebut!: string;

  @ApiProperty({ example: '2026-08-15T18:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  dateFin!: string;

  @ApiProperty({ example: 'Congés annuels payés' })
  @IsString()
  @IsNotEmpty()
  motif!: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Pièce jointe / Justificatif (JPG, PNG)',
  })
  @IsOptional()
  justificatif?: any;

  @ApiProperty({ example: 1, description: "ID de l'employé" })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  employeId?: number;

  // Champs spécifiques selon l'héritage UML
  @ApiPropertyOptional({ example: 'Payé', description: 'Requis si CONGE' })
  @IsString()
  @IsOptional()
  type_conge?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined; // Si vide ou indéfini
  })
  @IsBoolean({ message: 'justifie doit être un booléen (true ou false)' })
  justifie?: boolean;

  @ApiPropertyOptional({ example: 7.5, type: Number })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return isNaN(parsed) ? value : parsed; // Convertit "7.5" en 7.5
  })
  @IsNumber({}, { message: 'heures_a_recuperer doit être un nombre valide' })
  heures_a_recuperer?: number;
}
