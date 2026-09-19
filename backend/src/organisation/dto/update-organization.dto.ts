import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    description: "Nouveau nom de l'organisation ou du service",
    example: 'Direction Informatique & SSI',
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  nom_en?: string | null;

  @ApiPropertyOptional({
    description: "Nouvel ID du type/catégorie d'organisation",
    example: 2,
  })
  @IsOptional()
  @IsInt()
  typeOrganizationId?: number;

  @ApiPropertyOptional({
    description:
      "ID de la nouvelle organisation parente (permet de déplacer le nœud dans l'arborescence). Peut être mis à null.",
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  idOrganizationSup?: number | null;
}