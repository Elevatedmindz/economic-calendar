import { BotService } from './bot.service';
export declare class ScraperService {
    private readonly botService;
    constructor(botService: BotService);
    private messageId;
    onMidnightCronJob(): Promise<void>;
    onFirstCronJob(): Promise<void>;
    onSecondCronJob(): Promise<void>;
    private sample;
    private headers;
    private checkData;
    getEconomicCalendar(isNewMessage?: boolean): Promise<void>;
    postToChannel(messages: string[], isNewMessage: any): Promise<void>;
}
