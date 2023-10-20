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
  },
  journeyStarted: {
      type: Number,
      default: 0
  },
  dropOff: {
      type: Number,
      default: 0
  },
  bounce: {
    type: Number,
    default: 0
  },
  activeInteraction: {
  type: Boolean,
  default: false
  },

});

const TrackingData = mongoose.model('TrackingData', trackingSchema);

const webMapSchema = new mongoose.Schema({
  url: String,
  links: [String]
});
const WebMapData = mongoose.model('WebMapData', webMapSchema);

// API endpoint to receive tracking data
app.post('/api/track', async (req, res) => {
    console.log('Received data:', req.body);
    try {
      const trackingData = new TrackingData(req.body);
      await trackingData.save();

      // Handle activeInteraction event
      if (req.body.eventType === 'activeInteraction') {
        await TrackingData.updateOne({}, { $inc: { activeInteractions: 1 } });
    }
      // Handle journeyStarted and dropOff events
      if (req.body.eventType === 'journeyStarted') {
        await TrackingData.updateOne({}, { $inc: { journeyStarted: 1 } });
    } else if (req.body.eventType === 'dropOff') {
        await TrackingData.updateOne({}, { $inc: { dropOff: 1 } });
    }
      res.status(200).send('Data received and saved');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error saving data: ' + error);
    }
});
// API Endpoint to store web map data
app.post('/api/store-webmap', async (req, res) => {
  console.log('Received web map data:', req.body);
  try {
      const existingData = await WebMapData.findOne({ url: req.body.url });       // Check if data for the URL already exists

      if (existingData) {
          existingData.links = req.body.links;           // Update existing record

          await existingData.save();
      } else {
          const webMapData = new WebMapData(req.body);           // Insert new record

          await webMapData.save();
      }
      res.status(200).send('Web map data received and saved');
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error saving web map data: ' + error);
  }
});

// API endpoint to get drop-off rate
app.get('/api/dropoff-rate', async (req, res) => {
  try {
      const totalJourneyStarted = await TrackingData.aggregate([{ $sum: "$journeyStarted" }]);
      const totalDropOffs = await TrackingData.aggregate([{ $sum: "$dropOff" }]);
      
      const dropOffRate = (totalDropOffs / totalJourneyStarted) * 100;
      
      if (req.body.eventType === 'bounce') {
        await TrackingData.updateOne({}, { $inc: { bounce: 1 } });
    }
      
      res.status(200).json({ dropOffRate: dropOffRate });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error fetching data: ' + error);
  }
});

// modified API endpoint to get web map data for a specific URL
app.get('/api/get-webmap', async (req, res) => {
  const targetUrl = req.query.url;
  try {
      const webMapData = targetUrl ? await WebMapData.find({ url: targetUrl }) : await WebMapData.find();
      res.status(200).json(webMapData);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error fetching web map data: ' + error);
  }
});

/*
// API endpoint to get active interactions count
app.get('/api/active-interactions', async (req, res) => {
    try {
        const totalActiveInteractions = await TrackingData.aggregate([{ $sum: "$activeInteractions" }]);
        res.status(200).json({ totalActiveInteractions: totalActiveInteractions[0].activeInteractions });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error fetching data: ' + error);
    }
});
*/

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
