import { Client } from 'discord.js';
export declare class BotService {
    private readonly client;
    constructor();
    getClient(): Client;
    startBot(botToken: string): Promise<void>;
}
