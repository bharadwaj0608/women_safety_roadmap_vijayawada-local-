const mongoose = require('mongoose');

const roadAlertSchema = new mongoose.Schema({
    roadId: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    alertType: {
        type: String,
        required: true,
        enum: ['harassment', 'poor_lighting', 'accident', 'construction', 'other'],
        default: 'other'
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true // Indexed for sorting and querying by time
    },
    userIp: {
        type: String,
        trim: true
    }
});

// Index for efficient queries of recent alerts for a specific road
roadAlertSchema.index({ roadId: 1, timestamp: -1 });

module.exports = mongoose.model('RoadAlert', roadAlertSchema);
