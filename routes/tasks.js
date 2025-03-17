const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const filePath = path.join(__dirname, '../data/tasks.json');

// Function to read tasks from file
const readTasks = () => {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
};

// Function to write tasks to file
const writeTasks = (tasks) => {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), 'utf8');
};

// Function to get the next TaskID
const getNextTaskID = (tasks) => {
    return tasks.length === 0 ? 1 : Math.max(...tasks.map(task => task.TaskID)) + 1;
};

// GET all tasks
router.get('/', (req, res) => {
    const tasks = readTasks();
    res.json(tasks);
});

// POST - Create a new task
router.post('/', (req, res) => {
    const tasks = readTasks();
    const newTask = { TaskID: getNextTaskID(tasks), ...req.body };
    tasks.push(newTask);
    writeTasks(tasks);
    res.json(newTask);
});

// PUT - Update a task
router.put('/:id', (req, res) => {
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(t => t.TaskID == req.params.id);
    if (taskIndex === -1) return res.status(404).json({ error: "Task not found" });
    tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
    writeTasks(tasks);
    res.json(tasks[taskIndex]);
});

// DELETE - Remove a task
router.delete('/:id', (req, res) => {
    let tasks = readTasks();
    tasks = tasks.filter(t => t.TaskID != req.params.id);
    writeTasks(tasks);
    res.json({ message: "Task deleted" });
});

// Function to call Python API for analysis
const analyzeTasks = async (tasks) => {
    try {
        const response = await axios.post('http://127.0.0.1:8000/analyze', tasks, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('Error calling Python API:', error);
        return { error: 'Failed to analyze tasks' };
    }
};

// Route: Analyze Tasks
router.post('/analyze', async (req, res) => {
    const tasks = readTasks();
    if (tasks.length === 0) return res.json({ message: "No tasks available to analyze." });
    const analysis = await analyzeTasks(tasks);
    res.json(analysis);
});

// Route: Generate Weekly Report (Dummy for now)
router.get('/report', (req, res) => {
    res.json({
        message: "Weekly report feature coming soon",
        timestamp: new Date()
    });
});

module.exports = router;
