import { ICommand } from '@nestjs/cqrs';

export class RegisterCommand implements ICommand {
  constructor(
    public readonly username: string,
    public readonly email: string,
    public readonly password: string,
  ) {}
}

