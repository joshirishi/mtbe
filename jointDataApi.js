// jointDataApi.js

const WebMapData = require('./models/WebMapData'); // Update the path to your WebMapData model
const TrackingData = require('./models/TrackingData'); // Update the path to your TrackingData model

// Function to calculate metrics for a web node
function calculateMetrics(trackingData) {
    // Total number of users (assuming each trackingData entry represents a user session)
    const totalUsers = trackingData.length;

    // Unique User Movements: Calculated from navigation paths
    const uniqueMovements = trackingData.filter(data => data.navigationPath && data.navigationPath.length > 1).length;

    // Drop-Off Rate: Based on page exit events
    const dropOffRate = trackingData.filter(data => data.eventType === 'page-exit').length / totalUsers * 100;

    // Average Time Spent: Average of 'timeSpentOnPage' values
    const averageTimeSpent = trackingData.reduce((acc, data) => acc + (data.timeSpentOnPage || 0), 0) / totalUsers;

    // Bounce Rate: Based on a bounce value of 1 or 0
    const bounceRate = trackingData.filter(data => data.bounce === 1).length / totalUsers * 100;

    // Page Value (Page Rank): Combination of users visited, time spent, and other factors
    const pageValue = calculatePageValue(trackingData, totalUsers);

    return { uniqueMovements, dropOffRate, averageTimeSpent, bounceRate, pageValue };
}

function calculatePageValue(trackingData, totalUsers) {
    // Example calculation, adjust based on your specific criteria for page value
    const pageVisits = trackingData.length;
    const totalPageTime = trackingData.reduce((acc, data) => acc + (data.timeSpentOnPage || 0), 0);

    return (pageVisits / totalUsers) * (totalPageTime / totalUsers);
}

// Function to extract navigation paths from tracking data
function extractNavigationPaths(trackingData) {
    let navigationPaths = [];
    trackingData.forEach(data => {
        if (data.navigationPath && Array.isArray(data.navigationPath)) {
            navigationPaths.push(data.navigationPath);
        }
    });
    return navigationPaths;
}

// Setup function for joint data API
function setupJointDataApi(app) {
    app.get('/api/combined-data', async (req, res) => {
        try {
            const webMapData = await WebMapData.find({}); // Fetch web map data
            const trackingData = await TrackingData.find({}); // Fetch tracking data

            // Calculate metrics and extract navigation paths
            const metrics = calculateMetrics(trackingData);
            const navigationPaths = extractNavigationPaths(trackingData);

            // Combine data
            const combinedData = {
                webMap: webMapData,
                userMetrics: metrics,
                navigationPaths: navigationPaths
            };

            res.json(combinedData);
        } catch (error) {
            console.error('Error fetching combined data:', error);
            res.status(500).send('Error processing request');
        }
    });
}

module.exports = setupJointDataApi;
