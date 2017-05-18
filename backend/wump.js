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
    
    cb(stopword.removeStopwords(str.split(/\s+/g) // split by whitespace
      .map(word => word.replace(/[.,!;":(){}]/g, ' ').trim().toLowerCase()) // trim, and lowercase, remove punctuation
      .filter(word => !word.match(/\d+/)))); // remove words with numbers
  },

  getParts(wordsFiltered) {
    return new Promise((resolve, reject) => {
      wordpos.getPOS(wordsFiltered, (result) => {
        resolve(result);
      });
    });
    // return Promise.all([
    //   this.filterAdjectives(wordsFiltered),
    //   this.filterNouns(wordsFiltered),
    //   this.filterAdverbs(wordsFiltered),
    //   this.filterVerbs(wordsFiltered)
    // ]);
  },

  parseParts(wordsFiltered, parts) {
      return {
        adjectives: parts.adjectives.sort((a, b) => {
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
        nouns: parts.nouns.sort((a, b) => {
          const aIndex = wordsFiltered.indexOf(a);
          const bIndex = wordsFiltered.indexOf(b);

          //console.log('[aIndex, bIndex = ', [aIndex, bIndex]);
          
          if (aIndex > bIndex) {
            return 1;
          } else if (aIndex < bIndex) {
            return -1;
          } else {
            return 0;
          }
        }),
        adverbs: parts.adverbs.sort((a, b) => {
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
        verbs: parts.verbs.sort((a, b) => {
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
      };
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

              /*if (word.length <= 3) {
                return false;
              }*/

              return true;
            });

            

            this.getParts(wordsFiltered).then(({ adjectives, nouns, adverbs, verbs }) => {
              const ngrams = NGrams.bigrams(wordsFiltered);

              Promise.all(ngrams.map((ngram) => {
                return new Promise((resolve, reject) => {
                  return Promise.all([
                    new Promise((resolve, reject) => {
                      wordpos.isNoun(ngram[0], (result) => {
                        if (result) {
                          resolve(true);
                        } else {
                          wordpos.isVerb(ngram[0], (result) => {
                            if (result) {
                              resolve(true);
                            } else {
                              resolve(false);
                            }
                          });
                        }
                      })
                    }),

                    new Promise((resolve, reject) => {
                      wordpos.isNoun(ngram[1], (result) => {
                        if (result) {
                          resolve(true);
                        } else {
                          wordpos.isVerb(ngram[1], (result) => {
                            if (result) {
                              resolve(true);
                            } else {
                              resolve(false);
                            }
                          });
                        }
                      })
                    })
                  ]).then(([a,b]) => {
                    resolve(a && b);
                  });
                });
              })).then((filtered) => {
                console.log('filtered = ', filtered);
                const ngramsFiltered = ngrams.filter((el, i) => {
                  return filtered[i] == true;
                });

                const ngrams1d = [].concat.apply([], ngramsFiltered);



                const { countMap, sorted } = this.countRecurrances(wordsFiltered, ngramsFiltered);
                const extractParsed = this.parseParts(sorted, { adjectives, nouns, adverbs, verbs });
                console.log('sorted = ', sorted);

                extractParsed.title = title;
                extractParsed.words = wordsFiltered;
                extractParsed.countMap = countMap;
                extractParsed.sorted = sorted;

                resolve(extractParsed);

              }).catch((err) => {
                console.error('error filtering ngrams:', err);
              });

              // const { countMap, sorted } = this.countRecurrances(wordsFiltered, config.MAX_COUNT);
              // const extractParsed = this.parseParts(sorted, { adjectives, nouns, adverbs, verbs });
              // console.log('sorted = ', sorted);
              
              /*console.log('bigrams = ', NGrams.bigrams(wordsFiltered).sort((a, b) => {
                let aIndex = wordsFiltered.indexOf(a);
                let bIndex = wordsFiltered.indexOf(b);

                if (aIndex > bIndex) {
                  return 1;
                } else if (aIndex < bIndex) {
                  return -1;
                } else {
                  return 0;
                }
              }));*/



              // extractParsed.title = title;
              // extractParsed.words = wordsFiltered;
              // extractParsed.countMap = countMap;
              // extractParsed.sorted = sorted;

              // resolve(extractParsed);
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
      wordpos.getAdjectives(wordArray, (result) => {
        resolve(result);
      });
    });
  },

  filterNouns(wordArray) {
    return new Promise((resolve, reject) => {
      wordpos.getNouns(wordArray, (result) => {
        resolve(result);
      });
    });
  },

  filterVerbs(wordArray) {
    return new Promise((resolve, reject) => {
      wordpos.getVerbs(wordArray, (result) => {
        resolve(result);
      });
    });
  },

  filterAdverbs(wordArray) {
    return new Promise((resolve, reject) => {
      wordpos.getAdverbs(wordArray, (result) => {
        resolve(result);
      });
    });
  },

  countRecurrances(wordArray, ngrams) {
    const top = {};
    const countMap = {};

    const allParts = wordArray.concat(ngrams.map((el) => el.join(' ')));
    for (let i = 0; i < allParts.length; i++) {
      const word = allParts[i];
      if (countMap[word] !== undefined) {
        countMap[word]++;
      } else {
        countMap[word] = 1;
      }
    }

    console.log('ngrams = ', ngrams);

    for (let i = 0; i < wordArray.length; i++) {
      const word = wordArray[i];
      for (let j = 0; j < ngrams.length; j++) {
        const ngram = ngrams[j];
        if (ngram.includes(word)) {
          //if (countMap[ngram] >= countMap[word]) {
            delete countMap[word];
          //}
        }
      }
    }

    /*for (let word in countMap) {
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
    }*/

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

    // for (let i = Math.min(maxCount, sorted.length) - 1; i >= 0; i--) {
    //   let a = sorted[i];
    //   for (let j = Math.min(maxCount, sorted.length) - 1; j >= 0; j--) {
    //     if (j == i) {
    //       continue; // skip
    //     }

    //     let b = sorted[j];

    //     if (a.includes(b) || b.includes(a)) {
    //       if (i > j) {
    //         // a has higher count than b, so merge into a
    //         countMap[a] += countMap[b];
    //         delete countMap[b];
    //         sorted.splice(j, 1);
    //       } else {
    //         // b has higher count than a, so merge into b
    //         countMap[b] += countMap[a];
    //         delete countMap[a];
    //         sorted.splice(i, 1);
    //       }
    //     }

    //   }
    // }

    return {
      countMap,
      sorted
    };
  }
};