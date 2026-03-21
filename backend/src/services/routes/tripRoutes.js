const express = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { generateTrip, discoverSpots, saveTrip, getSavedTrips } = require('../../controllers/tripController');

const router = express.Router();

router.post('/generate', generateTrip);
router.post('/discover', discoverSpots);
router.get('/saved', authMiddleware, getSavedTrips);
router.post('/save', authMiddleware, saveTrip);

module.exports = router;
