import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Développement Informatique',
    description: 'Nom du service',
  })
  @IsString()
  @IsNotEmpty()
  nom_service!: string;

  @ApiProperty({
    example: 1,
    description: 'Identifiant de la direction à laquelle appartient le service',
  })
  @IsInt()
  @IsNotEmpty()
  directionId!: number;
  @ApiProperty({
    example: 1,
    description: 'ID du manager du service',
  })
  @IsNotEmpty()
  managerId: any;
}
