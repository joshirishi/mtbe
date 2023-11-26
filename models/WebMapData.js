const mongoose = require('mongoose');

const webMapSchema = new mongoose.Schema({
    websiteId: String,
    name: String,
    url: String,
    children: [{
        websiteId: String,
        name: String,
        url: String,
        children: Array // This structure allows for nested arrays representing deeper levels of hierarchy
    }]
});

module.exports = mongoose.model('WebMapData', webMapSchema);
