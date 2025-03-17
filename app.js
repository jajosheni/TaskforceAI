// app.js
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

// Set EJS as the templating engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve static files from the /public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const indexRouter = require('./routes/index');
const tasksRouter = require('./routes/tasks');
const chatRouter = require('./routes/chat');
const voiceRouter = require('./routes/voice');

app.use('/', indexRouter);
app.use('/tasks', tasksRouter);
app.use('/chat', chatRouter);
app.use('/voice', voiceRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    res.status(404).render('error', {message: 'Page Not Found', error: {}});
});

// Error handler
app.use((err, req, res, next) => {
    // Provide error details only in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error', {message: err.message, error: err});
});

module.exports = app;
