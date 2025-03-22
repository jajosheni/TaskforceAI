import {
    showLoading,
    appendAIMessage,
    appendUserMessage,
    clearInput,
    updateSuggestions
} from "./ui.js";

// Ensure userId is generated and stored
let userId = localStorage.getItem("userId");
if (!userId || userId === "null") {
    userId = null;
}

window.sendMessage = async function (message = null, speak = false) {
    const input = document.getElementById("user-input");
    const userMessage = message || input.value.trim();
    if (!userMessage) return;

    appendUserMessage(userMessage);
    clearInput();
    showLoading(true);

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: userMessage }],
                userId
            })
        });

        const data = await response.json();
        const raw = data.message || "No response from AI.";

        if (data.userId && data.userId !== userId) {
            userId = data.userId;
            localStorage.setItem("userId", userId);
        }

        appendAIMessage(raw);
        showLoading(false);

        // Use suggestions from backend if available
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            updateSuggestions(data.suggestions);
        } else {
            const match = raw.match(/\[SUGGEST:\s*(.*?)\]/);
            const extracted = match ? match[1].split(";").map(s => s.trim()) : [];
            if (extracted.length > 0) updateSuggestions(extracted);
        }
    } catch (error) {
        console.error("Error:", error);
        showLoading(false);
        appendAIMessage("An error occurred while communicating with AI.");
    }
};
