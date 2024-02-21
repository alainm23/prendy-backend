import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPassword } from './schemas/forgot-password.schema';
import { v4 } from 'uuid';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { getClientIp } from 'request-ip';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/schemas/user.schema';
import { addHours } from 'date-fns';
import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { VerifyUuidDto } from './dto/verify-uuid.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IUser } from 'src/user/interfaces/user.interface';
import { UserDTO } from 'src/user/dto/user.dto';
import { JwtSign } from './interfaces/jwt-sign.interface';

@Injectable()
export class AuthService {
  HOURS_TO_VERIFY = 4;
  HOURS_TO_BLOCK = 6;
  LOGIN_ATTEMPTS_TO_BLOCK = 5;

  constructor(
    @InjectModel(ForgotPassword.name)
    private forgotPasswordModel: Model<ForgotPassword>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async signUp(req: Request, signUpDto: SignUpDto): Promise<JwtSign> {
    const { email, password } = signUpDto;

    if (await this.userService.model.findOne({ email })) {
      throw new UnauthorizedException('Email already exists');
    }

    const user = await this.userService.model.create({
      email,
      password: bcrypt.hashSync(password, 10),
    });

    return await this.createAccessRefreshToken(user, req);
  }

  async login(req: Request, loginDto: LoginDto): Promise<JwtSign> {
    const { email, password } = loginDto;

    const user = await this.userService.model.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return await this.createAccessRefreshToken(user, req);
  }

  async createAccessRefreshToken(user: User, req: Request): Promise<JwtSign> {
    return {
      user: UserDTO.fromSchema(user),
      accessToken: await this.createAccessToken(user.id),
    };
  }

  async createAccessToken(userId: string): Promise<string> {
    const accessToken = await this.jwtService.signAsync({
      userId,
    });

    return accessToken;
  }

  async validateUser(jwtPayload: JwtPayload): Promise<IUser> {
    const user = await this.userService.model.findOne({
      _id: jwtPayload.userId,
      isActive: true,
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return user;
  }

  async forgotPassword(
    req: Request,
    createForgotPasswordDto: CreateForgotPasswordDto,
  ) {
    await this.findByEmail(createForgotPasswordDto.email);
    await this.saveForgotPassword(req, createForgotPasswordDto);
    return {
      email: createForgotPasswordDto.email,
      message: 'verification sent.',
    };
  }

  private async saveForgotPassword(
    req: Request,
    createForgotPasswordDto: CreateForgotPasswordDto,
  ) {
    const forgotPassword = await this.forgotPasswordModel.create({
      email: createForgotPasswordDto.email,
      verification: v4(),
      expires: addHours(new Date(), this.HOURS_TO_VERIFY),
      ip: this.getIp(req),
      browser: this.getBrowserInfo(req),
      country: this.getCountry(req),
    });

    await forgotPassword.save();
  }

  async forgotPasswordVerify(req: Request, verifyUuidDto: VerifyUuidDto) {
    const forgotPassword = await this.findForgotPasswordByUuid(verifyUuidDto);
    await this.setForgotPasswordFirstUsed(req, forgotPassword);
    return {
      email: forgotPassword.email,
      message: 'now reset your password.',
    };
  }

  private async findForgotPasswordByUuid(
    verifyUuidDto: VerifyUuidDto,
  ): Promise<ForgotPassword> {
    const forgotPassword = await this.forgotPasswordModel.findOne({
      verification: verifyUuidDto.verification,
      firstUsed: false,
      finalUsed: false,
      expires: { $gt: new Date() },
    });
    if (!forgotPassword) {
      throw new BadRequestException('Bad request.');
    }
    return forgotPassword;
  }

  private async setForgotPasswordFirstUsed(req: Request, forgotPassword: any) {
    forgotPassword.firstUsed = true;
    forgotPassword.ipChanged = this.getIp(req);
    forgotPassword.browserChanged = this.getBrowserInfo(req);
    forgotPassword.countryChanged = this.getCountry(req);
    await this.forgotPasswordModel.findByIdAndUpdate(
      forgotPassword.id,
      forgotPassword,
      {
        new: true,
        runValidators: true,
      },
    );
  }

  private async findByEmail(email: string): Promise<User> {
    const user = await this.userService.model.findOne({
      email,
    });

    if (!user) {
      throw new NotFoundException('Email not found.');
    }

    return user;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const forgotPassword =
      await this.findForgotPasswordByEmail(resetPasswordDto);
    await this.setForgotPasswordFinalUsed(forgotPassword);
    await this.resetUserPassword(resetPasswordDto);
    return {
      email: resetPasswordDto.email,
      message: 'password successfully changed.',
    };
  }

  private async findForgotPasswordByEmail(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ForgotPassword> {
    const forgotPassword = await this.forgotPasswordModel.findOne({
      email: resetPasswordDto.email,
      firstUsed: true,
      finalUsed: false,
      expires: { $gt: new Date() },
    });
    if (!forgotPassword) {
      throw new BadRequestException('Bad request.');
    }
    return forgotPassword;
  }

  private async setForgotPasswordFinalUsed(forgotPassword: any) {
    forgotPassword.finalUsed = true;
    await this.forgotPasswordModel.findByIdAndUpdate(
      forgotPassword.id,
      forgotPassword,
      {
        new: true,
        runValidators: true,
      },
    );
  }

  private async resetUserPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userService.model.findOne({
      email: resetPasswordDto.email,
      verified: true,
    });
    user.password = resetPasswordDto.password;
    await user.save();
  }

  /*
   *  Methonds
   */
  private jwtExtractor(request) {
    let token = null;

    if (request.header('x-token')) {
      token = request.get('x-token');
    } else if (request.headers.authorization) {
      token = request.headers.authorization
        .replace('Bearer ', '')
        .replace(' ', '');
    } else if (request.body.token) {
      token = request.body.token.replace(' ', '');
    }

    if (request.query.token) {
      token = request.body.token.replace(' ', '');
    }

    if (!token) {
      throw new BadRequestException('Bad request.');
    }

    return token;
  }

  returnJwtExtractor() {
    return this.jwtExtractor;
  }

  getIp(req: any): string {
    return getClientIp(req);
  }

  getBrowserInfo(req: Request): string {
    return req.headers['user-agent'] || 'XX';
  }

  getCountry(req: Request): string {
    return req.headers['cf-ipcountry'] ? req.headers['cf-ipcountry'] : 'XX';
  }
}
