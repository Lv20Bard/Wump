var stopword = require('stopword');
var pluralize = require('pluralize');
var natural = require('natural');
var WordPOS = require('wordpos'),
    wordpos = new WordPOS();
var nounInflector = new natural.NounInflector();
var NGrams = natural.NGrams;

var util = require('./util');
var config = require('./config');

module.exports = {
  filterWords(str, cb) {
    cb(str.split(/\s+/g) // split by whitespace
      .map(word => word.replace(/[.,!;":(){}]/g, ' ').trim().toLowerCase()) // trim, and lowercase, remove punctuation
      .filter(word => !word.match(/\d+/))); // remove words with numbers
  },

  parseExtract(wordsFiltered) {
    return Promise.all([
      this.filterAdjectives(wordsFiltered),
      this.filterNouns(wordsFiltered)
    ]).then(([adjectives, nouns]) => {
      return {
        adjectives: adjectives.sort((a, b) => {
          const aIndex = wordsFiltered.indexOf(a);
          const bIndex = wordsFiltered.indexOf(b);
          
          if (aIndex > bIndex) {
            return 1;
          } else if (aIndex < bIndex) {
            return -1;
          } else {
            return 0;
          }
        }),
        nouns: nouns.sort((a, b) => {
          const aIndex = wordsFiltered.indexOf(a);
          const bIndex = wordsFiltered.indexOf(b);

          console.log('wordsFiltered = ', [a, b], [aIndex, bIndex]);

          //console.log('[aIndex, bIndex = ', [aIndex, bIndex]);
          
          if (aIndex > bIndex) {
            return 1;
          } else if (aIndex < bIndex) {
            return -1;
          } else {
            return 0;
          }
        })
      };
    });
  },

  parsePages(pages) {
    return Promise.all(pages.map(({ title, extract }) => {
      return new Promise((resolve, reject) => {
        this.filterWords(title, (titleWords) => {
          this.filterWords(extract, (words) => {
            let wordsFiltered = words.filter((word) => {
              if (typeof titleWords !== 'undefined') {
                // filter words from the title
                for (let i = 0; i < titleWords.length; i++) {
                  if (titleWords[i].includes(word) || word.includes(titleWords[i])) {
                    return false;
                  }
                }
              }

              if (word.length <= 3) {
                return false;
              }

              return true;
            });

            
            const { countMap, sorted } = this.countRecurrances(wordsFiltered, config.MAX_COUNT);

            this.parseExtract(sorted).then((extractParsed) => {
              extractParsed.title = title;
              extractParsed.words = wordsFiltered;
              extractParsed.countMap = countMap;
              extractParsed.sorted = sorted;
              resolve(extractParsed);
            }).catch((err) => {
              reject(err);
            });
          });
          
        });
      });
    }));
  },

  filterAdjectives(wordArray) {
    return new Promise((resolve, reject) => {
      wordpos.getAdjectives(wordArray.join(' '), (result) => {
        resolve(result);
      });
    });
  },

  filterNouns(wordArray) {
    return new Promise((resolve, reject) => {
      wordpos.getNouns(wordArray.join(' '), (result) => {
        resolve(result);
      });
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
      if (plural != word && typeof countMap[plural] !== 'undefined') {
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

    for (let i = Math.min(maxCount, sorted.length) - 1; i >= 0; i--) {
      let a = sorted[i];
      for (let j = Math.min(maxCount, sorted.length) - 1; j >= 0; j--) {
        if (j == i) {
          continue; // skip
        }

        let b = sorted[j];

        if (a.includes(b) || b.includes(a)) {
          if (i > j) {
            // a has higher count than b, so merge into a
            countMap[a] += countMap[b];
            delete countMap[b];
            sorted.splice(j, 1);
          } else {
            // b has higher count than a, so merge into b
            countMap[b] += countMap[a];
            delete countMap[a];
            sorted.splice(i, 1);
          }
        }

      }
    }

    return {
      countMap,
      sorted
    };
  }
};