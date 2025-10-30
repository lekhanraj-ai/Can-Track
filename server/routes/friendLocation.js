import express from 'express';
import fs from 'fs/promises';

const router = express.Router();

// Dev-only route: return mock friend location data from server/mock/friendLocations.json
// NOTE: This is intended for local development/testing. Replace with a DB-backed implementation for production.
router.get('/:id/location', async (req, res) => {
  try {
    const fileUrl = new URL('../mock/friendLocations.json', import.meta.url);
    const raw = await fs.readFile(fileUrl, 'utf8');
    const data = JSON.parse(raw);
    const id = String(req.params.id);

    if (!data[id]) {
      return res.status(404).json({ error: 'Friend location not found' });
    }

    return res.json(data[id]);
  } catch (err) {
    console.error('Error reading friendLocations.json', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Dev-only route: accept POST updates to update the mock friendLocations.json file
// Example payload: { "latitude": 12.97, "longitude": 77.59, "lastUpdated": "...", "note": "..." }
router.post('/:id/location', async (req, res) => {
  try {
    const id = String(req.params.id);
    const { latitude, longitude, lastUpdated, speed, note } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude and longitude must be numbers' });
    }

    const fileUrl = new URL('../mock/friendLocations.json', import.meta.url);
    const raw = await fs.readFile(fileUrl, 'utf8');
    const data = JSON.parse(raw || '{}');

    data[id] = {
      latitude,
      longitude,
      lastUpdated: lastUpdated || new Date().toISOString(),
      speed: typeof speed === 'number' ? speed : 0,
      note: note || 'Updated via POST'
    };

    await fs.writeFile(fileUrl, JSON.stringify(data, null, 2), 'utf8');

    return res.json({ success: true, location: data[id] });
  } catch (err) {
    console.error('Error writing friendLocations.json', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
