import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
//Module de connexion grace au saisie d'email et du mdp

export class LoginDto {
  @ApiProperty({ example: 'admin@entreprise.com', description: 'Email de connexion' })
  @IsEmail({}, { message: "L'email doit être valide." })
  @IsNotEmpty({ message: "L'email est obligatoire." })
  email!: string;

  @ApiProperty({ example: 'Password123!', description: 'Mot de passe' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  password!: string;
}
