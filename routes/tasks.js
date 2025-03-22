const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const filePath = path.join(__dirname, '../data/tasks.json');

// Helpers
const readTasks = () => {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
};

const writeTasks = (tasks) => {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), 'utf8');
};

const getNextTaskID = (tasks) => {
    return tasks.length === 0 ? 1 : Math.max(...tasks.map(task => task.TaskID)) + 1;
};

// Required fields for task creation
const requiredFields = [
    "AssignedUserID",
    "TaskName",
    "DueDate",
    "Category",
    "Color",
    "ApproverUserID",
    "Comment",
    "RecommendedUserID",
    "Status",
    "TotalStoryPoints",
    "PriorityID"
];

// GET all tasks
router.get('/', (req, res) => {
    const tasks = readTasks();
    res.json(tasks);
});

// POST create task
router.post('/', (req, res) => {
    const body = req.body;

    // Validate all required fields are present and not null
    const missingFields = requiredFields.filter(
        field => body[field] === null || body[field] === undefined
    );

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

    const tasks = readTasks();
    const newTask = { TaskID: getNextTaskID(tasks), ...body };
    tasks.push(newTask);
    writeTasks(tasks);
    res.json(newTask);
});

// PUT update task
router.put('/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const updateData = req.body;

    const tasks = readTasks();
    const taskIndex = tasks.findIndex(t => t.TaskID === taskId);
    if (taskIndex === -1) return res.status(404).json({ error: "Task not found" });

    // Only apply defined fields (skip null or undefined)
    for (let key in updateData) {
        if (updateData[key] !== null && updateData[key] !== undefined) {
            tasks[taskIndex][key] = updateData[key];
        }
    }

    writeTasks(tasks);
    res.json(tasks[taskIndex]);
});

// DELETE task
router.delete('/:id', (req, res) => {
    let tasks = readTasks();
    tasks = tasks.filter(t => t.TaskID != req.params.id);
    writeTasks(tasks);
    res.json({ message: "Task deleted" });
});

module.exports = router;
