import { CommandDto } from "./command.dto";

export class FirstSyncDto {
    sync_type: string;
    commands: CommandDto[];
}
