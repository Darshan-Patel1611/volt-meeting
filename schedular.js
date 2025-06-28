const cron = require('node-cron');
const { startMeetingRecordingJob } = require('./meetingJob');

const scheduledJobs = {};

function scheduleMeeting(meetingUrl, startTime, jobId) {
    // startTime: JS Date object
    const cronTime = `${startTime.getMinutes()} ${startTime.getHours()} ${startTime.getDate()} ${startTime.getMonth() + 1} *`;
    const job = cron.schedule(cronTime, () => {
        startMeetingRecordingJob(meetingUrl, jobId);
        job.stop(); // One-time job
    });
    scheduledJobs[jobId] = job;
}

module.exports = { scheduleMeeting, scheduledJobs };