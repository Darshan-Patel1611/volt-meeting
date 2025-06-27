const { ActivityHandler } = require('botbuilder');
const { scheduleMeeting } = require('./schedular');
const { v4: uuidv4 } = require('uuid');

class TeamsRecordingBot extends ActivityHandler {
    constructor() {
        super();
        this.onMessage(async (context, next) => {
            const text = context.activity.text ? context.activity.text.trim() : '';
            console.log('Received message:', text);

            if (text.startsWith('schedule recording:')) {
                // Example: schedule recording: <meeting_url> at <YYYY-MM-DD HH:mm>
                const match = text.match(/schedule recording:\s*(\S+)\s*at\s*([\d-]+\s+[\d:]+)/i);
                if (match) {
                    const meetingUrl = match[1];
                    const startTime = new Date(match[2]);
                    const jobId = uuidv4();
                    scheduleMeeting(meetingUrl, startTime, jobId);
                    await context.sendActivity(`Scheduled recording for ${startTime}.\nJob ID: ${jobId}`);
                } else {
                    await context.sendActivity('Invalid format. Use: schedule recording: <meeting_url> at <YYYY-MM-DD HH:mm>');
                }
            } else {
                await context.sendActivity('Say "schedule recording: <meeting_url> at <YYYY-MM-DD HH:mm>" to schedule.');
            }

            await next();
        });
    }
}

module.exports.TeamsRecordingBot = TeamsRecordingBot;