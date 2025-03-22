const axios = require("axios");
const https = require("https");

const {formatTaskPreview, formatPayload} = require("../utils");

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});
const ML_SERVER = process.env.ML_SERVER;
const tasksEndpoint = "http://127.0.0.1:3000/tasks";

module.exports = {
    getAllTasks: async () => {
        try {
            const response = await axios.get("http://127.0.0.1:3000/tasks");
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Error fetching tasks:", error.message);
            return { success: false, error: "Could not retrieve task list." };
        }
    },

    createTask: async (params) => {
        const message =
            `📝 You're about to create a task with the following details:\n\n${formatTaskPreview(params)}\n\n✅ Say "Confirm" to proceed or "Cancel" to discard.`;

        return {
            success: true,
            pending: true,
            message,
            action: "confirmCreateTask",
            args: params
        };
    },

    confirmCreateTask: async (args) => {
        try {
            const response = await axios.post(tasksEndpoint, formatPayload(args));
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Create Task Error:", error.message);
            return { success: false, error: "Failed to create task" };
        }
    },

    updateTask: async (params) => {
        const { taskId, ...fields } = params;

        let changes = Object.entries(fields).map(([key, val]) =>
            `- **${key}**: \`${val}\``
        ).join("\n");

        const message =
            `🛠️ You're about to update Task #${taskId} with:\n\n${changes}\n\n✅ Say "Confirm" to proceed or "Cancel" to discard.`;

        return {
            success: true,
            pending: true,
            message,
            action: "confirmUpdateTask",
            args: params
        };
    },

    confirmUpdateTask: async (args) => {
        const { taskId, ...updateData } = args;
        try {
            const response = await axios.put(`${tasksEndpoint}/${taskId}`, formatPayload(updateData));
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update Task Error:", error.message);
            return { success: false, error: "Failed to update task" };
        }
    },

    requestDeleteTask: async ({ taskId }) => {
        return {
            success: true,
            data: `⚠️ You requested to delete Task ${taskId}. Please confirm by saying: "Confirm delete task ${taskId}".`
        };
    },

    confirmDeleteTask: async ({ taskId }) => {
        try {
            const response = await axios.delete(`${tasksEndpoint}/${taskId}`);
            return {
                success: true,
                data: `✅ Task ${taskId} was successfully deleted.`
            };
        } catch (err) {
            console.error("Delete Error:", err.message);
            return { success: false, error: "Failed to delete the task." };
        }
    },

    sendNotification: async ({recipient, message, priority}) => {
        console.log(`🔔 Notification sent to ${recipient}: "${message}" (Priority: ${priority})`);
        return {success: true, data: `I have notified ${recipient} about: "${message}"`};
    },


    detectOverdueTasks: async () => {
        try {
            const response = await axios.get(ML_SERVER + "/api/Predicate/lateness/all", {
                httpsAgent
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("ML API Error:", error.message);
            return { success: false, error: "Failed to fetch ML lateness prediction" };
        }
    },

    performRootCauseAnalysis: async () => {
        try {
            const response = await axios.get(`${ML_SERVER}/api/Predicate/tasks/info`, { httpsAgent });
            const summary = response.data;

            const findings = [];

            if (summary.ReassignedTasksRatio > 0.3) findings.push("High reassignment rate suggests confusion or mismanagement.");
            if (summary.AverageCommentLength < 20) findings.push("Short comments suggest lack of detail in communication.");
            if (summary.OverduePercentage > 0.25) findings.push("A significant portion of tasks are overdue.");

            return {
                success: true,
                data: findings.length ? findings : ["No major root causes detected from metadata."]
            };
        } catch (err) {
            console.error("Root Cause Analysis Error:", err.message);
            return { success: false, error: "Failed to perform root cause analysis" };
        }
    },

    generatePredictiveAlerts: async () => {
        try {
            const response = await axios.get(`${ML_SERVER}/api/Predicate/lateness/all`, {
                httpsAgent
            });

            const predictions = response.data.data;

            const riskyTasks = predictions.filter(p => p.probability >= 50);

            return {
                success: true,
                data: riskyTasks.map(p => ({
                    taskId: p.taskID,
                    taskName: p.taskName,
                    dueDate: p.dueDate,
                    risk: `${p.probability.toFixed(1)}%`
                }))
            };
        } catch (error) {
            console.error("Predictive Alerts Error:", error.message);
            return { success: false, error: "Failed to generate predictive alerts" };
        }
    },

    generateRecommendations: async ({ taskId }) => {
        try {
            const response = await axios.get(`${ML_SERVER}/api/Predicate/recommend/${taskId}`, { httpsAgent });
            const rec = response.data;

            return {
                success: true,
                data: [
                    `Recommended assignee: User ${rec.RecommendedUserID}`,
                    `Confidence: ${Math.round(rec.Confidence * 100)}%`
                ]
            };
        } catch (err) {
            console.error("Recommendation Error:", err.message);
            return { success: false, error: "Could not fetch recommendation for task." };
        }
    },

    getLatenessPrediction: async ({ taskId }) => {
        try {
            const response = await axios.get(`${ML_SERVER}/api/Predicate/lateness/${taskId}`, {
                httpsAgent
            });

            const { isLate, probability } = response.data.data;

            return {
                success: true,
                data: {
                    taskId,
                    isLate,
                    probability: `${probability.toFixed(2)}%`
                }
            };
        } catch (err) {
            console.error("Lateness Prediction Error:", err.message);
            return { success: false, error: "Failed to fetch lateness prediction." };
        }
    },

    getReassignmentSuggestion: async ({ taskId }) => {
        try {
            const response = await axios.get(`${ML_SERVER}/api/Predicate/reassignment/${taskId}`, {
                httpsAgent
            });

            const suggestedUserId = response.data?.data;

            return {
                success: true,
                data: `Suggested user to reassign Task ${taskId}: User ${suggestedUserId}`
            };
        } catch (error) {
            console.error("Reassignment Suggestion Error:", error.message);
            return { success: false, error: "Could not fetch reassignment suggestion." };
        }
    },

    trainModel: async () => {
        try {
            await axios.post(`${ML_SERVER}/api/Predicate/train`, {}, { httpsAgent });
            return { success: true, data: "Model training started successfully." };
        } catch (err) {
            console.error("Train Error:", err.message);
            return { success: false, error: "Failed to trigger model training." };
        }
    }
};
