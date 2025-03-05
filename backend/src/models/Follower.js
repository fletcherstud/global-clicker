const mongoose = require('mongoose');

const followerSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
followerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Follower', followerSchema); 