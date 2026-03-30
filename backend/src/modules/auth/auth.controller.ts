import { Controller, Post, Body, Res, Req, HttpCode, UseGuards, BadRequestException } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
    const result = await this.authService.login(dto, ip);

    res.cookie('auth_token', result.accessToken, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: IS_PRODUCTION ? 'strict' : 'lax',
      maxAge: COOKIE_MAX_AGE_MS,
      path: '/',
    });

    // Return user info but NOT the accessToken in the body
    return { user: result.user };
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @Req() req: Request,
  ) {
    const user = (req as Request & { user: { id: string } }).user;
    if (!body.newPassword) {
      throw new BadRequestException('Nova senha obrigatória');
    }
    if (body.newPassword.length < 8) {
      throw new BadRequestException('Nova senha deve ter ao menos 8 caracteres');
    }
    await this.authService.changePassword(user.id, body.newPassword, body.currentPassword);
    return { message: 'Senha alterada com sucesso' };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token', { path: '/' });
    return { message: 'Logged out' };
  }
}
