import { User } from '../schemas/user.schema';

export class UserDTO {
  id: string;
  email: string;
  roles: string[];
  isActive: boolean;

  constructor(
    id?: string,
    email?: string,
    roles?: string[],
    isActive?: boolean,
  ) {
    this.id = id || '';
    this.email = email || '';
    this.roles = roles || [];
    this.isActive = isActive || false;
  }

  static fromSchema(schema: User) {
    const dto = new UserDTO();
    dto.id = schema.id;
    dto.email = schema.email;
    dto.isActive = schema.isActive;
    dto.roles = schema.roles;

    return dto;
  }
}
