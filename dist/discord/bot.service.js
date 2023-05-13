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
exports.BotService = void 0;
const common_1 = require("@nestjs/common");
const discord_js_1 = require("discord.js");
let BotService = class BotService {
    constructor() {
        const clientOptions = {
            intents: ['Guilds', 'GuildMessages', 'DirectMessages'],
        };
        this.client = new discord_js_1.Client(clientOptions);
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user.tag}!`);
        });
        this.client.login('MTA4MzUxODI3MTUzMTI1Nzk2Ng.G9qSDR.aC1QExNq_DiyBNoSd8HsozqM-R1mfmLPEPYxwQ');
    }
    getClient() {
        return this.client;
    }
    async startBot(botToken) {
        await this.client.login(botToken);
    }
};
BotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BotService);
exports.BotService = BotService;
//# sourceMappingURL=bot.service.js.map