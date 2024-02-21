import { IsNotEmpty, IsUUID } from 'class-validator';

export class VerifyUuidDto {
  @IsNotEmpty()
  @IsUUID()
  readonly verification: string;
}
