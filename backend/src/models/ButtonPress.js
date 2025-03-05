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
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  pressedAt: {
    type: Date,
    default: Date.now
  },
  clientId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient querying
buttonPressSchema.index({ country: 1, pressedAt: -1 });
buttonPressSchema.index({ location: '2dsphere' });

const ButtonPress = mongoose.model('ButtonPress', buttonPressSchema);

module.exports = ButtonPress; 