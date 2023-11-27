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

const WebMapData = mongoose.models.WebMapData || mongoose.model('WebMapData', webMapSchema);

module.exports = WebMapData;