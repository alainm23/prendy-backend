import { UserDTO } from 'src/user/dto/user.dto';

export class OAuthDto {
  readonly user: UserDTO;
  readonly accessToken: string;
}
