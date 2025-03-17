module.exports = [
    {
        type: "function",
        name: "createTask",
        description: "Create a task with details such as assignee, name, due date, category and color.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                newAssignee: {
                    type: "number",
                    description: "The new user ID to assign the task to."
                },
                newTaskName: {
                    type: "string",
                    description: "The new name of the task."
                },
                newDueDate: {
                    type: "string",
                    description: "The new due date of the task in ISO 8601 format (YYYY-MM-DD)."
                },
                newCategory: {
                    type: "string",
                    description: "The new category for the task.",
                    enum: [
                        "DevOps",
                        "Marketing",
                        "QA",
                        "Management",
                        "DevOps",
                        "Management",
                        "QA",
                        "Development",
                        "DevOps",
                        "Management",
                        "Development",
                        "Management",
                        "Design",
                        "Development",
                        "Development",
                        "DevOps",
                        "Marketing",
                        "DevOps",
                        "Development"
                    ],
                },
                newColor: {
                    type: "string",
                    description: "The new color code for the task in hex format (e.g., #FF5733)."
                }
            },
            additionalProperties: false,
            required: ["newAssignee", "newTaskName", "newDueDate", "newCategory", "newColor"]
        }
    },
    {
        type: "function",
        name: "updateTask",
        description: "Update a task's details such as assignee, name, due date, category, or color.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                taskId: {
                    type: "number",
                    description: "The ID of the task to be updated."
                },
                newAssignee: {
                    type: ["number", "null"],
                    description: "The new user ID to assign the task to."
                },
                newTaskName: {
                    type: ["string", "null"],
                    description: "The new name of the task."
                },
                newDueDate: {
                    type: ["string", "null"],
                    description: "The new due date of the task in ISO 8601 format (YYYY-MM-DD)."
                },
                newCategory: {
                    type: ["string", "null"],
                    description: "The new category for the task.",
                    enum: [
                        "DevOps",
                        "Marketing",
                        "QA",
                        "Management",
                        "DevOps",
                        "Management",
                        "QA",
                        "Development",
                        "DevOps",
                        "Management",
                        "Development",
                        "Management",
                        "Design",
                        "Development",
                        "Development",
                        "DevOps",
                        "Marketing",
                        "DevOps",
                        "Development"
                    ],
                },
                newColor: {
                    type: ["string", "null"],
                    description: "The new color code for the task in hex format (e.g., #FF5733)."
                }
            },
            additionalProperties: false,
            required: ["taskId", "newAssignee", "newTaskName", "newDueDate", "newCategory", "newColor"]
        }
    },
    {
        type: "function",
        name: "detectOverdueTasks",
        description: "Identify overdue tasks by comparing due dates with the current date.",
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
        name: "performRootCauseAnalysis",
        description: "Analyze metadata to identify common causes for task delays.",
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
        description: "Predict which tasks are at risk of becoming overdue.",
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
        description: "Suggest actions for overdue or at-risk tasks.",
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
        name: "generateWeeklyReport",
        description: "Provide a summary of overdue tasks and patterns.",
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
    }
];
