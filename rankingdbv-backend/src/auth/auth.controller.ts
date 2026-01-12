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
    console.log('[AuthController] /register called');

    // If no token provided, allow registration without Firebase validation
    // (for cases where backend creates users directly)
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('[AuthController] No token provided, proceeding without Firebase validation');
      return this.authService.register(createUserDto);
    }

    const token = authorization.split('Bearer ')[1];

    try {
      // Validate Firebase token (does NOT require user to exist in Postgres)
      console.log('[AuthController] Validating Firebase token...');

      if (!admin.apps.length) {
        console.warn('[AuthController] Firebase Admin not initialized, skipping token validation');
        return this.authService.register(createUserDto);
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const { uid, email } = decodedToken;

      console.log(`[AuthController] Firebase token valid for: ${email} (UID: ${uid})`);

      // Pass validated data to service
      return this.authService.register({
        ...createUserDto,
        uid,
        email: email || createUserDto.email, // Use token email if available
      });

    } catch (error: any) {
      console.error('[AuthController] Firebase token validation failed:', error.message);

      // If token is invalid/expired, still try to register without Firebase link
      // This gracefully handles edge cases
      if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        console.log('[AuthController] Token expired/invalid, proceeding without Firebase validation');
        return this.authService.register(createUserDto);
      }

      throw new UnauthorizedException('Token Firebase inválido: ' + error.message);
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
