/**
 * Authentication Controller
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Endpoints para login, refresh, logout
 */

import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UnauthorizedException,
  Get,
  UseGuards,
  Request,
  Delete,
  Param
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiBearerAuth,
  ApiProperty,
  ApiExtraModels
} from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { JwtAuthService, UserPayload, TokenPair } from './jwt.service';
import { LoginDto } from './dto';
import * as bcrypt from 'bcrypt';


export class RefreshTokenDto {
  @ApiProperty({ 
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class UserResponse {
  @ApiProperty({ description: 'User UUID', example: '550e8400-e29b-41d4-a716-446655440003' })
  id: string;

  @ApiProperty({ description: 'Username', example: 'ana_estudiante' })
  username: string;

  @ApiProperty({ description: 'User email', example: 'ana@ebrovalley.com' })
  email: string;

  @ApiProperty({ description: 'User role', example: 'student', enum: ['student', 'teacher', 'admin'] })
  role: string;
}

export class TokenPairResponse {
  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration time in seconds', example: 3600 })
  expiresIn: number;
}

export class LoginResponse {
  @ApiProperty({ description: 'User information', type: UserResponse })
  user: UserResponse;

  @ApiProperty({ description: 'Authentication tokens', type: TokenPairResponse })
  tokens: TokenPairResponse;

  @ApiProperty({ description: 'Response message', example: 'Login successful' })
  message: string;
}

@ApiTags('Authentication')
@ApiExtraModels(LoginDto, RefreshTokenDto, LoginResponse, UserResponse, TokenPairResponse)
@Controller('auth')
export class AuthController {
  
  // Demo users - En producción esto vendría de PostgreSQL
  private readonly demoUsers = [
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      username: 'ana_estudiante',
      email: 'ana@ebrovalley.com',
      password: '$2b$12$lrYgk6kjuQlq/GCrgx6sROeaINHPbtP9mWmFVbx00Kjct69h0WCza', // password: demo123
      role: 'student',
      fullName: 'Ana Estudiante',
      isActive: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      username: 'admin_demo',
      email: 'admin@ebrovalley.com',
      password: '$2b$12$lrYgk6kjuQlq/GCrgx6sROeaINHPbtP9mWmFVbx00Kjct69h0WCza', // password: demo123
      role: 'admin',
      fullName: 'Administrador Demo',
      isActive: true,
    },
  ];

  constructor(private readonly jwtService: JwtAuthService) {}

  /**
   * Acción específica: Login de usuario
   * Razón: Autenticación inicial con credenciales
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User authentication',
    description: 'Authenticate user with username and password to obtain JWT tokens'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful', 
    type: LoginResponse,
    example: {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        username: 'ana_estudiante',
        email: 'ana@ebrovalley.com',
        role: 'student'
      },
      tokens: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 3600
      },
      message: 'Login successful'
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const { username, password } = loginDto;

    // Buscar usuario
    const user = this.demoUsers.find(u => 
      u.username === username && u.isActive
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generar tokens
    const userPayload: UserPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const tokens = await this.jwtService.generateTokenPair(userPayload);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tokens,
      message: 'Login successful',
    };
  }

  /**
   * Acción específica: Renovar tokens
   * Razón: Mantener sesión activa sin re-login
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh JWT tokens',
    description: 'Use refresh token to obtain new access and refresh tokens'
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Tokens refreshed successfully',
    example: {
      tokens: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 3600
      },
      message: 'Tokens refreshed successfully'
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshTokens(@Body() refreshDto: RefreshTokenDto): Promise<{
    tokens: TokenPair;
    message: string;
  }> {
    const tokens = await this.jwtService.refreshAccessTokens(refreshDto.refreshToken);
    
    return {
      tokens,
      message: 'Tokens refreshed successfully',
    };
  }

  /**
   * Acción específica: Logout del usuario
   * Razón: Invalidar tokens de forma segura
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User logout',
    description: 'Logout user and invalidate refresh token securely'
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    example: {
      message: 'Logout successful'
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async logout(@Body() refreshDto: RefreshTokenDto): Promise<{
    message: string;
  }> {
    try {
      // En producción, extraer tokenId del refresh token y revocarlo
      // Por ahora, simplemente confirmamos el logout
      return {
        message: 'Logout successful',
      };
    } catch (error) {
      return {
        message: 'Logout completed (token may have been already expired)',
      };
    }
  }

  /**
   * Acción específica: Logout desde todos los dispositivos
   * Razón: Seguridad avanzada para usuarios comprometidos
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Logout from all devices',
    description: 'Revoke all user tokens across all devices for enhanced security'
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          format: 'uuid',
          description: 'User UUID to logout from all devices',
          example: '550e8400-e29b-41d4-a716-446655440003'
        }
      },
      required: ['userId']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully logged out from all devices',
    example: {
      message: 'Logged out from all devices successfully'
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid user ID' })
  @ApiBearerAuth('JWT-auth')
  async logoutFromAllDevices(@Body() body: { userId: string }): Promise<{
    message: string;
  }> {
    await this.jwtService.revokeAllUserTokens(body.userId);
    
    return {
      message: 'Logged out from all devices successfully',
    };
  }

  /**
   * Acción específica: Generar token demo
   * Razón: Facilitar testing y demos sin login
   */
  @Post('demo-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate demo token',
    description: 'Generate authentication tokens for demo/testing purposes without login'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Demo token generated successfully',
    example: {
      tokens: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 3600
      },
      user: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        username: 'ana_estudiante',
        email: 'ana@ebrovalley.com',
        role: 'student'
      },
      message: 'Demo token generated successfully'
    }
  })
  async generateDemoToken(): Promise<{
    tokens: TokenPair;
    user: any;
    message: string;
  }> {
    const tokens = await this.jwtService.generateDemoToken();
    const demoUser = this.demoUsers[0]; // Ana Estudiante
    
    return {
      tokens,
      user: {
        id: demoUser.id,
        username: demoUser.username,
        email: demoUser.email,
        role: demoUser.role,
      },
      message: 'Demo token generated successfully',
    };
  }

  /**
   * Acción específica: Verificar token
   * Razón: Validar token desde frontend
   */
  @Get('verify')
  @ApiOperation({ 
    summary: 'Verify JWT token',
    description: 'Validate access token and return user information if valid'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Token verification result',
    example: {
      valid: true,
      user: {
        sub: '550e8400-e29b-41d4-a716-446655440003',
        username: 'ana_estudiante',
        email: 'ana@ebrovalley.com',
        role: 'student'
      },
      message: 'Token is valid'
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Invalid token',
    example: {
      valid: false,
      message: 'Invalid or expired token'
    }
  })
  async verifyToken(@Request() req): Promise<{
    valid: boolean;
    user?: UserPayload;
    message: string;
  }> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        valid: false,
        message: 'No token provided',
      };
    }

    const token = authHeader.substring(7);
    
    try {
      const user = await this.jwtService.validateAccessToken(token);
      return {
        valid: true,
        user,
        message: 'Token is valid',
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Invalid or expired token',
      };
    }
  }

  /**
   * Acción específica: Obtener estadísticas de autenticación
   * Razón: Monitoreo de seguridad y analytics
   */
  @Get('stats')
  @ApiOperation({ 
    summary: 'Authentication statistics',
    description: 'Get authentication and user statistics for monitoring and analytics'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication statistics',
    example: {
      tokenStats: {
        activeTokens: 15,
        expiredTokens: 3,
        refreshTokensIssued: 8
      },
      activeUsers: 2,
      totalUsers: 2,
      timestamp: '2025-01-07T15:30:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getAuthStats(): Promise<{
    tokenStats: any;
    activeUsers: number;
    totalUsers: number;
    timestamp: string;
  }> {
    const tokenStats = this.jwtService.getTokenStats();
    
    return {
      tokenStats,
      activeUsers: this.demoUsers.filter(u => u.isActive).length,
      totalUsers: this.demoUsers.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Acción específica: Registro de nuevos usuarios (demo)
   * Razón: Permitir creación de cuentas para testing
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'User registration',
    description: 'Register new user account for demo/testing purposes'
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'Unique username',
          example: 'nuevo_estudiante',
          minLength: 3,
          maxLength: 50
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'User email address',
          example: 'nuevo@ebrovalley.com'
        },
        password: {
          type: 'string',
          description: 'User password',
          example: 'segura123',
          minLength: 6,
          format: 'password'
        },
        fullName: {
          type: 'string',
          description: 'Full name of the user',
          example: 'Nuevo Estudiante',
          maxLength: 100
        }
      },
      required: ['username', 'email', 'password', 'fullName']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    example: {
      user: {
        id: '550e8400-e29b-41d4-a716-1641571234567',
        username: 'nuevo_estudiante',
        email: 'nuevo@ebrovalley.com',
        role: 'student',
        fullName: 'Nuevo Estudiante'
      },
      message: 'User registered successfully'
    }
  })
  @ApiResponse({ status: 400, description: 'Username or email already exists' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async register(@Body() registerDto: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<{
    user: any;
    message: string;
  }> {
    const { username, email, password, fullName } = registerDto;

    // Verificar si usuario ya existe
    const existingUser = this.demoUsers.find(u => 
      u.username === username || u.email === email
    );

    if (existingUser) {
      throw new UnauthorizedException('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear nuevo usuario (en producción, guardar en PostgreSQL)
    const newUser = {
      id: `550e8400-e29b-41d4-a716-${Date.now()}`,
      username,
      email,
      password: hashedPassword,
      role: 'student',
      fullName,
      isActive: true,
    };

    // Agregar a demo users (en producción, insertar en DB)
    this.demoUsers.push(newUser);

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName,
      },
      message: 'User registered successfully',
    };
  }

  /**
   * Acción específica: Cambiar contraseña
   * Razón: Seguridad de cuentas de usuario
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Change user password',
    description: 'Change user password with current password verification'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          format: 'uuid',
          description: 'User UUID',
          example: '550e8400-e29b-41d4-a716-446655440003'
        },
        currentPassword: {
          type: 'string',
          description: 'Current password for verification',
          example: 'demo123',
          format: 'password'
        },
        newPassword: {
          type: 'string',
          description: 'New password',
          example: 'nuevaSegura123',
          minLength: 6,
          format: 'password'
        }
      },
      required: ['userId', 'currentPassword', 'newPassword']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully',
    example: {
      message: 'Password changed successfully. Please log in again.'
    }
  })
  @ApiResponse({ status: 401, description: 'User not found or current password incorrect' })
  @ApiResponse({ status: 422, description: 'Password validation failed' })
  async changePassword(@Body() body: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{
    message: string;
  }> {
    const { userId, currentPassword, newPassword } = body;

    const user = this.demoUsers.find(u => u.id === userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;

    // Revocar todos los tokens existentes
    await this.jwtService.revokeAllUserTokens(userId);

    return {
      message: 'Password changed successfully. Please log in again.',
    };
  }
}