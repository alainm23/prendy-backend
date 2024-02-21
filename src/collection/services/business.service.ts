import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Business } from '../schemas/business.schema';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { IUser } from 'src/user/interfaces/user.interface';
import { ValidationError, validate } from 'class-validator';
import { CommandDto } from 'src/sync/dto/command.dto';
import { ISyncToken } from 'src/sync/interfaces/sync-token.interface';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name)
    private businessModel: mongoose.Model<Business>,
  ) {}

  async findAll() {
    const business = await this.businessModel.find();
    return business;
  }

  async create(business: CreateBusinessDto): Promise<Business> {
    const res = await this.businessModel.create(business);
    return res;
  }

  async createWithArgs(business: CreateBusinessDto, user: IUser): Promise<any> {
    const _business: CreateBusinessDto = { ...business, userId: user.id };

    const isValid = await this.isValid(_business);

    if (!isValid) {
      return {
        data: null,
        error: {
          message: "It's not possible to create the business",
          errors: await this.getValidateError(_business),
        },
      };
    }

    const res = await this.businessModel.create(_business);

    return {
      data: res,
    };
  }

  async deleteWithArgs(id: string) {
    const existingBusiness = await this.businessModel.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { new: true },
    );

    if (!existingBusiness) {
      return {
        data: null,
        error: {
          message: `Business ${id} not found`,
        },
      };
    }

    return {
      data: existingBusiness,
    };
  }

  async updateWithArgs(updateUserDto: UpdateBusinessDto): Promise<any> {
    const existingBusiness = await this.businessModel.findByIdAndUpdate(
      updateUserDto.id,
      updateUserDto,
      { new: true },
    );

    if (!existingBusiness) {
      return {
        data: null,
        error: {
          message: `Business ${updateUserDto.id} not found`,
        },
      };
    }

    return {
      data: existingBusiness,
    };
  }

  async findById(id: string): Promise<Business> {
    const business = await this.businessModel.findById(id);

    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    return business;
  }

  async findByUserId(userId: string): Promise<Business[]> {
    const business = await this.businessModel.find({
      userId: userId,
    });
    return business;
  }

  async findByUserIdQuery(
    userId: string,
    query: Record<string, any> = {},
  ): Promise<Business[]> {
    const business = await this.businessModel.find({
      userId: userId,
      ...query
    });
    return business;
  }

  async updateById(id: string, updateBusinessDto: UpdateBusinessDto) {
    return await this.businessModel.findByIdAndUpdate(id, updateBusinessDto, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id: string) {
    return await this.businessModel.findByIdAndDelete(id);
  }

  async isValid(business: CreateBusinessDto): Promise<boolean> {
    const _business = new CreateBusinessDto();
    _business.name = business.name;
    const errors = await validate(_business);
    return errors.length <= 0;
  }

  async getValidateError(business: CreateBusinessDto) {
    const _business = new CreateBusinessDto();
    _business.name = business.name;

    const errors = await validate(_business);
    const errorsResponse = {};

    errors.forEach((error: ValidationError) => {
      const prop = error.property;

      if (!errorsResponse[prop]) {
        errorsResponse[prop] = [];
      }

      Object.entries(error.constraints).forEach((key) => {
        errorsResponse[prop].push(key[1]);
      });
    });

    return errorsResponse;
  }

  async runCommand(command: CommandDto, user: IUser, sync_token: any) {
    const sync_status = {};
    const temp_id_mapping = {};

    if (command.type === 'business_add') {
      const response = await this.createWithArgs(command.args, user);

      if (response.data) {
        sync_status[command.uuid] = 'ok';
        temp_id_mapping[command.temp_id] = response.data.id;
        this.addSyncTokenID(sync_token, 'businesses', response.data.id);
      } else {
        sync_status[command.uuid] = {
          error: response.error,
        };
      }
    } else if (command.type === 'business_delete') {
      const response = await this.deleteWithArgs(command.args.id);

      if (response.data) {
        sync_status[command.uuid] = 'ok';
        this.addSyncTokenID(sync_token, 'businesses', response.data.id);
      } else {
        sync_status[command.uuid] = {
          error: response.error,
        };
      }
    } else if (command.type === 'business_update') {
      const response = await this.updateWithArgs(command.args);

      if (response.data) {
        sync_status[command.uuid] = 'ok';
        this.addSyncTokenID(sync_token, 'businesses', response.data.id);
      } else {
        sync_status[command.uuid] = {
          error: response.error,
        };
      }
    }

    return {
      sync_status: sync_status,
      temp_id_mapping: temp_id_mapping,
    };
  }

  addSyncTokenID(sync_token: ISyncToken, collection: string, id: string) {
    if (sync_token[collection]) {
      sync_token[collection] = [...sync_token[collection], id];
    } else {
      sync_token[collection] = [id];
    }
  }

  async deleteAllByUser(user: IUser) {
    const resultado = await this.businessModel.deleteMany({ userId: user.id });
    return resultado;
  }
}
