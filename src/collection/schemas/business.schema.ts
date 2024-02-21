import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

@Schema({
  timestamps: true,
  collection: 'Businesses',
  id: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class Business {
  @Prop()
  name: string;

  @Prop({ type: Types.ObjectId, ref: User.name })
  userId: User;

  @Prop()
  icon: string;

  @Prop()
  color: string;

  @Prop()
  order: number;

  @Prop()
  currency: string;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ default: false })
  is_archived: boolean;

  @Prop({ default: false })
  is_favorite: boolean;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
