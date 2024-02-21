import { Document } from 'mongoose';

export class IBusiness extends Document {
  name: string;
  userId: string;
  icon: string;
  color: string;
  order: number;
  currency: string;
}
