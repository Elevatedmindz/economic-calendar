import { Module } from '@nestjs/common';
import { BotService } from './discord/bot.service';
import { ScraperService } from './discord/calendar.service';
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  imports: [ ScheduleModule.forRoot()],
  controllers: [],
  providers: [BotService, ScraperService],

})
export class AppModule {}