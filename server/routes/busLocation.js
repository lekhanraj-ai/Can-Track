import express from 'express';
import BusLocation from '../models/BusLocation.js';
import User from '../models/User.js';

const router = express.Router();

// Update bus location (for coordinators)
router.post('/update', async (req, res) => {
    try {
        const { busNumber, latitude, longitude, speed, coordinatorPhone } = req.body;

        if (!busNumber || !latitude || !longitude || !coordinatorPhone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify if the coordinator is authorized for this bus
        const coordinator = await User.findOne({ 
            phone: coordinatorPhone,
            role: 'coordinator',
            busNumber: busNumber
        });

        if (!coordinator) {
            return res.status(403).json({ error: 'Unauthorized coordinator' });
        }

        // Update or create location entry
        const location = await BusLocation.findOneAndUpdate(
            { busNumber },
            {
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude] // GeoJSON format
                },
                speed: speed || 0,
                timestamp: new Date(),
                isActive: true,
                updatedBy: coordinatorPhone
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, location });
    } catch (error) {
        console.error('Error updating bus location:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get bus location (for students)
router.get('/:busNumber', async (req, res) => {
    try {
        const { busNumber } = req.params;
        const location = await BusLocation.findOne({ 
            busNumber,
            isActive: true,
            timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Only return locations updated in last 5 minutes
        });

        if (!location) {
            return res.status(404).json({ error: 'Bus location not found or outdated' });
        }

        res.json({
            busNumber: location.busNumber,
            latitude: location.location.coordinates[1],
            longitude: location.location.coordinates[0],
            speed: location.speed,
            lastUpdated: location.timestamp
        });
    } catch (error) {
        console.error('Error fetching bus location:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Set bus active/inactive status (for coordinators)
router.post('/status', async (req, res) => {
    try {
        const { busNumber, isActive, coordinatorPhone } = req.body;

        // Verify coordinator
        const coordinator = await User.findOne({ 
            phone: coordinatorPhone,
            role: 'coordinator',
            busNumber: busNumber
        });

        if (!coordinator) {
            return res.status(403).json({ error: 'Unauthorized coordinator' });
        }

        await BusLocation.findOneAndUpdate(
            { busNumber },
            { isActive },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating bus status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;