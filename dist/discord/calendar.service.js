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
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bot_service_1 = require("./bot.service");
const playwright_1 = require("playwright");
const cheerio = require("cheerio");
const discord_js_1 = require("discord.js");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
let ScraperService = class ScraperService {
    constructor(botService) {
        this.botService = botService;
        this.messageId = '';
        this.headers = [
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
    }
    async onMidnightCronJob() {
        await this.getEconomicCalendar(true);
    }
    async onFirstCronJob() {
        await this.getEconomicCalendar();
    }
    async onSecondCronJob() {
        await this.getEconomicCalendar();
    }
    sample(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    checkData(data) {
        if (!data['date'] || !data['currency']) {
            return false;
        }
        return true;
    }
    async getEconomicCalendar(isNewMessage = false) {
        try {
            const today = new Date();
            const link = `https://www.forexfactory.com/calendar?day=today`;
            const browser = await playwright_1.chromium.launch();
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
                    }
                    else {
                        curr_time = data.text().trim().indexOf('Day') !== -1 ? '12:00am' : data.text().trim();
                        curr_time = (0, date_fns_1.format)((0, date_fns_1.parse)(curr_time, "h:mma", new Date()), "HH:mm");
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
                    const dt = (0, date_fns_tz_1.zonedTimeToUtc)((0, date_fns_1.parse)(`${curr_year}-${curr_date.slice(3)} ${curr_time}`, 'yyyy-MMM d H:mm', new Date()), "Europe/Istanbul");
                    console.log(`Successfully processed row with data: ${dt.toISOString()},${Object.values(row).join(',')}`);
                    console.log(`Row Data: ${JSON.stringify(row)}`);
                    events.push(`${dt.toISOString()},${Object.values(row).join(',')}`);
                }
                catch (err) {
                    console.log(`Error processing row: ${err.message}`);
                }
            }
            await this.postToChannel(events, isNewMessage);
        }
        catch (err) {
            console.log(`Error retrieving data: ${err.message}`);
        }
    }
    async postToChannel(messages, isNewMessage) {
        console.log("Posting to Discord channel...");
        const currentDate = (0, date_fns_1.format)((0, date_fns_tz_1.utcToZonedTime)(new Date(), "Europe/Istanbul"), "yyyy-MM-dd");
        try {
            const eventsByDate = {};
            messages.forEach((message) => {
                const [date, currency, impact, event, actual, forecast, previous] = message.split(',');
                const localDate = (0, date_fns_1.format)((0, date_fns_tz_1.utcToZonedTime)(new Date(date), "Europe/Istanbul"), "yyyy-MM-dd");
                const localDateTime = (0, date_fns_1.format)(new Date(date), "yyyy-MM-dd'T'HH:mm:ss.SSS");
                if (!eventsByDate[localDate]) {
                    eventsByDate[localDate] = [];
                }
                eventsByDate[localDate].push([localDateTime, currency, impact, event, actual, forecast, previous].join(','));
            });
            console.log("Events by date:", eventsByDate);
            for (const date in eventsByDate) {
                if (date !== currentDate) {
                    continue;
                }
                if (eventsByDate[date].length === 0) {
                    console.log(`No events found for date ${date}.`);
                    continue;
                }
                let tableString = "";
                const validData = eventsByDate[date].map(row => {
                    const [date, currency, impact, event, actual, forecast, previous] = row.split(',');
                    const rowData = { date, currency, impact, event, actual: actual === '' ? '' : actual, forecast, previous };
                    return rowData;
                });
                const sortedValidData = validData.sort((a, b) => {
                    const aDate = new Date(a.date);
                    const bDate = new Date(b.date);
                    if (aDate > bDate) {
                        return 1;
                    }
                    else if (aDate < bDate) {
                        return -1;
                    }
                    else {
                        return 0;
                    }
                });
                const currencyFlagMap = {
                    'USD': ':flag_us:',
                    'EUR': ':flag_eu:',
                    'NZD': ':flag_nz:',
                    'AUD': ':flag_au:',
                    'JPY': ':flag_jp:',
                    'GBP': ':flag_gb:',
                    'CAD': ':flag_ca:',
                    'CNY': ':flag_cn:',
                    'CHF': ':flag_ch:',
                };
                const impactEmojiMap = {
                    'High Impact Expected': ':red_square:',
                    'Medium Impact Expected': ':orange_square:',
                    'Low Impact Expected': ':yellow_square:',
                    'Non-Economic': ':white_large_square:',
                };
                const rightHeader = [
                    { label: 'Gerçek', pad: 7 },
                    { label: 'Tahmin', pad: 7 },
                    { label: 'Önceki', pad: 6 },
                ];
                const currentDateUnix = Math.floor((0, date_fns_tz_1.utcToZonedTime)(new Date(), "Europe/Istanbul").getTime() / 1000);
                const rightHeaderString = rightHeader.reduce((acc, item, index) => {
                    return acc + `${item.label}`.padEnd(item.pad, ' ');
                }, '').trim();
                const headerFormatted = `<t:${currentDateUnix}:d> | \`${"Olay".padEnd(22, ' ')}\` \`${rightHeaderString}\`\n\n`;
                for (const rowData of sortedValidData) {
                    const eventTime = (0, date_fns_1.format)((0, date_fns_tz_1.utcToZonedTime)(new Date(rowData.date), "Europe/Istanbul"), "HH:mm");
                    const currencyFlag = currencyFlagMap[rowData.currency] || rowData.currency;
                    const impactEmoji = impactEmojiMap[rowData.impact] || rowData.impact;
                    const eventString = rowData.event.slice(0, 22).padEnd(22, ' ');
                    const actualString = (rowData.actual || '').padStart(rowData.actual && rowData.actual.startsWith('-') ? 6 : 6, ' ');
                    const forecastString = rowData.forecast.padStart(rowData.forecast.startsWith('-') ? 6 : 6, ' ');
                    const previousString = rowData.previous.padStart(rowData.previous.startsWith('-') ? 6 : 6, ' ');
                    const tableRow = `\`${eventTime}\` ${currencyFlag} ${impactEmoji} \`${eventString}\` \`${actualString} ${forecastString} ${previousString}\`\n`;
                    tableString += tableRow;
                }
                const mentionRole = "<@&1080973408990404758>";
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Günün Ekonomik Takvimi')
                    .setAuthor({ name: 'Dark Side Finance', iconURL: 'https://lh3.googleusercontent.com/u/1/drive-viewer/AFGJ81pWqrVpOMnaErPEKyTP1AvVsLvkau9uObXpOvFOMsOJyFD8wGKJFdmN1UmqAzubMJXRuBBBQVwONMNwZmH-3UpuVQaA=w1920-h929', url: 'https://discord.gg/2Gstp3FjuH' })
                    .setDescription(headerFormatted + `${tableString}`)
                    .setThumbnail('https://lh3.googleusercontent.com/u/1/drive-viewer/AFGJ81rbuLyn1PoBAsyuWE7Wk5A09KutoQj9C58LySPnfqKAI_-sMmDdu2ct29DrR0aj6uZUsegbSjWqZf081XIyzew3nddxeA=w1920-h929')
                    .setTimestamp()
                    .setFooter({ text: 'R2-D2 Bot Powered by Dark Side Community', iconURL: 'https://cdn.discordapp.com/avatars/1083518271531257966/6af47747a8daa570d0c83d13f8a36201.png?size=512' });
                const client = this.botService.getClient();
                const channel = await client.channels.fetch('1093765685747925012');
                console.log("Sending embed message to Discord channel...");
                if (isNewMessage) {
                    const sentMessage = await channel.send({ content: mentionRole, embeds: [embed] });
                    this.messageId = sentMessage.id;
                }
                else {
                    if (this.messageId) {
                        const existingMessage = await channel.messages.fetch(this.messageId);
                        await existingMessage.edit({ embeds: [embed] });
                    }
                }
                console.log("Message sent to Discord channel.");
            }
        }
        catch (error) {
            console.error("Error sending embed message to Discord channel:", error);
        }
    }
};
__decorate([
    (0, schedule_1.Cron)('45 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScraperService.prototype, "onMidnightCronJob", null);
__decorate([
    (0, schedule_1.Cron)('0 0,15,30,45 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScraperService.prototype, "onFirstCronJob", null);
__decorate([
    (0, schedule_1.Cron)('1-59/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScraperService.prototype, "onSecondCronJob", null);
ScraperService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bot_service_1.BotService])
], ScraperService);
exports.ScraperService = ScraperService;
//# sourceMappingURL=calendar.service.js.map