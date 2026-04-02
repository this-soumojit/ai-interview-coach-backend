require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB        = require('./config/db');
const authRoutes       = require('./routes/auth.routes');
const uploadRoutes     = require('./routes/upload.routes');
const sessionRoutes    = require('./routes/session.routes');
const interviewRoutes  = require('./routes/interview.routes');
const reportRoutes     = require('./routes/report.routes');
const errorHandler     = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload',  uploadRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/session', interviewRoutes);
app.use('/api/session', reportRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
