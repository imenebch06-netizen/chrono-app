import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatutDemande } from './create-demande-absence.dto';

export class UpdateStatusDto {
  @ApiProperty({ enum: StatutDemande, example: StatutDemande.VALIDE })
  @IsEnum(StatutDemande)
  @IsNotEmpty()
  status!: StatutDemande;
}