import { ICommand } from '@nestjs/cqrs';

export class CreateUserCommand implements ICommand {
  constructor(
    public readonly username: string,
    public readonly email: string,
    public readonly password: string,
    public readonly role?: string,
    public readonly isActive?: boolean,
  ) {}
}

