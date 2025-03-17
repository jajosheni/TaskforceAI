const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { v4: uuidv4 } = require("uuid");

const tools = require("../tools");
const aiFunctions = require("../aiFunctions");

const debugLog = (message, data = null) => {
    if (process.env.DEBUG_LEVEL === "dev") {
        console.log(message, data !== null ? data : "");
    }
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const instructions = `
You are an AI Task Management Assistant. Your role is to analyze overdue tasks, detect potential issues, and suggest recommendations based on task data. Use function calls whenever necessary to fetch the latest task information before responding.
YOU DO NOT REPLY FOR THINGS OUTSIDE THE SCOPE AND YOU TALK ONLY IN ENGLISH.
**How You Should Respond:**
- Be concise but clear: Provide direct answers with actionable steps.
- Use structured formatting: Numbered or bulleted lists for clarity.
- When a general status update is requested, reset memory of specific task conversations.
`;

const chatHistory = {};
const MAX_HISTORY = 10; // Limit history size

router.post("/", async (req, res) => {
    try {
        let { messages, userId } = req.body;

        if (!userId) {
            userId = `guest_${uuidv4()}`;
            debugLog("No userId provided, using generated UUID:", userId);
        }

        debugLog("Incoming message:", messages[messages.length - 1]);

        // Initialize history for user if not present
        if (!chatHistory[userId]) {
            chatHistory[userId] = [];
        }
        chatHistory[userId].push(...messages);
        if (chatHistory[userId].length > MAX_HISTORY) {
            chatHistory[userId] = chatHistory[userId].slice(-MAX_HISTORY);
        }

        // Construct full input with history and system instructions
        let fullMessages = [{ role: "system", content: instructions }, ...chatHistory[userId]];

        // First AI response
        let response = await openai.responses.create({
            model: "gpt-4o",
            input: fullMessages,
            tools,
        });

        let output = response.output;

        // Check for function calls
        let functionCalls = output.filter((item) => item.type === "function_call");

        if (functionCalls.length === 0) {
            debugLog("AI Response:", output);

            const aiMessage = response.output_text || "No response received from AI.";

            debugLog("Sending formatted AI response:", aiMessage);

            // Add AI message to history
            chatHistory[userId].push({ role: "assistant", content: aiMessage });

            return res.json({ message: aiMessage, userId });
        }

        debugLog("Function Calls Detected:", functionCalls);

        let toolOutputs = [];

        for (let funcCall of functionCalls) {
            let { name, arguments, call_id } = funcCall;
            let args = JSON.parse(arguments);

            if (aiFunctions[name]) {
                debugLog(`Executing Function: ${name} with args:`, args);
                let output = await aiFunctions[name](args);
                toolOutputs.push({
                    type: "function_call_output",
                    call_id: call_id,
                    output: JSON.stringify(output),
                });
            } else {
                debugLog(`Unknown function call: ${name}`);
            }
        }

        debugLog("Tool Outputs:", toolOutputs);

        // Submit function results back to OpenAI, keeping instructions & history
        response = await openai.responses.create({
            model: "gpt-4o",
            input: [{ role: "system", content: instructions }, ...chatHistory[userId], ...functionCalls, ...toolOutputs],
            tools,
        });

        debugLog("Full OpenAI Response:", response);

        const aiMessage = response.output_text || "No response received from AI.";

        debugLog("Final AI Response:", aiMessage);

        // Add AI response to history
        chatHistory[userId].push({ role: "assistant", content: aiMessage });

        res.json({ message: aiMessage, userId });
    } catch (error) {
        console.error("Error in chat:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
