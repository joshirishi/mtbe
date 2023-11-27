const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
    eventType: String,
    location: {
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
    os: String,
    deviceType: String,
    origin: String,
    windowSize: {
        width: Number,
        height: Number
    },
    maxScrollDepth: Number,
    confusedScrolling: Boolean,
    timestamp: Date,
    journeyStarted: Number,
    dropOff: Number,
    bounce: Number,
    activeInteraction: Boolean,
});

const TrackingData = mongoose.models.TrackingData || mongoose.model('TrackingData', trackingSchema);

module.exports = TrackingData;
