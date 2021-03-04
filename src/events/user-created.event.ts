import { Role } from 'src/modules/authorization/schemas/permission.schema';
import { UserDocument } from '../modules/users/schemas/user.schema';

export class UserCreatedEvent {
  user: UserDocument;
  token: string;
  role: Role.User | Role.SuperAdmin = Role.User;

  constructor(user: UserDocument, token: string) {
    this.user = user;
    this.token = token;
  }
}
