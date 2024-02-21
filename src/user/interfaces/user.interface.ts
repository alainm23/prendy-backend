import { Document } from 'mongoose';

export interface IUser extends Document {
  readonly email: string;
  readonly password: string;
  readonly isActive: boolean;
  readonly roles: string[];
}
