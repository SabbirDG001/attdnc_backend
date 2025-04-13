const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  session: { 
    type: String, 
    required: true 
  },
  data: [{ 
    date: String, 
    topic: String 
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Class', classSchema);