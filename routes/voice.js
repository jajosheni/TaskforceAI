const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { OpenAI } = require('openai');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const upload = multer({ dest: 'uploads/' });
const ffmpegPath = path.join(__dirname, "../bin/ffmpeg.exe"); // Path to local FFmpeg

router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded." });
        }

        const inputFilePath = req.file.path;
        const outputFilePath = `${inputFilePath}.mp3`;

        // Convert the audio file to MP3 using FFmpeg
        exec(`"${ffmpegPath}" -i "${inputFilePath}" -acodec libmp3lame -y "${outputFilePath}"`, async (error) => {
            if (error) {
                console.error("FFmpeg Error:", error);
                return res.status(500).json({ error: "Failed to convert audio file." });
            }

            // Transcribe the MP3 file using OpenAI Whisper
            try {
                const transcript = await openai.audio.transcriptions.create({
                    model: "whisper-1",
                    file: fs.createReadStream(outputFilePath),
                    response_format: "text",
                    language: "en"
                });

                // Clean up temporary files
                fs.unlinkSync(inputFilePath);
                fs.unlinkSync(outputFilePath);

                res.json({ text: transcript });
            } catch (transcriptionError) {
                console.error("OpenAI Error:", transcriptionError);
                res.status(500).json({ error: "Failed to transcribe audio." });
            }
        });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/speak", async (req, res) => {
    const { text } = req.body;
    try {
        const speech = await openai.audio.speech.create({
            model: "tts-1",
            voice: "nova",
            input: text,
        });
        const buffer = await speech.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error("TTS error:", error);
        res.status(500).json({ error: "TTS failed" });
    }
});


module.exports = router;
