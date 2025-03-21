module.exports = [
    {
        type: "function",
        name: "createTask",
        description: "Create a task with full details including assignee, name, due date, category, color, approver, comment, recommendation, status, story points, and priority.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                newAssignee: { type: "number", description: "User ID assigned to the task." },
                newTaskName: { type: "string", description: "The name of the task." },
                newDueDate: { type: "string", description: "Due date in ISO format (YYYY-MM-DD)." },
                newCategory: {
                    type: "string",
                    description: "Task category.",
                    enum: ["Development", "Product", "Testing", "QA", "Support", "Documentation"]
                },
                newColor: { type: "string", description: "Hex color code for task (e.g., #FF5733)." },
                approverId: { type: "number", description: "User ID of the task approver." },
                comment: { type: "string", description: "Comment or note for the task." },
                recommendedUserId: { type: "number", description: "Suggested user ID for reassignment." },
                status: {
                    type: "string",
                    description: "Task status.",
                    enum: ["To Do", "In Progress", "Review", "Completed"]
                },
                storyPoints: { type: "number", description: "Total story points assigned to the task." },
                priorityId: { type: "number", description: "Priority level (e.g., 1 to 5)." }
            },
            additionalProperties: false,
            required: [
                "newAssignee",
                "newTaskName",
                "newDueDate",
                "newCategory",
                "newColor",
                "approverId",
                "comment",
                "recommendedUserId",
                "status",
                "storyPoints",
                "priorityId"
            ]
        }
    },
    {
        type: "function",
        name: "updateTask",
        description: "Update a task's full detail fields such as assignee, name, due date, category, etc.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                taskId: { type: "number", description: "ID of the task to update." },
                newAssignee: { type: ["number", "null"], description: "New assignee user ID." },
                newTaskName: { type: ["string", "null"], description: "Updated task name." },
                newDueDate: { type: ["string", "null"], description: "Updated due date (YYYY-MM-DD)." },
                newCategory: {
                    type: ["string", "null"],
                    description: "Updated task category.",
                    enum: ["Development", "Product", "Testing", "QA", "Support", "Documentation"]
                },
                newColor: { type: ["string", "null"], description: "Updated hex color (e.g., #FF5733)." },
                approverId: { type: ["number", "null"], description: "Updated approver user ID." },
                comment: { type: ["string", "null"], description: "Updated task comment." },
                recommendedUserId: { type: ["number", "null"], description: "Updated recommended user ID." },
                status: {
                    type: ["string", "null"],
                    description: "Updated status.",
                    enum: ["To Do", "In Progress", "Review", "Completed"]
                },
                storyPoints: { type: ["number", "null"], description: "Updated story points." },
                priorityId: { type: ["number", "null"], description: "Updated priority ID." }
            },
            additionalProperties: false,
            required: ["taskId", "newAssignee", "newTaskName", "newDueDate", "newCategory", "newColor", "approverId", "comment", "recommendedUserId", "status", "storyPoints", "priorityId"]
        }
    },
    {
        type: "function",
        name: "detectOverdueTasks",
        description: "Get a list of tasks predicted to be late by the ML model.",
        strict: true,
        parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
            required: []
        }
    },
    {
        type: "function",
        name: "sendNotification",
        description: "Send a notification to a user about an overdue task, alert, or recommendation.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                recipient: {
                    type: "string",
                    description: "The name or ID of the user receiving the notification."
                },
                message: {
                    type: "string",
                    description: "The content of the notification message."
                },
                priority: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "The priority level of the notification."
                }
            },
            additionalProperties: false,
            required: ["recipient", "message", "priority"]
        }
    },
    {
        type: "function",
        name: "performRootCauseAnalysis",
        description: "Analyze task patterns and user metadata to identify likely causes of delay.",
        strict: true,
        parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
            required: []
        }
    },
    {
        type: "function",
        name: "generatePredictiveAlerts",
        description: "Predict tasks that are at risk of becoming overdue or misassigned.",
        strict: true,
        parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
            required: []
        }
    },
    {
        type: "function",
        name: "generateRecommendations",
        description: "Get action recommendations such as reassignments or follow-ups.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                taskId: {
                    type: "number",
                    description: "The ID of the task to generate recommendations for."
                }
            },
            additionalProperties: false,
            required: ["taskId"]
        }
    },
    {
        type: "function",
        name: "getLatenessPrediction",
        description: "Get a lateness prediction for a specific task.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                taskId: {
                    type: "number",
                    description: "ID of the task to check for lateness prediction."
                }
            },
            required: ["taskId"],
            additionalProperties: false
        }
    },
    {
        type: "function",
        name: "getReassignmentSuggestion",
        description: "Suggest a new user to reassign a given task to based on ML prediction.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                taskId: {
                    type: "number",
                    description: "The ID of the task to analyze."
                }
            },
            additionalProperties: false,
            required: ["taskId"]
        }
    },
    {
        type: "function",
        name: "trainModel",
        description: "Trigger training of the ML model on current task dataset.",
        strict: true,
        parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
            required: []
        }
    }
];
