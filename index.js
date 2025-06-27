require('dotenv').config();
const express = require('express');
const { ConfigurationBotFrameworkAuthentication, CloudAdapter } = require('botbuilder');
const { TeamsRecordingBot } = require('./teamsBot');

const app = express();
app.use(express.json());

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(process.env);
const adapter = new CloudAdapter(botFrameworkAuthentication);

adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError]: ${error}`);
    await context.sendActivity('Oops. Something went wrong!');
};

const bot = new TeamsRecordingBot();

app.post('/api/messages', async (req, res) => {
    console.log('POST /api/messages called');
    await adapter.process(req, res, async (context) => {
        await bot.run(context);
    });
});

app.listen(3978, () => {
    console.log(`Teams bot listening on port 3978`);
});
