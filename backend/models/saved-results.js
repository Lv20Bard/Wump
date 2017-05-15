var mongoose = require('mongoose');

var savedResultsSchema = new mongoose.Schema({
  title: String,
  countMap: mongoose.Schema.Types.Mixed,
  sortedWords: [String],
  timestamp: Date
});

var SavedResults = mongoose.model('SavedResults', savedResultsSchema);

module.exports = {
  savedResultsSchema,
  SavedResults
};