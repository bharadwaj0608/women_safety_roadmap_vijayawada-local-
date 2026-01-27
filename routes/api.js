const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const RoadRating = require('../models/RoadRating');

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'API is running' });
});

// Get all items
router.get('/items', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch items', message: error.message });
    }
});

// Create a new item
router.post('/items', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }

        const newItem = new Item({ name, description });
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create item', message: error.message });
    }
});

// ===== ROAD RATING ENDPOINTS =====

// Get all road ratings with aggregated statistics
router.get('/road-ratings', async (req, res) => {
    try {
        const ratings = await RoadRating.find().sort({ timestamp: -1 });

        // Group ratings by roadId and calculate aggregates
        const aggregates = {};

        ratings.forEach(rating => {
            if (!aggregates[rating.roadId]) {
                aggregates[rating.roadId] = {
                    roadId: rating.roadId,
                    roadName: rating.roadName,
                    ratings: [],
                    totalReviews: 0,
                    averageRating: 0
                };
            }

            aggregates[rating.roadId].ratings.push({
                rating: rating.rating,
                comments: rating.comments,
                timestamp: rating.timestamp
            });
            aggregates[rating.roadId].totalReviews++;
        });

        // Calculate averages
        Object.values(aggregates).forEach(agg => {
            const sum = agg.ratings.reduce((acc, r) => acc + r.rating, 0);
            agg.averageRating = sum / agg.totalReviews;
        });

        res.json({
            success: true,
            data: aggregates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch road ratings',
            message: error.message
        });
    }
});

// Get ratings for a specific road
router.get('/road-ratings/:roadId', async (req, res) => {
    try {
        const { roadId } = req.params;
        const ratings = await RoadRating.find({ roadId }).sort({ timestamp: -1 });

        if (ratings.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: 'No ratings found for this road'
            });
        }

        // Calculate average
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / ratings.length;

        res.json({
            success: true,
            data: {
                roadId: roadId,
                roadName: ratings[0].roadName,
                totalReviews: ratings.length,
                averageRating: average,
                ratings: ratings
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch road ratings',
            message: error.message
        });
    }
});

// Save a new road rating
router.post('/road-ratings', async (req, res) => {
    try {
        const { roadId, roadName, rating, dayRating, nightRating, hasStreetLights, hasPopulationDensity, hasCCTV, comments } = req.body;

        // Validation
        if (!roadId || !rating) {
            return res.status(400).json({
                success: false,
                error: 'roadId and rating are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        // Get user IP (optional)
        const userIp = req.ip || req.connection.remoteAddress;

        // Create new rating
        const newRating = new RoadRating({
            roadId,
            roadName: roadName || 'Unnamed Road',
            rating,
            dayRating: dayRating || null,
            nightRating: nightRating || null,
            hasStreetLights: hasStreetLights !== undefined ? hasStreetLights : null,
            hasPopulationDensity: hasPopulationDensity !== undefined ? hasPopulationDensity : null,
            hasCCTV: hasCCTV !== undefined ? hasCCTV : null,
            comments: comments || '',
            userIp
        });

        const savedRating = await newRating.save();

        res.status(201).json({
            success: true,
            data: savedRating,
            message: 'Rating saved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to save rating',
            message: error.message
        });
    }
});

module.exports = router;
