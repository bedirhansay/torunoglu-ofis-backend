import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { UserDto } from '../../dto/user.dto';
import { User, UserDocument } from '../../user.schema';
import { GetUserQuery } from '../get-user.query';

@Injectable()
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async execute(query: GetUserQuery): Promise<UserDto> {
    if (!Types.ObjectId.isValid(query.id)) {
      throw new BadRequestException('Geçersiz kullanıcı ID');
    }

    const user = await this.userModel.findById(query.id).lean().exec();

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return plainToInstance(UserDto, user);
  }
}

