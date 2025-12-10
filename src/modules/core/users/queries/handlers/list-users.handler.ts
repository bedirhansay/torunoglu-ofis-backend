import { PaginatedResponseDto } from '../../../../../common/dto/response/paginated.response.dto';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { UserDto } from '../../dto/user.dto';
import { User, UserDocument } from '../../user.schema';
import { ListUsersQuery } from '../list-users.query';

@Injectable()
@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async execute(query: ListUsersQuery): Promise<PaginatedResponseDto<UserDto>> {
    const { pageNumber = 1, pageSize = 10, search } = query;

    const filter: any = {};

    if (search) {
      filter.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }

    const totalCount = await this.userModel.countDocuments(filter);

    const users = await this.userModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .collation({ locale: 'tr', strength: 1 })
      .exec();

    const items = plainToInstance(UserDto, users);

    return {
      items,
      pageNumber,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber * pageSize < totalCount,
    };
  }
}
