import { Body, Controller, Post, HttpCode, HttpStatus, UnauthorizedException, Get, UseGuards, Req, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from './jwt-auth.guard';
import * as admin from 'firebase-admin';

class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: LoginDto) {
    const user = await this.authService.validateUser(signInDto.email, signInDto.password);

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    return this.authService.login(user);
  }

  // IMPORTANT: This route does NOT use JwtAuthGuard
  // We manually validate the Firebase token instead
  @Post('register')
  async register(
    @Headers('authorization') authorization: string,
    @Body() createUserDto: any
  ) {
    console.log('[AuthController] ============ /register called ============');
    console.log('[AuthController] Body received:', JSON.stringify(createUserDto, null, 2));
    console.log('[AuthController] Authorization header present:', !!authorization);

    // If no token provided, allow registration without Firebase validation
    // (for cases where backend creates users directly)
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('[AuthController] No token provided, proceeding without Firebase validation');
      try {
        const result = await this.authService.register(createUserDto);
        console.log('[AuthController] Registration result:', JSON.stringify(result, null, 2));
        return result;
      } catch (error: any) {
        console.error('[AuthController] Registration error:', error.message);
        throw error;
      }
    }

    const token = authorization.split('Bearer ')[1];
    console.log('[AuthController] Token extracted, length:', token?.length);

    try {
      // Validate Firebase token (does NOT require user to exist in Postgres)
      console.log('[AuthController] Validating Firebase token...');

      if (!admin.apps.length) {
        console.warn('[AuthController] Firebase Admin not initialized, skipping token validation');
        const result = await this.authService.register(createUserDto);
        console.log('[AuthController] Registration result (no Firebase):', JSON.stringify(result, null, 2));
        return result;
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const { uid, email } = decodedToken;

      console.log(`[AuthController] Firebase token valid for: ${email} (UID: ${uid})`);

      // Pass validated data to service
      const dataToRegister = {
        ...createUserDto,
        uid,
        email: email || createUserDto.email, // Use token email if available
      };

      console.log('[AuthController] Calling authService.register with:', JSON.stringify(dataToRegister, null, 2));

      const result = await this.authService.register(dataToRegister);
      console.log('[AuthController] Registration SUCCESS:', JSON.stringify(result, null, 2));
      return result;

    } catch (error: any) {
      console.error('[AuthController] Error in register:', error.message, error.code, error.stack);

      // If token is invalid/expired, still try to register without Firebase link
      // This gracefully handles edge cases
      const firebaseErrors = [
        'auth/id-token-expired',
        'auth/argument-error',
        'auth/invalid-id-token',
        'auth/user-not-found',
        'auth/id-token-revoked'
      ];

      if (firebaseErrors.includes(error.code) || error.message?.includes('Firebase')) {
        console.log('[AuthController] Firebase token issue, proceeding without Firebase validation');
        try {
          const result = await this.authService.register(createUserDto);
          console.log('[AuthController] Registration result (fallback):', JSON.stringify(result, null, 2));
          return result;
        } catch (fallbackError: any) {
          console.error('[AuthController] Fallback registration error:', fallbackError.message);
          throw fallbackError;
        }
      }

      // If it's already a NestJS exception (from authService), re-throw it
      if (error.response && error.status) {
        throw error;
      }

      throw new UnauthorizedException('Erro no registro: ' + error.message);
    }
  }

  @Post('sync')
  async sync(@Body('idToken') idToken: string) {
    return this.authService.syncWithFirebase(idToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('refresh')
  async refresh(@Req() req: any) {
    return this.authService.refreshToken(req.user.userId);
  }

  @Post('fix-sunshine')
  async fixSunshine() {
    return this.authService.fixSunshineUser();
  }
}
