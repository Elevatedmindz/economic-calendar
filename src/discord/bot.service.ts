import { Injectable } from '@nestjs/common';
import { Client, ClientOptions } from 'discord.js';

@Injectable()
export class BotService {
  private readonly client: Client;

  constructor() {
    const clientOptions: ClientOptions = {
      intents: ['Guilds', 'GuildMessages', 'DirectMessages'],
    };
    this.client = new Client(clientOptions);
    this.client.on('ready', () => {
      console.log(`Logged in as ${this.client.user.tag}!`);
    });
    this.client.login('MTA4MzUxODI3MTUzMTI1Nzk2Ng.G9qSDR.aC1QExNq_DiyBNoSd8HsozqM-R1mfmLPEPYxwQ');
  }

  getClient(): Client {
    return this.client;
  }

  async startBot(botToken: string) {
    await this.client.login(botToken);
  }
}