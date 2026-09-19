import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
export class ResetPasswordDto {
    @ApiProperty({
        description: 'Password reset token',
        example: 'abc123token',
    })
    @IsNotEmpty()
    @IsString()
    token!: string;

    @ApiProperty({
        description: 'New password',
        example: 'newPassword123',
    })
    @IsNotEmpty()
    @IsString()
    newPassword!: string;
}