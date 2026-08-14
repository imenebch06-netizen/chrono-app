import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class AssignManagerDto {
  @ApiPropertyOptional({
    description:
      "ID de l'employé à désigner comme manager. Transmettre null ou ne rien passer pour libérer le poste (retirer le manager actuel).",
    example: 5,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  managerId?: number | null;
}