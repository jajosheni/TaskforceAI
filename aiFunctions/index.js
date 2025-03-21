const axios = require("axios");
const https = require("https");

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});
const ML_SERVER = process.env.ML_SERVER;
const tasksEndpoint = "http://127.0.0.1:3000/tasks";

module.exports = {
    createTask: async ({
                           newAssignee, newTaskName, newDueDate, newCategory, newColor,
                           approverId, comment, recommendedUserId, status, storyPoints, priorityId
                       }) => {
        try {
            let newData = {
                AssignedUserID: newAssignee,
                TaskName: newTaskName,
                DueDate: newDueDate,
                Category: newCategory,
                Color: newColor,
                ApproverUserID: approverId,
                Comment: comment,
                RecommendedUserID: recommendedUserId,
                Status: status,
                TotalStoryPoints: storyPoints,
                PriorityID: priorityId
            };

            const response = await axios.post(tasksEndpoint, newData);
            return {success: true, data: response.data};
        } catch (error) {
            console.error("Error creating task:", error.response?.data || error.message);
            return {success: false, error: "Failed to create task"};
        }
    },

    updateTask: async ({
                           taskId, newAssignee, newTaskName, newDueDate, newCategory, newColor,
                           approverId, comment, recommendedUserId, status, storyPoints, priorityId
                       }) => {
        try {
            let updateData = {};
            if (newAssignee) updateData.AssignedUserID = newAssignee;
            if (newTaskName) updateData.TaskName = newTaskName;
            if (newDueDate) updateData.DueDate = newDueDate;
            if (newCategory) updateData.Category = newCategory;
            if (newColor) updateData.Color = newColor;
            if (approverId) updateData.ApproverUserID = approverId;
            if (comment) updateData.Comment = comment;
            if (recommendedUserId) updateData.RecommendedUserID = recommendedUserId;
            if (status) updateData.Status = status;
            if (storyPoints !== undefined) updateData.TotalStoryPoints = storyPoints;
            if (priorityId) updateData.PriorityID = priorityId;

            if (Object.keys(updateData).length === 0) {
                return {success: false, message: "No valid update fields provided."};
            }

            const response = await axios.put(`${tasksEndpoint}/${taskId}`, updateData);
            return {success: true, data: response.data};
        } catch (error) {
            console.error("Error updating task:", error.response?.data || error.message);
            return {success: false, error: "Failed to update task"};
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
