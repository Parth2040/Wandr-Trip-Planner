const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
    center: {
      lat: Number,
      lon: Number,
    },
    interests: [String],
    days: Number,
    itinerary: [
      {
        day: Number,
        places: [
          {
            id: String,
            name: String,
            category: String,
            lat: Number,
            lon: Number,
            distanceKm: Number,
            rating: Number,
            userRatingsTotal: Number,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
