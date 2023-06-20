import { Injectable } from '@nestjs/common';
import { BotService } from '../discord/bot.service';
import { EmbedBuilder, TextChannel, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } from 'discord.js';
import { format, parse } from 'date-fns';
import { utcToZonedTime as utcToZonedTimeTZ, zonedTimeToUtc as zonedTimeToUtcTZ } from 'date-fns-tz';

@Injectable()
export class MessageService {
  private messageId: string = '';
  private readonly channelID = '1093765685747925012'; // Kanal ID'si
  private readonly mentionRole = "<@&1080973408990404758>"; // Rol
  private readonly timezone = "Europe/Istanbul";
  
  constructor(private readonly botService: BotService) {}
  
  async resetMessageId() {
    this.messageId = '';
  }

  async postToChannel(messages: string[], isNewMessage: boolean = true) {
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

    } catch (error) {
      console.error("Error sending embed message to Discord channel:", error);
    }
  }

  private groupEventsByDate(messages: string[]): { [key: string]: string[] } {
    const eventsByDate: { [key: string]: string[] } = {};
    messages.forEach((message) => {
      const [date, ...eventDetails] = message.split(',');
      const localDate = format(utcToZonedTimeTZ(new Date(date), this.timezone), "yyyy-MM-dd");

      if (!eventsByDate[localDate]) {
        eventsByDate[localDate] = [];
      }
      eventsByDate[localDate].push([date, ...eventDetails].join(','));
    });
    return eventsByDate;
  }

  private createValidData(rows: string[]) {
    return rows.map(row => {
      const [date, currency, impact, event, actual, forecast, previous] = row.split(',');
      return { date, currency, impact, event, actual: actual === '' ? '' : actual, forecast, previous };
    });
  }

  private sortDataByDate(data) {
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private buildTableString(validData) {
    // Continue with the original logic...
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
      const eventTime = format(utcToZonedTimeTZ(new Date(rowData.date), this.timezone), "HH:mm");
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

  private buildEmbedMessage(tableString) {
    // Continue with the original logic...
    const rightHeader = [
      { label: 'Gerçek', pad: 7 },
      { label: 'Tahmin', pad: 7 },
      { label: 'Önceki', pad: 6 },
    ];

    const currentDateUnix = Math.floor(utcToZonedTimeTZ(new Date(), this.timezone).getTime() / 1000);

    const rightHeaderString = rightHeader.reduce((acc, item, index) => {
      return acc + `${item.label}`.padEnd(item.pad, ' ');
    }, '').trim();

    const headerFormatted = `<t:${currentDateUnix}:d> | \`${"Olay".padEnd(35, ' ')}\` \`${rightHeaderString}\`\n\n`;

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Günün Ekonomik Takvimi')
      .setAuthor({ name: 'Dark Side Finance', iconURL: 'https://lh3.googleusercontent.com/u/1/drive-viewer/AFGJ81rO6TwR5ZQu_FVjd8KvVXsUf4G7KJe0czvE3lHbCgT_71h_Gv4j-iRrvdh8x4Tg_LkE6wmAsS9_1DM9uX00gtbkV7ozNQ=w1920-h929', url: 'https://discord.gg/darks' })
      .setDescription(headerFormatted + `${tableString}`)
      .setTimestamp()
      .setFooter({ text: 'R2-D2 Bot Powered by Dark Side Community', iconURL: 'https://cdn.discordapp.com/avatars/1083518271531257966/6af47747a8daa570d0c83d13f8a36201.png?size=512' });

    return embed;
  }

  private async sendOrEditMessage(embed, isNewMessage: boolean) {
    const client = this.botService.getClient();
    const channel = await client.channels.fetch(this.channelID) as TextChannel;
    
    console.log("Sending embed message to Discord channel...");

    if (isNewMessage) {
      const sentMessage = await channel.send({ content: this.mentionRole, embeds: [embed] });
      this.messageId = sentMessage.id;
    } else if (this.messageId) {
      const existingMessage = await channel.messages.fetch(this.messageId);
      await existingMessage.edit({ embeds: [embed] });
    }

    console.log("Message sent to Discord channel.");
  }
}