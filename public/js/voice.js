let recognizing = false;
let voiceAssistantActive = false;

const synth = window.speechSynthesis;

async function startVoiceAssistant() {
    if (voiceAssistantActive) return;
    voiceAssistantActive = true;
    document.getElementById("record-btn").innerText = "🛑 Stop Assistant";

    const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => recognizing = true;
    recognition.onend = () => recognizing = false;

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("🎤 User said:", transcript);
        await handleVoiceMessage(transcript);
        if (voiceAssistantActive) startVoiceAssistant(); // keep looping
    };

    recognition.onerror = (e) => {
        console.error("Voice Error:", e);
        if (voiceAssistantActive) setTimeout(startVoiceAssistant, 1500); // retry
    };

    recognition.start();
}

function stopVoiceAssistant() {
    voiceAssistantActive = false;
    document.getElementById("record-btn").innerText = "🎤 Voice Assistant";
    if (recognizing && window.speechRecognition) window.speechRecognition.stop();
}

async function handleVoiceMessage(message) {
    await sendMessage(message, true); // true = speak response
}

function speakResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
}
