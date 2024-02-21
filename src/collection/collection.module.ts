import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessSchema } from './schemas/business.schema';
import { BusinessService } from './services/business.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Business', schema: BusinessSchema }]),
  ],
  providers: [BusinessService],
})
export class CollectionModule {}
