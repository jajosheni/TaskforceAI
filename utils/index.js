const extractSuggestions = (rawText) => {
    const regex = /\[SUGGEST:\s*([\s\S]*?)\]/i;
    const match = rawText.match(regex);
    let cleanedText = rawText;
    let suggestions = [];

    if (match) {
        suggestions = match[1].split(";").map(s => s.trim()).filter(Boolean);
        cleanedText = rawText.replace(match[0], '').trim();
    }

    return { cleanedText, suggestions };
};

const parseAIResponse = (response) => {
    if (!response.output_text) {
        console.error("No output_text in response", response);
        return { aiMessage: "No response received from AI.", suggestions: [] };
    }

    const { cleanedText, suggestions } = extractSuggestions(response.output_text);
    return { aiMessage: cleanedText, suggestions };
};

module.exports = {
    formatTaskPreview: (task) => {
        return Object.entries(task)
            .map(([k, v]) => `- **${k}**: \`${v}\``)
            .join("\n");
    },
    formatPayload: (obj) => {
        const map = {
            newAssignee: "AssignedUserID",
            newTaskName: "TaskName",
            newDueDate: "DueDate",
            newCategory: "Category",
            newColor: "Color",
            approverId: "ApproverUserID",
            comment: "Comment",
            recommendedUserId: "RecommendedUserID",
            status: "Status",
            storyPoints: "TotalStoryPoints",
            priorityId: "PriorityID"
        };
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
            result[map[k] || k] = v;
        }
        return result;
    },
    extractSuggestions,
    parseAIResponse
};
