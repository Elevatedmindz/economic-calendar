import { Injectable } from '@nestjs/common';
import { BotService } from './bot.service';
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import { format, parse} from 'date-fns';
import { utcToZonedTime as utcToZonedTimeTZ, zonedTimeToUtc as zonedTimeToUtcTZ } from 'date-fns-tz';
import { MessageService } from '../job/message.service'; // MessageService'i import ettik

@Injectable()
export class ScraperService {
  constructor(private readonly botService: BotService,private readonly messageService: MessageService) {}

  private messageId: string = '';
  
  private sample<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private headers = [
    {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    },
    {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.5',
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:90.0) Gecko/20100101 Firefox/90.0',
    },
  ];
  private checkData(data) {
    // 'date' ve 'currency' alanlarının mevcut olduğunu kontrol et
    if (!data['date'] || !data['currency']) {
      return false;
    }
    return true;
  }

  async getEconomicCalendar(isNewMessage: boolean = false): Promise<string[]> {
    try {
      const today = new Date();
      const link = `https://www.forexfactory.com/calendar?day=today`;
      const browser = await chromium.launch();
      const context = await browser.newContext({ extraHTTPHeaders: this.sample(this.headers) });
      const page = await context.newPage();
      await page.goto(link);
      const html = await page.content();
      await browser.close();
      const events = [];
      
      const $ = cheerio.load(html);
      const table = $('table.calendar__table');
      const trs = table.find('tr.calendar__row.calendar_row');
      const fields = ['date', 'time', 'currency', 'impact', 'event', 'actual', 'forecast', 'previous'];
      let curr_year = today.getFullYear();
      let curr_date = '';
      let curr_time = '';

      const fieldProcessors = {
        date: (data) => {
          const dateText = data.find('span.date').text().trim() || data.find('th.date').text().trim();
          console.log('Date Text:', dateText);
          if (dateText !== '') {
            curr_date = dateText;
            curr_year = parseInt(today.getFullYear().toString(), 10);
          }
        },
        time: (data, row) => {
          const timestamp = data.parent().attr('data-timestamp');
          if (timestamp) {
            const date = new Date(timestamp * 1000);
            const hours = date.getHours();
            const minutes = "0" + date.getMinutes();
            curr_time = hours + ':' + minutes.substr(-2);
          } else {
            curr_time = data.text().trim().indexOf('Day') !== -1 ? '12:00am' : data.text().trim();
            // 12 saatlik formatı 24 saatlik formata dönüştür
            curr_time = format(parse(curr_time, "h:mma", new Date()), "HH:mm");
          }
        },
        currency: (data, row) => {
          row['currency'] = data.text().trim();
        },
        impact: (data, row) => {
          row['impact'] = data.find('span').first().attr('title');
        },
        event: (data, row) => {
          row['event'] = data.text().trim();
        },
        actual: (data, row) => {
          const text = data.text().trim();
          console.log('Actual data:', data.html());
          row['actual'] = text === '' || text === '\u00A0' ? '' : text;
        },
        forecast: (data, row) => {
          const text = data.text().trim();
          console.log('Forecast data:', data.html());
          row['forecast'] = text === '' || text === '\u00A0' ? '' : text;
        },
        previous: (data, row) => {
          const text = data.text().trim();
          console.log('Previous data:', data.html());
          row['previous'] = text === '' || text === '\u00A0' ? '' : text;
        },
      };

      for (let i = 0; i < trs.length; i++) {
        const tr = trs.eq(i);
        const row = {};
        try {
          for (let j = 0; j < fields.length; j++) {
            const field = fields[j];
            const data = tr.find(`td.calendar__cell.calendar__${field}.${field}`).first();
            fieldProcessors[field](data, row);
          }
          console.log(`Parsed Date String: ${curr_year} ${curr_date} ${curr_time}`);
          const dt = zonedTimeToUtcTZ(
            parse(`${curr_year}-${curr_date.slice(3)} ${curr_time}`, 'yyyy-MMM d H:mm', new Date()),
            "Europe/Istanbul"
          );

          //console.log(`Parsed Date String: ${dt.format()}`);
          console.log(`Successfully processed row with data: ${dt.toISOString()},${Object.values(row).join(',')}`);
          console.log(`Row Data: ${JSON.stringify(row)}`);

          // Verileri işlemeden önce kontrol et
          events.push(`${dt.toISOString()},${Object.values(row).join(',')}`);

        } catch (err) {
          console.log(`Error processing row: ${err.message}`);
        }
      }
      return events;
    } catch (err) {
      console.log(`Error retrieving data: ${err.message}`);
      return []; // Herhangi bir hata durumunda boş bir dizi döndür
    }
    
  }
  async processDataAndSendMessage(isNewMessage: boolean = false) {
    const events = await this.getEconomicCalendar(isNewMessage);
    await this.messageService.postToChannel(events, isNewMessage);
  }
}