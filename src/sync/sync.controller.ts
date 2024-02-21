import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';
import { SyncDto } from './dto/sync.dto';
import { FirstSyncDto } from './dto/first-sync.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('v1/sync')
  sync(
    @Body()
    sync: SyncDto,
    @Req() req: any,
  ) {
    if (sync.commands) {
      return this.syncService.runCommands(sync.commands, req.user);
    }

    if (sync.sync_token) {
      return this.syncService.syncData(
        sync.sync_token,
        sync.resource_types,
        req.user,
      );
    }
  }

  @Post('v1/sync/first')
  async syncFirst(
    @Body()
    firstSyncDto: FirstSyncDto,
    @Req() req: any,
  ) {
    if (firstSyncDto.sync_type === 'keep-device') {
      await this.syncService.deleteCollectionsUser(req.user);
    }

    if (firstSyncDto.commands.length > 0) {
      await this.syncService.runCommands(firstSyncDto.commands, req.user);
    }

    return this.syncService.syncData('*', ['all'], req.user);
  }
}
