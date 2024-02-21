import { IsNotEmpty, IsUUID } from 'class-validator';

export class CommandDto {
  @IsNotEmpty({ message: 'Please Enter Name' })
  type: string;

  temp_id: string;

  @IsUUID()
  uuid: string;
  args: any;
}
