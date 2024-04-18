<p align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/4712/4712104.png" width="200" alt="Nest Logo" />
</p>

<p align="center">A financial calendar bot for Discord built with Nest.js.</p>

## Description

This project utilizes Node.js to create a financial calendar bot for Discord, helping users stay updated with financial events and announcements.

## Bot Features

This Discord financial calendar bot automatically sends daily economic events to a specified channel in a Discord server. The primary aim of the bot is to provide users with current information about economic events. Here are some key features of the bot:

### 1. Channel Specification

A channel must be designated for the bot to operate. This channel is where the bot will send daily economic events. The bot service should specify this channel.

### 2. Daily Updates

The bot sends current economic events to the specified channel every day at midnight (it's important to note that the timing can be adjustable). These events include economic data released for the day that are deemed significant.

### 3. Real-time Updates

When a specific economic event is announced, the bot instantly displays the actual, previous, and predicted values of the event. This feature enables users to access quick and up-to-date information when economic events are significant.

### 4. Automatic Updates

After an economic event is announced, the bot provides the updated actual value of the event within a minute. This allows users to access current data even at the moment the events occur.

These features are designed to facilitate financial tracking and analysis in Discord servers, making it easier for users to stay informed.


## Installation

```bash
$ npm install
```

## Running the bot locally

To run the bot locally, you need to follow these steps:

1. **Set up Discord bot token:**
   - Create a Discord application and bot on the [Discord Developer Portal](https://discord.com/developers/applications).
   - Copy the bot token provided.

2. **Set up environment variables:**
   - Create a `.env` file in the root directory.
   - Add your Discord bot token to the `.env` file:
     ```
     DISCORD_TOKEN=your_discord_bot_token_here
     ```

3. **Start the bot:**
   ```bash
   $ npm run start
   ```

## Usage

Once the bot is running, it will be online on your Discord server. You can interact with it using commands to get information about financial events, announcements, and more.

## Support

This project is licensed under the MIT License and is open source. Contributions are welcomed, and support from backers helps sustain the project. If you're interested in contributing or supporting, please contact me via email at [ihsan.ersen@hotmail.com](mailto:ihsan.ersen@hotmail.com).


## Stay in touch

- Author - [İhsan Erşen](https://sleda.github.io)
- GitHub - [sleda](https://github.com/sleda)

## License

This project is licensed under the [MIT License](LICENSE).
