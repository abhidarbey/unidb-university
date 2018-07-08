const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UniversityProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'university'
  },
  handle: {
    type: String,
    required: true,
    max: 40
  },
  website: {
    type: String
  },
  location: {
    type: String
  },
  schools: {
    type: [String],
    required: true
  },
  courses: [
    {
      degree: {
        type: String,
        required: true
      },
      stream: {
        type: String,
        required: true
      },
      description: {
        type: String
      }
    }
  ],
  social: {
    youtube: {
      type: String
    },
    twitter: {
      type: String
    },
    facebook: {
      type: String
    },
    linkedin: {
      type: String
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = UniversityProfile = mongoose.model('universityProfile', UniversityProfileSchema);
