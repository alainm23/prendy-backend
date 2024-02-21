import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { VerifyUuidDto } from './dto/verify-uuid.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OAuthDto } from './dto/oauth.dro';
import { JwtSign } from './interfaces/jwt-sign.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signUp(
    @Req() req: Request,
    @Body() signUpDto: SignUpDto,
  ): Promise<JwtSign> {
    return await this.authService.signUp(req, signUpDto);
  }

  @Post('/login')
  async login(
    @Req() req: Request,
    @Body() loginDto: LoginDto,
  ): Promise<JwtSign> {
    return await this.authService.login(req, loginDto);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Req() req: Request,
    @Body() createForgotPasswordDto: CreateForgotPasswordDto,
  ) {
    return await this.authService.forgotPassword(req, createForgotPasswordDto);
  }

  @Post('forgot-password-verify')
  async forgotPasswordVerify(
    @Req() req: Request,
    @Body() verifyUuidDto: VerifyUuidDto,
  ) {
    return await this.authService.forgotPasswordVerify(req, verifyUuidDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
