const { ActivityHandler } = require('botbuilder');
const axios = require('axios');
require('dotenv').config();

class TeamsRecordingBot extends ActivityHandler {
    constructor() {
        super();
        this.onMessage(async (context, next) => {
            const text = context.activity.text ? context.activity.text.trim().toLowerCase() : '';
            console.log('Received message:', text);

            if (text.startsWith('start recording')) {
                let meetingUrl = process.env.DEFAULT_MEETING_URL;
                let duration = process.env.RECORDING_DURATION || 60;

                const parts = context.activity.text.split(':');
                if (parts.length > 1 && parts[1].trim()) {
                    meetingUrl = parts.slice(1).join(':').trim();
                }

                await context.sendActivity('Starting the recording process...');

                axios.post(`${process.env.RECORDING_BACKEND_URL}/start-recording`, {
                    meetingUrl,
                    duration
                }).then(() => {
                    console.log('Recording started');
                }).catch((err) => {
                    console.error('Recording error:', err.message);
                });
            } else {
                await context.sendActivity('Say "start recording" or "start recording: <meeting_url>" to begin.');
            }

            await next();
        });
    }
}

module.exports.TeamsRecordingBot = TeamsRecordingBot;
