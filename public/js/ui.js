export function showLoading(state = true) {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = state ? "block" : "none";
}

export function showTranscribing(state = true) {
    const transcribing = document.getElementById("transcribing");
    if (transcribing) transcribing.style.display = state ? "block" : "none";
}

export function appendUserMessage(message) {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML += `<div class="user-message">${message}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

export function appendAIMessage(markdown) {
    const chatBox = document.getElementById("chat-box");
    const html = marked.parse(markdown);
    chatBox.innerHTML += `<div class="ai-message">${html}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

export function clearInput() {
    const input = document.getElementById("user-input");
    if (input) input.value = "";
}

export function disableInput(disabled = true) {
    document.getElementById("user-input").disabled = disabled;
    document.getElementById("send-btn").disabled = disabled;
    document.getElementById("record-btn").disabled = disabled;
}

export function updateSuggestions(suggestions = [], initialization = false) {
    const container = document.getElementById("button-suggestions-container");
    if (!container) return;

    if (!suggestions.length && initialization) {
        suggestions = [
            "Create a New Task",
            "Show Overdue Tasks",
            "Send Overdue Notifications"
        ];
    }

    // Clear old suggestions
    container.innerHTML = "";

    // Create and append buttons
    suggestions.forEach(text => {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.onclick = () => sendMessage(text);
        container.appendChild(btn);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateSuggestions([], true);
});
