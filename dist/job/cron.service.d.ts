import { ScraperService } from '../discord/calendar.service';
import { MessageService } from './message.service';
export declare class CronService {
    private readonly scraperService;
    private readonly messageService;
    private timer;
    constructor(scraperService: ScraperService, messageService: MessageService);
    onMidnightCronJob(): Promise<void>;
    setTimerForNextEvent(events: string[]): Promise<void>;
}
