var stopword = require('stopword');
var pluralize = require('pluralize');
var natural = require('natural');
var nounInflector = new natural.NounInflector();

var config = require('./config');

module.exports = {
  filterWords(str) {
    return str.split(/\s+/g) // split by whitespace
      .map(word => word.replace(/[.,!;'":(){}]/g, ' ').trim().toLowerCase()) // trim, and lowercase, remove punctuation
      .filter(word => !word.match(/^\d+$/)); // remove numbers
  },

  parsePages(pages) {
    return pages.map(({ title, extract }) => {
      const titleWords = this.filterWords(title);
      let words = stopword.removeStopwords(this.filterWords(extract));
      // filter words from the title
      words = words.filter((word) => {
        return titleWords.indexOf(word) == -1;
      });

      return { title, words };
    });
  },

  countRecurrances(wordArray, maxCount) {
    const top = {};
    const countMap = {};

    for (let i = 0; i < wordArray.length; i++) {
      const word = wordArray[i];
      if (countMap[word] !== undefined) {
        countMap[word]++;
      } else {
        countMap[word] = 1;
      }
    }

    for (let word in countMap) {
      const plural = nounInflector.pluralize(word);
      if (plural != word && countMap[plural] !== undefined) {
        // sum up counts
        if (countMap[plural] >= countMap[word]) {
          countMap[plural] += countMap[word];
          delete countMap[word];
        } else {
          countMap[word] += countMap[plural];
          delete countMap[plural];
        }
      }
    }

    const sorted = Object.keys(countMap).sort((a, b) => {
      if (countMap[a] == countMap[b]) {
        return 0;
      }
      if (countMap[a] > countMap[b]) {
        return -1;
      } else {
        return 1;
      }
    });

    // compare the top items to check if they are too similar
    /*for (let i = 0; i < Math.min(maxCount, sorted.length); i++) {
      let a = sorted[i];
      for (let j = 0; j < Math.min(maxCount, sorted.length); j++) {
        let b = sorted[j];
        if (natural.LevenshteinDistance(a, b) >= config.STRING_DISTANCE_THRESHOLD) {
        }
      }
    }*/

    return {
      countMap,
      sorted
    };
  }
};