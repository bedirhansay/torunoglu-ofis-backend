import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { comparePassword } from '../../../../../common/utils/password.util';
import { User, UserDocument } from '../../../../../modules/core/users/user.schema';
import { LoginResponseDto, UserResponseDto } from '../../dto/login.dto';
import { LoginCommand } from '../login.command';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponseDto> {
    const identifier = command.username.trim().toLowerCase();

    const user = await this.findUserByEmailOrUsername(identifier);

    if (!user || !user.password) {
      throw new UnauthorizedException('Kullanıcı bulunamadı veya şifresi geçersiz');
    }

    const isPasswordValid = await comparePassword(command.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz şifre');
    }

    const payload = {
      id: user._id,
      email: user.email,
      username: user.username,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || (process.env.NODE_ENV === 'production' ? '1h' : '7d'),
    });

    return {
      token,
      user: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    };
  }

  private async findUserByEmailOrUsername(identifier: string) {
    return this.userModel
      .findOne({
        $or: [{ username: identifier }, { email: identifier }],
      })
      .select('+password');
  }
}
