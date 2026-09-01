const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

require('./utils/cornJobs');

const connectToDatabase = require('./config/db');
const session = require('./config/session');
const hostelroutes = require('./routes/index');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(express.json());
app.use(session);

// Connect to MongoDB
connectToDatabase();

app.use((req, res, next) => {
    console.log("Hits:", req.originalUrl);
    
    next();
});

app.get('/', (req, res) => {
    res.send("Welcome to the Node.js MongoDB API!");
});
app.use('/api',  hostelroutes);

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});