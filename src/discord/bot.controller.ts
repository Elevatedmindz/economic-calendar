import { Controller, Get } from '@nestjs/common';
import { User } from 'discord.js';
import { get } from 'http';

@Controller('bot')
export class BotController {
    @Get()
    getuser(): string{
        return 'R2-D2!';
    }
}
