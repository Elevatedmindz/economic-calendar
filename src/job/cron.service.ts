import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScraperService } from '../discord/calendar.service';
import { MessageService } from './message.service';

@Injectable()
export class CronService {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly scraperService: ScraperService,
    private readonly messageService: MessageService,
  ) {}

  @Cron('03 18 * * *') // runs at 00:00 every day
  async onMidnightCronJob() {
    console.log("Running midnight reset cron job...");
    // Clear old timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    // Get new events and send new message
    const events = await this.scraperService.getEconomicCalendar(true);
    await this.messageService.postToChannel(events, true);
    // Set new timer for the next event
    this.setTimerForNextEvent(events);
  }

  async setTimerForNextEvent(events: string[]) {
    const currentTime = new Date();
    const timeEvents = events
      .map(event => new Date(event.split(",")[0])) // Get event times
      .sort((a, b) => a.getTime() - b.getTime()); // Sort events

    // Find the next event that is later than current time
    const nextEventTime = timeEvents.find(eventTime => eventTime.getTime() > currentTime.getTime());

    if (!nextEventTime) {
      console.log('No upcoming events.');
      return;
    }

    const delay = nextEventTime.getTime() - currentTime.getTime() + 10000; // Calculate the delay and add 10 seconds

    // Set a timer for the event
    this.timer = setTimeout(async () => {
      // Get the updated event data
      const updatedEvents = await this.scraperService.getEconomicCalendar(false);
      await this.messageService.postToChannel(updatedEvents, false);
      // Set new timer for the next event
      this.setTimerForNextEvent(updatedEvents);
    }, delay);
  }
}
