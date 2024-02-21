import { CommandDto } from "./command.dto";

export class SyncDto {
    sync_token: string;
    resource_types: string[];
    commands: CommandDto[];
}
