import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { comparePassword } from '@common/utils/password.util';
import { LoginCommand } from '../login.command';
import { User, UserDocument } from '@core/users/user.schema';
import { LoginResponseDto, UserResponseDto } from '../../dto/login.dto';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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
      expiresIn: '365d',
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

