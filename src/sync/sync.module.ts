import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { BusinessService } from 'src/collection/services/business.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessSchema } from 'src/collection/schemas/business.schema';
import { UserService } from 'src/user/user.service';
import { UserSchema } from 'src/user/schemas/user.schema';
import { SyncTokenSchema } from './schemas/sync-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SyncToken', schema: SyncTokenSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Business', schema: BusinessSchema },
    ]),
  ],
  controllers: [SyncController],
  providers: [SyncService, UserService, BusinessService],
})
export class SyncModule {}
