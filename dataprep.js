const mongoose = require('mongoose');
const WebMapData = require('./models/WebMapData'); // Path to your WebMapData model
const TrackingData = require('./models/TrackingData'); // Path to your TrackingData model
const FinalData = require('./models/FinalData'); // Adjust the path according to your project structure


// Connect to MongoDB (replace with your actual connection string)
const mongoDBUri = 'mongodb://localhost:27017/trackingDB';
mongoose.connect(mongoDBUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Function to fetch data from MongoDB
async function fetchWebMapAndTrackingData() {
    try {
      const webMapData = await WebMapData.findOne({ websiteId: 'example.com-username' }).exec();
      const trackingData = await TrackingData.find().exec();
      return { webMapData, trackingData };
    } catch (error) {
      console.error('Error fetching data from MongoDB:', error);
      throw error;
    }
  }

// Function to fetch data from MongoDB
function attachWeightsToWebMap(webMapData, trackingData) {
    const linkVisitorCounts = {};
  
    // Calculate link visitor counts
    trackingData.forEach(userPath => {
        if (userPath.navigationPath && userPath.navigationPath.length > 0) {
            userPath.navigationPath.reduce((prevPage, currentPage) => {
                const linkKey = `${prevPage}->${currentPage}`;
                if (!linkVisitorCounts[linkKey]) {
                    linkVisitorCounts[linkKey] = new Set();
                }
                linkVisitorCounts[linkKey].add(userPath.visitorId);
                return currentPage;
            }, userPath.navigationPath[0]);
        }
    });


    // Log to check the counts for each link
    console.log("Link Visitor Counts:", Object.fromEntries(
        Object.entries(linkVisitorCounts).map(([key, value]) => [key, value.size])
    ));

    // A recursive function to traverse the web map hierarchy and attach weights
    const traverseAndAttachWeights = (node, parentUrl = null) => {
        if (parentUrl) {
            node.parentUrl = parentUrl;
        }

        const linkKey = parentUrl ? `${parentUrl}->${node.url}` : '';
        node.weight = parentUrl && linkVisitorCounts[linkKey] ? linkVisitorCounts[linkKey].size : 0;

        console.log(`Node URL: ${node.url}, Weight: ${node.weight}`);

        if (node.children && node.children.length > 0) {
            node.children.forEach(child => traverseAndAttachWeights(child, node.url));
        }
    };

    // Start the recursive traversal and weight attachment
    traverseAndAttachWeights(webMapData);
    return webMapData;
}


// calculate backtracking or use of back button - how many people are backtracking have width measure to show number

function calculateBacktracking(trackingData) {
    let backtracking = {};
  
    trackingData.forEach(session => {
      // Check the navigation path for backtracking
      for (let i = 1; i < session.navigationPath.length; i++) {
        // Current page is the same as two steps before, indicating a backtrack
        if (i > 1 && session.navigationPath[i] === session.navigationPath[i - 2]) {
          const backtrackKey = `${session.navigationPath[i - 1]}->${session.navigationPath[i]}`;
          if (!backtracking[backtrackKey]) {
            backtracking[backtrackKey] = new Set();
          }
          backtracking[backtrackKey].add(session.visitorId);
        }
      }
    });
  
    // Convert visitor sets to counts
    let backtrackingCounts = {};
    Object.keys(backtracking).forEach(key => {
      backtrackingCounts[key] = backtracking[key].size;
    });
  
    // Now, convert the backtracking counts to a Map and replace dots in keys
    let backtrackingMap = new Map();
    Object.entries(backtrackingCounts).forEach(([key, value]) => {
      let sanitizedKey = key.replace(/\./g, '-'); // Replace dots with dashes
      backtrackingMap.set(sanitizedKey, value);
    });
  
    return backtrackingMap;
  }


async function prepareChartData() {
    const { webMapData, trackingData } = await fetchWebMapAndTrackingData();
  
    const weightedWebMapData = attachWeightsToWebMap(webMapData.toObject(), trackingData);
    const backtrackingData = calculateBacktracking(trackingData);
  
    // Add a check to ensure webMapData and backtrackingData are not undefined
    if (!weightedWebMapData || !backtrackingData) {
      console.error('webMapData or backtrackingData is undefined, cannot save to database.');
      return; // Exit the function if the data is not correct
    }
  
    // Additional check to make sure backtrackingData is in the expected format
    if (!(backtrackingData instanceof Map)) {
      console.error('backtrackingData is not a Map, cannot save to database.');
      return; // Exit the function if the data is not correct
    }
  
    const finalDataObject = {
      webMap: weightedWebMapData,
      backtracking: backtrackingData
    };
  
    try {
      const finalData = new FinalData(finalDataObject);
      await finalData.save();
      console.log('Weighted and backtrack data saved to final_data collection.');
    } catch (error) {
      console.error('Error saving final data:', error);
    }
  }
  prepareChartData()
  .then(() => {
    console.log('Data preparation complete.');
  })
  .catch(console.error);
  
/*
function calculateBacktracking(trackingData) {
    const backtracking = {};
  
    trackingData.forEach(session => {
      // Loop through navigation paths and look for instances where a user navigates back to a previous page
      for (let i = 1; i < session.navigationPath.length; i++) {
        const currentPage = session.navigationPath[i];
        const previousPage = session.navigationPath[i - 1];
  
        // Look for a backtracking event
        if (i > 1 && session.navigationPath[i - 2] === currentPage) {
          // A backtrack to the previousPage occurred
          const backtrackKey = `${currentPage}->${previousPage}`;
  
          if (!backtracking[backtrackKey]) {
            backtracking[backtrackKey] = new Set();
          }
          backtracking[backtrackKey].add(session.visitorId);
        }
      }
    });
  
    // Convert visitor sets to counts
    Object.keys(backtracking).forEach(key => {
      backtracking[key] = backtracking[key].size;
    });
  
    return backtracking;
  }
  

  async function prepareChartData() {
    const { webMapData, trackingData } = await fetchWebMapAndTrackingData();
    const weightedWebMapData = attachWeightsToWebMap(webMapData.toObject(), trackingData);
    const backtrackingData = calculateBacktracking(trackingData);
  
    const finalDataObject = {
      webMap: weightedWebMapData,
      backtracking: backtrackingData
    };
    
  
    const finalData = new FinalData({ data: finalDataObject });
    await finalData.save();
  
    console.log('Weighted and backtrack data saved to final_data collection.');
  
    // Prepare data in the structure required by network_chart.js
    return finalDataObject; // Return the combined object
  }


prepareChartData()
  .then(finalDataObject => {
    
    console.log('Final Data Object:', finalDataObject);
    //await finalData.save();
  })
  .catch(console.error);
  */
 