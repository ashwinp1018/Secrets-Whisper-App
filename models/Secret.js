const mongoose = require('mongoose');

const secretSchema = new mongoose.Schema({
  content: String,
  userEmail: String
});

module.exports = mongoose.model('Secret', secretSchema);