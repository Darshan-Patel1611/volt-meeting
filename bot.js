const express = require('express');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
const os = require('os');

const app = express();
app.use(express.json());

app.post('/start-recording', async (req, res) => {
    const { meetingUrl = process.env.DEFAULT_MEETING_URL, duration = process.env.RECORDING_DURATION || 10 } = req.body;
    console.log('Received /start-recording:', { meetingUrl, duration });
    if (!meetingUrl) {
        return res.status(400).send('meetingUrl is required');
    }

    const uploadDir = path.join(__dirname, 'upload');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    // Unique filename for each recording
    const timestamp = Date.now();
    const output = path.join(uploadDir, `recording-${timestamp}.mp4`);

    try {
        // 1. Launch Puppeteer and join the meeting
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                '--use-fake-ui-for-media-stream',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1280,720'
            ]
        });
        const page = await browser.newPage();
        await page.goto(meetingUrl);

        // Wait for user to join or automate login/join here if needed
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 2. Start ffmpeg recording (screen + system audio)
        let cmd;
        if (os.platform() === 'win32') {
            // Windows
            cmd = `ffmpeg -f gdigrab -framerate 30 -i desktop -f dshow -i audio="Stereo Mix (Realtek(R) Audio)" -vcodec libx264 -preset ultrafast -acodec aac -t ${duration} "${output}"`;
        } else if (os.platform() === 'linux') {
            // Linux
            cmd = `ffmpeg -f x11grab -framerate 30 -i :0.0 -f pulse -i default -vcodec libx264 -preset ultrafast -acodec aac -t ${duration} "${output}"`;
        } else {
            throw new Error('Unsupported OS');
        }
        console.log('Recording started...');
        exec(cmd, async (error, stdout, stderr) => {
            await browser.close();
            if (error) {
                console.error(`Recording error: ${error.message}`);
                console.log('Recording stopped due to error.');
                return;
            }
            console.log('Recording stopped successfully.');
            // You can add S3 upload or DB logic here
        });

        res.send(`Recording started for ${duration} seconds. File will be saved as: ${output}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to start recording');
    }
});

app.listen(3000, () => console.log('Bot server running on port 3000'));