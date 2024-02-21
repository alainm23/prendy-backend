import { IsNotEmpty, IsString } from "class-validator";

export class CreateBusinessDto {
  @IsNotEmpty({ message: 'Please Enter Name' })
  @IsString({ message: 'Please Enter Valid Name' })
  name: string;
  userId: string;
  icon: string;
  color: string;
  order: number;
  currency: string;
  createdAt: number;
  updatedAt: number;
}
