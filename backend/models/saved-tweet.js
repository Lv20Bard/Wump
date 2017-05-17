var mongoose = require('mongoose');

var savedTweetSchema = new mongoose.Schema({
  tweet: String,
  savedResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavedResults'
  },
  timestamp: Date
});

var SavedTweet = mongoose.model('SavedTweet', savedTweetSchema);

module.exports = {
  savedTweetSchema,
  SavedTweet
};