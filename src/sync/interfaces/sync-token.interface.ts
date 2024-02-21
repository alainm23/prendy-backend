import { Document } from 'mongoose';

export class ISyncToken extends Document {
  user_id: string;
  businesses: string[];
  full_sync: boolean;
}
