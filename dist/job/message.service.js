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
exports.MessageService = void 0;
const common_1 = require("@nestjs/common");
const bot_service_1 = require("../discord/bot.service");
const discord_js_1 = require("discord.js");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
let MessageService = class MessageService {
    constructor(botService) {
        this.botService = botService;
        this.messageId = '';
        this.channelID = '1306728238021873674';
        this.mentionRole = "<@&742012725630206023>";
        this.timezone = "America/New_York";
    }
    async resetMessageId() {
        this.messageId = '';
    }
    async postToChannel(messages, isNewMessage = true) {
        console.log("Posting to Discord channel...");
        try {
            const eventsByDate = this.groupEventsByDate(messages);
            console.log("Events by date:", eventsByDate);
            for (const date in eventsByDate) {
                const validData = this.createValidData(eventsByDate[date]);
                const sortedValidData = this.sortDataByDate(validData);
                const tableString = this.buildTableString(sortedValidData);
                const embed = this.buildEmbedMessage(tableString);
                await this.sendOrEditMessage(embed, isNewMessage);
            }
        }
        catch (error) {
            console.error("Error sending embed message to Discord channel:", error);
        }
    }
    groupEventsByDate(messages) {
        const eventsByDate = {};
        messages.forEach((message) => {
            const [date, ...eventDetails] = message.split(',');
            const localDate = (0, date_fns_1.format)((0, date_fns_tz_1.utcToZonedTime)(new Date(date), this.timezone), "yyyy-MM-dd");
            if (!eventsByDate[localDate]) {
                eventsByDate[localDate] = [];
            }
            eventsByDate[localDate].push([date, ...eventDetails].join(','));
        });
        return eventsByDate;
    }
    createValidData(rows) {
        return rows.map(row => {
            const [date, currency, impact, event, actual, forecast, previous] = row.split(',');
            return { date, currency, impact, event, actual: actual === '' ? '' : actual, forecast, previous };
        });
    }
    sortDataByDate(data) {
        return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    buildTableString(validData) {
        let tableString = "";
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
        for (const rowData of validData) {
            const eventTime = (0, date_fns_1.format)((0, date_fns_tz_1.utcToZonedTime)(new Date(rowData.date), this.timezone), "HH:mm");
            const currencyFlag = currencyFlagMap[rowData.currency] || rowData.currency;
            const impactEmoji = impactEmojiMap[rowData.impact] || rowData.impact;
            const eventString = rowData.event.slice(0, 36).padEnd(34, ' ');
            const actualString = (rowData.actual || '').padStart(rowData.actual && rowData.actual.startsWith('-') ? 6 : 6, ' ');
            const forecastString = rowData.forecast.padStart(rowData.forecast.startsWith('-') ? 6 : 6, ' ');
            const previousString = rowData.previous.padStart(rowData.previous.startsWith('-') ? 6 : 6, ' ');
            const tableRow = `\`${eventTime}\` ${currencyFlag} ${impactEmoji} \`${eventString}\` \`${actualString} ${forecastString} ${previousString}\`\n`;
            tableString += tableRow;
        }
        return tableString;
    }
    buildEmbedMessage(tableString) {
        const rightHeader = [
            { label: 'Gerçek', pad: 7 },
            { label: 'Tahmin', pad: 7 },
            { label: 'Önceki', pad: 6 },
        ];
        const currentDateUnix = Math.floor((0, date_fns_tz_1.utcToZonedTime)(new Date(), this.timezone).getTime() / 1000);
        const rightHeaderString = rightHeader.reduce((acc, item, index) => {
            return acc + `${item.label}`.padEnd(item.pad, ' ');
        }, '').trim();
        const headerFormatted = `<t:${currentDateUnix}:d> | \`${"Olay".padEnd(35, ' ')}\` \`${rightHeaderString}\`\n\n`;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Günün Ekonomik Takvimi')
            .setAuthor({ name: 'Dark Side Finance', iconURL: 'https://lh3.googleusercontent.com/u/1/drive-viewer/AFGJ81rO6TwR5ZQu_FVjd8KvVXsUf4G7KJe0czvE3lHbCgT_71h_Gv4j-iRrvdh8x4Tg_LkE6wmAsS9_1DM9uX00gtbkV7ozNQ=w1920-h929', url: 'https://discord.gg/darks' })
            .setDescription(headerFormatted + `${tableString}`)
            .setTimestamp()
            .setFooter({ text: 'R2-D2 Bot Powered by Dark Side Community', iconURL: 'https://cdn.discordapp.com/avatars/1083518271531257966/6af47747a8daa570d0c83d13f8a36201.png?size=512' });
        return embed;
    }
    async sendOrEditMessage(embed, isNewMessage) {
        const client = this.botService.getClient();
        const channel = await client.channels.fetch(this.channelID);
        console.log("Sending embed message to Discord channel...");
        if (isNewMessage) {
            const sentMessage = await channel.send({ content: this.mentionRole, embeds: [embed] });
            this.messageId = sentMessage.id;
        }
        else if (this.messageId) {
            const existingMessage = await channel.messages.fetch(this.messageId);
            await existingMessage.edit({ embeds: [embed] });
        }
        console.log("Message sent to Discord channel.");
    }
};
MessageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bot_service_1.BotService])
], MessageService);
exports.MessageService = MessageService;
//# sourceMappingURL=message.service.js.map
