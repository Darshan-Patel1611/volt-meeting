const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const os = require('os');
const fs = require('fs');

async function startMeetingRecordingJob(meetingUrl, jobId) {
    console.log(`[${jobId}] Starting meeting recording job...`);
    const browser = await puppeteer.launch({ headless: false, args: ['--window-size=1280,720'] });
    const page = await browser.newPage();
    await page.goto(meetingUrl);

    // Wait for the Teams meeting page to load (wait for any button)
    try {
        await page.waitForSelector('button, [role="button"]', { timeout: 60000 });
        // Optionally, click "Join now" if needed:
        // const joinButton = await page.$('button[aria-label="Join now"]');
        // if (joinButton) await joinButton.click();
    } catch (err) {
        console.error(`[${jobId}] Could not find join button or meeting page did not load:`, err.message);
    }

    // Start ffmpeg recording
    const output = `upload/recording-${jobId}.mp4`;
    let cmd;
    if (os.platform() === 'win32') {
        cmd = `"${ffmpegPath}" -f gdigrab -framerate 30 -i desktop -f dshow -i audio="Stereo Mix (Realtek(R) Audio)" -vcodec libx264 -preset ultrafast -acodec aac "${output}"`;
    } else {
        cmd = `"${ffmpegPath}" -f x11grab -framerate 30 -i :0.0 -f pulse -i default -vcodec libx264 -preset ultrafast -acodec aac "${output}"`;
    }
    const ffmpegProcess = exec(cmd);

    // Loop: check every 5 seconds if "You're the only one here" or similar is visible
    let meetingEnded = false;
    while (!meetingEnded) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
            if (page.isClosed()) {
                console.log(`[${jobId}] Page is closed. Exiting monitoring loop.`);
                break;
            }
            // Get the visible text of the page for debugging
            const pageText = await page.evaluate(() => document.body.innerText);
            console.log(`[${jobId}] Page text (first 200 chars):`, pageText.slice(0, 200).replace(/\n/g, ' '));
            // Check for "You're the only one here" or similar
            const onlyOneHere = /only one here|waiting for others|no one else is here|you're the only participant/i.test(pageText);
            if (onlyOneHere) {
                meetingEnded = true;
                console.log(`[${jobId}] No other participants detected. Ending meeting and recording.`);
            }
        } catch (err) {
            console.error(`[${jobId}] Puppeteer navigation/evaluate error:`, err.message);
            break; // Exit loop if navigation error occurs
        }
    }

    ffmpegProcess.kill('SIGINT');
    await browser.close();
    console.log(`[${jobId}] Meeting ended, recording stopped.`);
}

module.exports = { startMeetingRecordingJob };