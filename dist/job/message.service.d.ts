import { BotService } from '../discord/bot.service';
export declare class MessageService {
    private readonly botService;
    private messageId;
    private readonly channelID;
    private readonly mentionRole;
    private readonly timezone;
    constructor(botService: BotService);
    resetMessageId(): Promise<void>;
    postToChannel(messages: string[], isNewMessage?: boolean): Promise<void>;
    private groupEventsByDate;
    private createValidData;
    private sortDataByDate;
    private buildTableString;
    private buildEmbedMessage;
    private sendOrEditMessage;
}
