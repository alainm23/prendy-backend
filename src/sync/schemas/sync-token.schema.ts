import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Business } from 'src/collection/schemas/business.schema';
import { User } from 'src/user/schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'SyncToken',
})
export class SyncToken {
  @Prop({
    type: String,
    default: function genUUID() {
      return uuidv4();
    },
  })
  _id: string;

  @Prop({ type: Types.ObjectId, ref: User.name })
  user_id: User;

  @Prop({ type: [Types.ObjectId], ref: Business.name })
  businesses: Business[];

  @Prop({ default: false })
  full_sync: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const SyncTokenSchema = SchemaFactory.createForClass(SyncToken);
