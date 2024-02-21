import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'ForgotPassword',
})
export class ForgotPassword {
  @Prop()
  email: string;

  @Prop()
  verification: string;

  @Prop({ default: false })
  firstUsed: boolean;

  @Prop({ default: false })
  finalUsed: boolean;

  @Prop()
  expires: Date;

  @Prop()
  ip: string;

  @Prop()
  browser: string;

  @Prop()
  country: string;

  @Prop()
  ipChanged: string;

  @Prop()
  browserChanged: string;

  @Prop()
  countryChanged: string;
}

export const ForgotPasswordSchema =
  SchemaFactory.createForClass(ForgotPassword);
