"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const calendar_service_1 = require("../discord/calendar.service");
const message_service_1 = require("./message.service");
let CronService = class CronService {
    constructor(scraperService, messageService) {
        this.scraperService = scraperService;
        this.messageService = messageService;
        this.timer = null;
    }
    async onMidnightCronJob() {
        console.log("Running midnight reset cron job...");
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        const events = await this.scraperService.getEconomicCalendar(true);
        await this.messageService.postToChannel(events, true);
        this.setTimerForNextEvent(events);
    }
    async setTimerForNextEvent(events) {
        const currentTime = new Date();
        const timeEvents = events
            .map(event => new Date(event.split(",")[0]))
            .sort((a, b) => a.getTime() - b.getTime());
        const nextEventTime = timeEvents.find(eventTime => eventTime.getTime() > currentTime.getTime());
        if (!nextEventTime) {
            console.log('No upcoming events.');
            return;
        }
        const delay = nextEventTime.getTime() - currentTime.getTime() + 10000;
        this.timer = setTimeout(async () => {
            const updatedEvents = await this.scraperService.getEconomicCalendar(false);
            await this.messageService.postToChannel(updatedEvents, false);
            this.setTimerForNextEvent(updatedEvents);
        }, delay);
    }
};
__decorate([
    (0, schedule_1.Cron)('03 18 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "onMidnightCronJob", null);
CronService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [calendar_service_1.ScraperService,
        message_service_1.MessageService])
], CronService);
exports.CronService = CronService;
//# sourceMappingURL=cron.service.js.map