import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client'; // 👈 Import de l'Enum généré par Prisma

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

  @ApiPropertyOptional({
    enum: Role,
    default: Role.EMPLOYE,
    description: "Rôle de l'employé dans le système",
  })
  @IsEnum(Role, { message: 'Le rôle doit être EMPLOYE, MANAGER ou ADMIN.' })
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ example: 1, description: 'ID du service rattaché' })
  @IsInt()
  @IsNotEmpty()
  serviceId?: number;

  @ApiPropertyOptional({ example: 2, description: 'ID du manager hiérarchique' })
  @IsInt()
  @IsOptional()
  managerId?: number;
}
