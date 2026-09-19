import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsNumber, 
  ValidateIf
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
export class CreateEmployeDto {
  @ApiProperty({ example: 'Benali', description: "Nom de famille de l'employé" })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  nom!: string;

  @ApiProperty({ example: 'Karim', description: "Prénom de l'employé" })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire.' })
  prenom!: string;

  @ApiProperty({ example: 'karim.benali@example.com', description: "Email unique de l'employé" })
  @IsEmail({}, { message: "L'email doit être valide." })
  @IsNotEmpty({ message: "L'email est obligatoire." })
  email!: string;

  @ApiProperty({ example: 'MotDePasse123!', description: 'Mot de passe (minimum 6 caractères)' })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  password!: string;

  @ApiPropertyOptional({ example: 'Alger, Algérie', description: 'Adresse résidentielle' })
  @IsString()
  @IsOptional()
  adress?: string;
  
  @ApiPropertyOptional({ example: 'Algiers, Algeria', description: 'Adresse (EN)' })
  @IsString()
  @IsOptional()
  adress_en?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.EMPLOYE,
    description: "Rôle de l'employé dans le système",
  })
  @IsEnum(Role, { message: 'Le rôle doit être EMPLOYE, MANAGER ou ADMIN.' })
  @IsOptional()
  role?: Role;

  @IsOptional()
  @ValidateIf((object, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({}, { message: 'organizationId doit être un nombre' })
  organizationId?: number | null;

}
