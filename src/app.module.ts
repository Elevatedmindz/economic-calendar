import { Module } from '@nestjs/common';
import { BotService } from './discord/bot.service';
import { ScraperService } from './discord/calendar.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotController } from './discord/bot.controller';
import { CronService } from './job/cron.service';
import { MessageService } from './job/message.service';


@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController, BotController],
  providers: [AppService, BotService, ScraperService, CronService, MessageService],
})
export class AppModule {}