const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');
const { exec } = require('child_process');

const app = express();

// Middleware Setup
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON
app.use(express.static('public')); // Serve static files from the 'public' directory

// MongoDB Connection
mongoose.connect('mongodb://db:27017/trackingDB', { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        console.error('Error connecting to MongoDB:', err);
    } else {
        console.log('Connected to MongoDB');
    }
});

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



// Schema for hierarchical data
const linkSchema = new mongoose.Schema({
  name: String,
  children: [this]
});

const WebMapData = mongoose.model('WebMapData', linkSchema);



// Create a new HTTP server for WebSocket
const wsServer = http.createServer((req, res) => {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const wss = new WebSocket.Server({ server: wsServer });

// WebSocket setup
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Override console.log to send logs to the frontend
  const originalConsoleLog = console.log;
  console.log = function(message) {
      originalConsoleLog.apply(console, arguments);
      ws.send(message);
  };
});

// Start the WebSocket server on a different port
const WS_PORT = 8001;
wsServer.listen(WS_PORT, () => {
  console.log(`WebSocket Server running on port ${WS_PORT}`);
});

//API endpoints

// API endpoint to trigger the scraper

app.get('/api/trigger-scraper', (req, res) => {

  const urlToScrape = req.query.url || 'https://maitridesigns.com'; // Use the provided URL or default to 'https://maitridesigns.com'
  // Immediately respond to the frontend
  res.status(202).json({ message: 'Scraper started. Processing in the background.' });

  // Run the scraper in the background with the provided URL
    exec(`node /app/webmap/src/index.js ${urlToScrape}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            // Handle error (e.g., store in a log, notify admin, etc.)
            return;
        }
        console.log('Scraper executed successfully.');
        // Store results or notify frontend if necessary
    });
});



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
      const existingData = await WebMapData.findOne({ name: req.body.name });  // Check if data for the URL already exists

      if (existingData) {
          existingData.children = req.body.children;  // Update existing record
          await existingData.save();
      } else {
          const webMapData = new WebMapData(req.body);  // Insert new record
          await webMapData.save();
      }
      res.status(200).send('Web map data received and saved');
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error saving web map data: ' + error);
  }
});

// API endpoint to get web map data for a specific URL
app.get('/api/get-webmap', async (req, res) => {
  const targetName = req.query.name;  // Using name instead of URL
  try {
      const webMapData = targetName ? await WebMapData.findOne({ name: targetName }) : await WebMapData.find();
      res.status(200).json(webMapData);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error fetching web map data: ' + error);
  }
});

/*
app.get('/api/get-webmap-by-title', async (req, res) => {
  const targetTitle = req.query.title;
  try {
      const webMapData = targetTitle ? await WebMapData.find({ title: targetTitle }) : await WebMapData.find();
      res.status(200).json(webMapData);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error fetching web map data by title: ' + error);
  }
});
*/

app.delete('/api/delete-webmap', async (req, res) => {
  const targetUrl = req.query.url;
  try {
      await WebMapData.deleteOne({ url: targetUrl });
      res.status(200).send('Web map data deleted successfully');
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error deleting web map data: ' + error);
  }
});


// API endpoint to get drop-off rate
app.get('/api/dropoff-rate', async (req, res) => {
  try {
    const totalJourneyStarted = await TrackingData.aggregate([
        { $group: { _id: null, total: { $sum: "$journeyStarted" } } }
      ]);
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

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


