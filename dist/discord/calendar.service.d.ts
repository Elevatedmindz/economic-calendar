import { BotService } from './bot.service';
import { MessageService } from '../job/message.service';
export declare class ScraperService {
    private readonly botService;
    private readonly messageService;
    constructor(botService: BotService, messageService: MessageService);
    private messageId;
    private sample;
    private headers;
    private checkData;
    getEconomicCalendar(isNewMessage?: boolean): Promise<string[]>;
    processDataAndSendMessage(isNewMessage?: boolean): Promise<void>;
}
