import { IsString, IsNotEmpty, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    description: 'Username for authentication',
    example: 'ana_estudiante',
    minLength: 3,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  username: string;

  @ApiProperty({ 
    description: 'User password',
    example: 'demo123',
    minLength: 3,
    format: 'password'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  password: string;
}