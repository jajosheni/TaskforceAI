import {
    showTranscribing,
    disableInput,
    clearInput,
    appendUserMessage,
    appendAIMessage,
    showLoading
} from "./ui.js";

let mediaRecorder, isRecording = false;
let audioChunks = [];
let voiceSessionActive = false;
let stopRequested = false;
let audioPlayer = new Audio();
let isSpeaking = false; // 🧠 Track TTS state
let stopButton;

let isActivelyRecording = false;
const waveformCanvas = document.getElementById("recording-waveform");
const waveformCtx = waveformCanvas.getContext("2d");

const recordBtn = document.getElementById("record-btn");
const transcribingIndicator = document.getElementById("transcribing");

const skipSpeechWrapper = document.getElementById("skip-speech-wrapper");
const skipSpeechBtn = document.getElementById("skip-speech-btn");

recordBtn.addEventListener("click", () => {
    if (voiceSessionActive) {
        stopVoiceSession();
    } else {
        startVoiceSession();
    }
});

function startVoiceSession() {
    voiceSessionActive = true;
    stopRequested = false;

    disableInput(true);
    recordBtn.classList.add("recording");
    recordBtn.innerText = "🛑 Stop";
    recordBtn.disabled = false; // ✅ always enabled in voice mode

    skipSpeechWrapper.style.display = "block";
    skipSpeechBtn.disabled = true;

    loopVoiceInput();
}

function stopVoiceSession() {
    voiceSessionActive = false;
    stopRequested = true;

    disableInput(false);
    recordBtn.classList.remove("recording");
    recordBtn.innerText = "🎤 Voice Assistant";
    skipSpeechWrapper.style.display = "none";

    stopSpeechPlayback();
}

async function loopVoiceInput() {
    while (voiceSessionActive && !stopRequested) {
        if (isSpeaking) {
            // Wait until TTS is done
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
        }

        const text = await recordAndTranscribe();
        if (!text || text.trim().length < 2) continue;

        if (text.toLowerCase().includes("stop")) {
            stopVoiceSession();
            return;
        }

        appendUserMessage(text);
        const response = await sendToAI(text);
        appendAIMessage(response.message);

        const shortText = response.message.length > 350
            ? "The message is long, you can check task details in the response."
            : response.message;

        await speak(shortText);
    }

    stopVoiceSession();
}

// --- AUDIO RECORDING + TRANSCRIPTION ---
async function recordAndTranscribe() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    audioChunks = [];

    mediaRecorder = new MediaRecorder(stream);
    // Wait 0.5 seconds to make things more responsive
    await new Promise(resolve => setTimeout(resolve, 500));

    return new Promise((resolve) => {
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            isActivelyRecording = false;
            waveformCanvas.classList.remove("listening");

            stream.getTracks().forEach(track => track.stop());

            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append("audio", blob, "recording.webm");

            showTranscribing(true);

            try {
                const res = await fetch("/voice/transcribe", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                resolve(data.text || "");
            } catch (err) {
                console.error("Transcription error:", err);
                resolve("");
            } finally {
                showTranscribing(false);
            }
        };


        mediaRecorder.start();
        isActivelyRecording = true;
        waveformCanvas.classList.add("listening");
        drawWaveform(analyser);

        checkSilence(analyser, dataArray, () => {
            mediaRecorder.stop();
        });
    });
}

function checkSilence(analyser, dataArray, onSilence) {
    const bufferLength = dataArray.length;
    let silenceStart = null;

    function detect() {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / bufferLength;

        if (volume < 10) {
            if (silenceStart === null) silenceStart = Date.now();
            else if (Date.now() - silenceStart > 1000) onSilence();
        } else {
            silenceStart = null;
        }

        if (mediaRecorder && mediaRecorder.state === "recording") {
            requestAnimationFrame(detect);
        }
    }

    detect();
}

// --- AI CALL ---
async function sendToAI(text) {
    showLoading(true);
    clearInput();

    try {
        const res = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{ role: "user", content: text }],
                userId: localStorage.getItem("userId")
            }),
        });
        const data = await res.json();
        showLoading(false);
        return data;
    } catch (err) {
        showLoading(false);
        console.error("AI error:", err);
        return { message: "Something went wrong." };
    }
}

// --- TTS PLAYBACK ---
skipSpeechBtn.addEventListener("click", stopSpeechPlayback);

async function speak(text) {
    try {
        const res = await fetch("/voice/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        const blob = await res.blob();
        audioPlayer.src = URL.createObjectURL(blob);

        isSpeaking = true; // ✅ Set flag
        skipSpeechBtn.disabled = false;
        audioPlayer.play();

        return new Promise((resolve) => {
            audioPlayer.onended = () => {
                isSpeaking = false; // ✅ Clear flag
                skipSpeechBtn.disabled = true;
                resolve();
            };
        });
    } catch (err) {
        console.error("TTS error:", err);
        isSpeaking = false;
        skipSpeechBtn.disabled = true;
    }
}

function stopSpeechPlayback() {
    if (!audioPlayer.paused) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }

    skipSpeechBtn.disabled = true;
    isSpeaking = false;
}


function showStopSpeechButton() {
    if (!stopButton) {
        stopButton = document.createElement("button");
        stopButton.innerText = "🛑 Stop Speech";
        stopButton.style.marginTop = "10px";
        stopButton.onclick = stopSpeechPlayback;
        document.querySelector(".chat-container").appendChild(stopButton);
    }
    stopButton.style.display = "block";
}

function hideStopSpeechButton() {
    if (stopButton) stopButton.style.display = "none";
}

function drawWaveform(analyser) {
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!isActivelyRecording) return;

        analyser.getByteTimeDomainData(dataArray);

        waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        waveformCtx.beginPath();

        const sliceWidth = waveformCanvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * waveformCanvas.height) / 2;
            i === 0 ? waveformCtx.moveTo(x, y) : waveformCtx.lineTo(x, y);
            x += sliceWidth;
        }

        waveformCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
        waveformCtx.strokeStyle = "#2ea043";
        waveformCtx.lineWidth = 2;
        waveformCtx.stroke();

        requestAnimationFrame(() => draw());
    }

    draw();
}
