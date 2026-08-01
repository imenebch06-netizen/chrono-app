import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDirectionDto {
  @ApiProperty({
    example: 'Direction des Ressources Humaines',
    description: 'Nom de la direction',
  })
  @IsString()
  @IsNotEmpty()
  nom_direction!: string;
}
