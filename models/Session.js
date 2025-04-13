const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  data: [{ 
    date: String, 
    topic: String 
  }],
  students: [{
    studentId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    status: {
      type: Number, // 0 = present, 3 = absent
      default: 0
    }
  }]
});

module.exports = mongoose.model('Session', sessionSchema);