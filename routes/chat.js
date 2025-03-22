const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const {v4: uuidv4} = require("uuid");

const tools = require("../tools");
const aiFunctions = require("../aiFunctions");
const {extractSuggestions, parseAIResponse} = require("../utils");

const debugLog = (message, data = null) => {
    if (process.env.DEBUG_LEVEL === "dev") {
        console.log(message, data !== null ? data : "");
    }
};

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const instructions = `
You are an AI Task Management Assistant. Your role is to analyze overdue tasks, detect potential issues, and suggest recommendations based on task data. Use function calls whenever necessary to fetch the latest task information before responding.
YOU DO NOT REPLY FOR THINGS OUTSIDE THE SCOPE AND YOU TALK ONLY IN ENGLISH.
DO NOT SUGGEST DATA THAT YOU DO NOT HAVE.

Current date: ${new Date().toISOString().split("T")[0]}

**How You Should Respond:**
- Be concise but clear: Provide direct answers with actionable steps.
- Use structured formatting: Numbered or bulleted lists for clarity.
- When a general status update is requested, reset memory of specific task conversations.
- Always provide taskId when available as data.
- At the end of every response, add 1–3 user suggestion options as predictions as what the user might want to do in this format:
[SUGGEST: option 1; option 2]
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

        let input = [{ role: "system", content: instructions }, ...chatHistory[userId]];
        let finalMessage = "";
        let suggestions = [];

        const MAX_ITERATIONS = 5;
        let iterationCount = 0;

        while (true) {
            if (iterationCount++ >= MAX_ITERATIONS) {
                throw new Error("Too many recursive tool calls. Aborting to prevent infinite loop.");
            }

            let response = await openai.responses.create({
                model: "gpt-4o",
                input,
                tools,
            });

            let output = response.output;
            let functionCalls = output.filter((item) => item.type === "function_call");

            if (functionCalls.length === 0) {
                const parsed = parseAIResponse(response);
                finalMessage = parsed.aiMessage;
                suggestions = parsed.suggestions;
                chatHistory[userId].push({ role: "assistant", content: finalMessage });
                break;
            }

            debugLog("Function Calls Detected:", functionCalls);

            let toolOutputs = [];

            for (let funcCall of functionCalls) {
                const { name, arguments, call_id } = funcCall;
                let args = JSON.parse(arguments);

                if (aiFunctions[name]) {
                    debugLog(`Executing Function: ${name} with args:`, args);
                    let output = await aiFunctions[name](args);
                    toolOutputs.push({
                        type: "function_call_output",
                        call_id,
                        output: JSON.stringify(output),
                    });
                } else {
                    debugLog(`Unknown function call: ${name}`);
                }
            }

            debugLog("Tool Outputs:", toolOutputs);

            input = [
                { role: "system", content: instructions },
                ...chatHistory[userId],
                ...functionCalls,
                ...toolOutputs,
            ];
        }

        debugLog("Final AI Response:", finalMessage);
        return res.json({ message: finalMessage, userId, suggestions });

    } catch (error) {
        console.error("Error in chat:", error);
        return res.status(500).json({ error: error.message });
    }
});


module.exports = router;
