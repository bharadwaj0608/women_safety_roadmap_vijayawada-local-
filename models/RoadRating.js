const mongoose = require('mongoose');

const roadRatingSchema = new mongoose.Schema({
    roadId: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    roadName: {
        type: String,
        default: 'Unnamed Road',
        trim: true
    },
    // Separate day and night ratings
    dayRating: {
        type: Number,
        min: 1,
        max: 5
    },
    nightRating: {
        type: Number,
        min: 1,
        max: 5
    },
    // Overall rating (average of day and night, or single rating)
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    // Yes/No questions
    hasStreetLights: {
        type: Boolean,
        default: null
    },
    hasPopulationDensity: {
        type: Boolean,
        default: null
    },
    hasCCTV: {
        type: Boolean,
        default: null
    },
    comments: {
        type: String,
        trim: true,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    userIp: {
        type: String,
        trim: true
    }
});

// Index for faster queries
roadRatingSchema.index({ roadId: 1, timestamp: -1 });

module.exports = mongoose.model('RoadRating', roadRatingSchema);
