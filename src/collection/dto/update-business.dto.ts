import { IsNotEmpty, IsString } from "class-validator";

export class UpdateBusinessDto {
  id: string;
  name: string;
  userId: string;
  icon: string;
  color: string;
  order: number;
  currency: string;
  createdAt: number;
  updatedAt: number;
}