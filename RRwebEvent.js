const mongoose = require('mongoose');

const rrwebEventSchema = new mongoose.Schema({
  data: Object, // Store the rrweb event data
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const RRWebEvent = mongoose.model('RRWebEvent', rrwebEventSchema);

module.exports = RRWebEvent;
