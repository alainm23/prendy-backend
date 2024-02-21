import { Injectable } from '@nestjs/common';
import { IUser } from 'src/user/interfaces/user.interface';
import { BusinessService } from '../collection/services/business.service';
import { UserService } from 'src/user/user.service';
import { CommandDto } from './dto/command.dto';
import { InjectModel } from '@nestjs/mongoose';
import { SyncToken } from './schemas/sync-token.schema';
import mongoose from 'mongoose';
import { Business } from 'src/collection/schemas/business.schema';
import { ISyncToken } from './interfaces/sync-token.interface';

@Injectable()
export class SyncService {
  constructor(
    @InjectModel(SyncToken.name)
    private syncTokenModel: mongoose.Model<SyncToken>,
    @InjectModel(Business.name)
    private businessModel: mongoose.Model<Business>,
    private readonly businessService: BusinessService,
    private readonly userService: UserService,
  ) {}

  async syncData(sync_token: string, resource_types: string[], user: IUser) {
    if (sync_token === '*') {
      const _user = await this.userService.findOne(user.id);
      const _sync_token = await this.getLastTokenByUserId(user.id);
      const _businesses = await this.businessService.findByUserIdQuery(
        user.id,
        { is_deleted: false },
      );

      return {
        sync_token: _sync_token.id,
        full_sync: _sync_token.full_sync,
        user: _user,
        businesses: _businesses,
      };
    } else {
      const selectedToken = await this.syncTokenModel
        .findOne({ _id: sync_token, user_id: user.id })
        .exec();

      if (!selectedToken) {
        throw new Error('Token no encontrado');
      }

      const syncTokens = await this.syncTokenModel
        .find({
          user_id: user.id,
          createdAt: { $gte: selectedToken.createdAt },
        })
        .sort({ createdAt: 'asc' })
        .exec();

      const uniqueBusinesses = [
        ...new Set(syncTokens.flatMap((item: any) => item.businesses)),
      ];

      const _user = await this.userService.findOne(user.id);

      const _businesses = await this.businessModel
        .find({
          _id: { $in: uniqueBusinesses },
        })
        .exec();

      return {
        user: _user,
        businesses: _businesses,
      };
    }
  }

  async runCommands(commands: CommandDto[], user: IUser) {
    let sync_status = {};
    let temp_id_mapping = {};
    let _sync_token = {};

    for (let index = 0; index < commands.length; index++) {
      const command: CommandDto = commands[index];
      const provider = this.getProvider(command.type);
      const respose = await provider.runCommand(command, user, _sync_token);

      sync_status = { ...sync_status, ...respose.sync_status };
      temp_id_mapping = { ...temp_id_mapping, ...respose.temp_id_mapping };
    }

    const sync_token = await this.createSyncToken(user, _sync_token);

    let commandResponse: any = {
      sync_token: sync_token.id,
    };

    if (!this.isEmpty(sync_status)) {
      commandResponse = { ...commandResponse, sync_status: sync_status };
    }

    if (!this.isEmpty(temp_id_mapping)) {
      commandResponse = {
        ...commandResponse,
        temp_id_mapping: temp_id_mapping,
      };
    }

    return commandResponse;
  }

  async createSyncToken(user: IUser, sync_token: any) {
    const syncToken = await this.syncTokenModel.create({
      ...sync_token,
      user_id: user.id,
    });

    return syncToken;
  }

  async getLastTokenByUserId(id: string): Promise<ISyncToken> {
    let syncToken: any = await this.syncTokenModel
      .findOne({ user_id: id })
      .sort({ createdAt: -1 })
      .exec();

    if (!syncToken) {
      syncToken = await this.syncTokenModel.create({
        full_sync: true,
        user_id: id,
      });
    }

    return syncToken;
  }

  getProvider(type: string) {
    const providers = {
      business_add: this.businessService,
      business_delete: this.businessService,
      business_update: this.businessService,
    };

    return providers[type];
  }

  isEmpty(obj: any) {
    return Object.keys(obj).length === 0;
  }

  deleteCollectionsUser(user: IUser) {
    return this.businessService.deleteAllByUser(user);
  }
}
