const axios = require("axios");

module.exports = {
    createTask: async ({newAssignee, newTaskName, newDueDate, newCategory, newColor}) => {
        try {
            let newData = {
                AssignedUserID: newAssignee,
                TaskName: newTaskName,
                DueDate: newDueDate,
                Category: newCategory,
                Color: newColor,
            };

            const response = await axios.post(`http://127.0.0.1:3000/tasks`, newData);
            return {success: true, data: response.data};
        } catch (error) {
            console.error("Error creating task:", error.response?.data || error.message);
            return {success: false, error: "Failed to create task"};
        }
    },

    updateTask: async ({taskId, newAssignee, newTaskName, newDueDate, newCategory, newColor}) => {
        try {
            let updateData = {};
            if (newAssignee) updateData.AssignedUserID = newAssignee;
            if (newTaskName) updateData.TaskName = newTaskName;
            if (newDueDate) updateData.DueDate = newDueDate;
            if (newCategory) updateData.Category = newCategory;
            if (newColor) updateData.Color = newColor;

            if (Object.keys(updateData).length === 0) {
                return {success: false, message: "No valid update fields provided."};
            }

            const response = await axios.put(`http://127.0.0.1:3000/tasks/${taskId}`, updateData);
            return {success: true, data: response.data};
        } catch (error) {
            console.error("Error updating task:", error.response?.data || error.message);
            return {success: false, error: "Failed to update task"};
        }
    },

    detectOverdueTasks: async () => {
        try {
            const response = await axios.get("http://127.0.0.1:3000/tasks");
            const tasks = response.data;
            const overdueTasks = tasks.filter(task => new Date(task.DueDate) < new Date());
            return {success: true, data: overdueTasks};
        } catch (error) {
            console.error("Error fetching tasks:", error.message);
            return {success: false, error: "Failed to retrieve tasks"};
        }
    },

    performRootCauseAnalysis: async () => {
        return {success: true, data: ["Overloaded assignees", "Unresolved dependencies", "Lack of updates"]};
    },

    generatePredictiveAlerts: async () => {
        return {
            success: true,
            data: ["Task X is nearing deadline without updates", "Task Y has a history of delays"]
        };
    },

    generateRecommendations: async () => {
        return {success: true, data: ["Reassign to a less busy team member", "Send automatic reminders"]};
    },

    generateWeeklyReport: async () => {
        try {
            const response = await axios.get("http://127.0.0.1:3000/tasks");
            const tasks = response.data;
            const overdueCount = tasks.filter(task => new Date(task.DueDate) < new Date()).length;
            return {success: true, data: `Weekly summary: ${overdueCount} tasks are overdue.`};
        } catch (error) {
            console.error("Error generating report:", error.message);
            return {success: false, error: "Failed to generate report"};
        }
    },

    sendNotification: async ({recipient, message, priority}) => {
        console.log(`🔔 Notification sent to ${recipient}: "${message}" (Priority: ${priority})`);
        return {success: true, data: `I have notified ${recipient} about: "${message}"`};
    }
};
