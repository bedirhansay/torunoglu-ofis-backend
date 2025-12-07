import { BadRequestException, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

export class ParseObjectIdPipe implements PipeTransform<string> {
  transform(value: string) {
    if (!isValidObjectId(value))
      throw new BadRequestException('This is not a valid id for mongoDB');
    return value;
  }
}
