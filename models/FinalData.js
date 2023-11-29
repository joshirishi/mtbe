const mongoose = require('mongoose');

// Schema for FinalData
const FinalDataSchema = new mongoose.Schema({
  // Storing the entire web map with weights
  webMap: {
    type: mongoose.Schema.Types.Mixed, // Mixed type because the structure can be complex and varied
    required: true
  },
  // Storing backtracking data
  backtracking: {
    type: Map, // A Map object where keys are string and values are the counts
    of: Number,
    required: true
  }
});

// Create the model from the schema and export it
const FinalData = mongoose.model('FinalData', FinalDataSchema);

module.exports = FinalData;
