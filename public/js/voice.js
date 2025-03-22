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
let stopButton;

const recordBtn = document.getElementById("record-btn");
const transcribingIndicator = document.getElementById("transcribing");

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
    loopVoiceInput();
}

function stopVoiceSession() {
    voiceSessionActive = false;
    stopRequested = true;
    disableInput(false);
    recordBtn.classList.remove("recording");
    recordBtn.innerText = "🎤 Voice Assistant";
    stopSpeechPlayback();
}

async function loopVoiceInput() {
    while (voiceSessionActive && !stopRequested) {
        const text = await recordAndTranscribe();
        if (!text || text.trim().length < 2) continue;

        if (text.toLowerCase().includes("stop")) {
            stopVoiceSession();
            return;
        }

        appendUserMessage(text);
        const response = await sendToAI(text);
        appendAIMessage(response.message);

        if (response.message) {
            const shortText = response.message.length > 350
                ? "The message is long, you can check task details in the response."
                : response.message;

            await speak(shortText);
        }
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

    return new Promise((resolve) => {
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
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
async function speak(text) {
    try {
        const res = await fetch("/voice/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        const blob = await res.blob();
        audioPlayer.src = URL.createObjectURL(blob);
        audioPlayer.play();

        showStopSpeechButton();

        return new Promise((resolve) => {
            audioPlayer.onended = () => {
                hideStopSpeechButton();
                resolve();
            };
        });
    } catch (err) {
        console.error("TTS error:", err);
    }
}

function stopSpeechPlayback() {
    if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        hideStopSpeechButton();
    }
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
