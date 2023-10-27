const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const path = require('path');

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
    location :{
      domain: String,
      page: String,
    },
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
    heatmapData: Object,
    navigationPath: [String],
    dropOffPage: String,
    visitorToken: String,
    os: String,                  // New field to track OS
    deviceType: String,          // New field to track device type
    origin: String,              // New field to track origin
    windowSize: Object,          // New field to track window size
    maxScrollDepth: Number,      // New field to track maximum scroll depth
    confusedScrolling: Boolean,  // New field to track "confused" scrolling
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

app.get('/api/visitors', async (req, res) => {
  console.log('Visitor Data requested');
  try{
    const uniqueVisitorCount = await TrackingData.count({eventType:'new-visitor'});
    const bounceCount = await TrackingData.count({eventType:'bounce'});
    const visitorCount = await TrackingData.count({eventType:'visitor'});
    res.status(200).send({
      uniqueVisitorCount: uniqueVisitorCount,
      bounceRate: (bounceCount/visitorCount)*100,
      visitorCount: visitorCount
    });
  }catch (error){
    console.error('Error:', error);
    res.status(500).send('Error retreiving data: ' + error);
  }
});

app.get('/api/heatmap', async (req, res) => {
  console.log('Visitor Data requested');
  try{
    const response = await TrackingData.find({
      $and: [
         { "location.domain" : { $eq: "localhost" } },
         {"heatmapData": { $exists: true }}
    ]});
    res.status(200).send(response);
  } catch (error){
    console.error('Error:', error);
    res.status(500).send('Error retreiving data: ' + error);
  }
});

app.use(express.static('public'));

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('Backend server is running');
});

