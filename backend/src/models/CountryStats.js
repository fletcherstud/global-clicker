const mongoose = require('mongoose');

const countryStatsSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  pressCount: {
    type: Number,
    default: 0
  },
  lastPressed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const CountryStats = mongoose.model('CountryStats', countryStatsSchema);

module.exports = CountryStats; 