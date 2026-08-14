import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({
    description: "Nom de l'organisation, de la direction ou du service",
    example: 'Direction des Ressources Humaines',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom de l’organisation est obligatoire.' })
  nom!: string;

  @ApiProperty({
    description: "ID de la catégorie/type d'organisation (ex: 1 pour Direction, 2 pour Service)",
    example: 1,
  })
  @IsInt()
  @IsNotEmpty({ message: 'Le type d’organisation (typeOrganizationId) est obligatoire.' })
  typeOrganizationId!: number;

  @ApiPropertyOptional({
    description:
      "ID de l'organisation parente. À laisser vide uniquement pour le nœud racine (ex: Direction Générale)",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  idOrganizationSup?: number;

  @ApiPropertyOptional({
    description: "ID de l'employé responsable (Manager) de cette organisation",
    example: 5,
  })
  @IsOptional()
  @IsInt()
  managerId?: number;
}