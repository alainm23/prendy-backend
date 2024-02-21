import { UserDTO } from 'src/user/dto/user.dto';

export class JwtSign {
  readonly user: UserDTO;
  readonly accessToken: string;
}