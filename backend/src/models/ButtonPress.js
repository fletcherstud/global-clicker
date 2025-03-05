const mongoose = require('mongoose');

const buttonPressSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  pressedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create compound index for efficient querying
buttonPressSchema.index({ country: 1, pressedAt: -1 });

const ButtonPress = mongoose.model('ButtonPress', buttonPressSchema);

module.exports = ButtonPress; 