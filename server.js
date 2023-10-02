const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://db:27017/trackingDB', { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  if (err) {
    console.error('Error connecting to MongoDB:', err);
  } else {
    console.log('Connected to MongoDB');
  }
});

// Middleware to parse JSON
app.use(express.json());

// Define a Mongoose schema and model for tracking data
const trackingSchema = new mongoose.Schema({
    eventType: String,
    x: Number,
    y: Number,
    clickCount: Number,
    scrollDepth: Number,
    scrollDirection: String,
    currentPage: String,
    timeSpentOnPage: Number,
    newVisitor: Boolean,
    activeUsers: Number,
    taskSuccessRate: Number,
    timeOnTask: Number,
    searchUsage: Number,
    navigationUsage: Number,
    userErrorRate: Number,
    taskLevelSatisfaction: Number,
    testLevelSatisfaction: Number,
    productAccess: Number,
    avgTimeSpent: Number,
    featureAdoptionRate: Number,
    heatmapData: Object,  // New field to store heatmap data
    timestamp: {
      type: Date,
      default: Date.now
    }
});

const TrackingData = mongoose.model('TrackingData', trackingSchema);

// API endpoint to receive tracking data
app.post('/api/track', async (req, res) => {
    console.log('Received data:', req.body);
    try {
      const trackingData = new TrackingData(req.body);
      await trackingData.save();
      res.status(200).send('Data received and saved');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error saving data: ' + error);
    }
});

app.use(express.static('public'));

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Add this code to your server.js file
app.get('/', (req, res) => {
    res.send('Backend server is running');
});


