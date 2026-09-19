import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateCompteurDto {
  @ApiPropertyOptional({ example: 25.0, description: 'Nouveau solde de congés payés (jours)' })
  @IsNumber()
  @IsOptional()
  solde_conges?: number;

  @ApiPropertyOptional({ example: 7.0, description: 'Nouveau solde RTT (heures)' })
  @IsNumber()
  @IsOptional()
  solde_rtt?: number;

  @ApiPropertyOptional({ example: 0.0, description: 'Réajustement du crédit/débit mensuel' })
  @IsNumber()
  @IsOptional()
  credit_debit?: number;
}
