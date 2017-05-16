var mongoose = require('mongoose');
var express = require('express');
var http = require('http');
var request = require('request-promise');
var httpStatus = require('http-status-codes');
var bodyParser = require('body-parser');
var natural = require('natural');
var nounInflector = new natural.NounInflector();

var { SavedResults } = require('./models/saved-results');
var config = require('./config');
var util = require('./util');
var wump = require('./wump');
var summary = require('./summary');

mongoose.connect('mongodb://localhost/wump');

const app = express();
const server = http.createServer(app);

const TEMPLATE_TWEETS = [
  'Relish the opp to be an outsider. Embrace that label- b/c it’s the outsiders who change the world, and who make a real & lasting difference! China just agreed that the U.S. will be allowed to sell beef, and other major products, into China once again. This is REAL news!',
  'I have been asking Director Comey & others, from the beginning of my administration, to find the LEAKERS in the intelligence community.....',
  'General Flynn was given the highest security clearance by the Obama Administration - but the Fake News seldom likes talking about that.'
];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.CLIENT_SERVER_URL);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,x-access-token');
  
  if (req.method == 'OPTIONS') {
    res.send(httpStatus.OK);
  } else {
    next();
  }
});

app.get('/search/:q', (req, res) => {
  loadArticle(req.params.q).then((results) => {
    res.json({ results });

    // fill in with tweet data
    /*Promise.all(results.map((el, i) => {
      const tweet = TEMPLATE_TWEETS[Math.min(TEMPLATE_TWEETS.length - 1), i];

      // split tweet by whitespace
      const tweetSplit = tweet.split(/\s+/g)
        .map(word => word.replace(/[.,!;":(){}]/g, ' '))
        .filter((str) => {
          return str != '';
        });
      
      return wump.parseExtract(tweetSplit).then((tweetParsed) => {
        return { tweet, tweetParsed };
      });
    })).then((tweetData) => {
      
      const tweetsSubstituted = results.map((result, i) => {
        let tweetDataAt = tweetData[i];

        if (result.adjectives.length != 0) {
          // replace adjectives
          tweetDataAt.tweetParsed.adjectives.forEach((adj, adjI) => {
            // replace in tweet
              tweetDataAt.tweet = tweetDataAt.tweet.replace(
                adj,
                result.adjectives[adjI % result.adjectives.length]
              );
          });
        }

        if (result.nouns.length != 0) {
          // replace nouns
          tweetDataAt.tweetParsed.nouns.forEach((noun, nounI) => {
            // replace in tweet
            tweetDataAt.tweet = tweetDataAt.tweet.replace(
              noun,
              result.nouns[nounI % result.nouns.length]
            );
          });
        }

        return tweetDataAt;
      });

      console.log('tweetsSubstituted = ', tweetsSubstituted);

      
      results.forEach((result) => {

        for (let i = 0; i < Math.min(result.adjectives.length, result.nouns.length); i++) {
          const rand = util.getRandomInt(0, 2);

          switch (rand) {
            case 0:
              console.log(`${nounInflector.pluralize(result.nouns[i])}.`);
              break;
            case 1:
              console.log(`${result.adjectives[i]} ${result.nouns[i]}.`);
              break;
            case 2:
              console.log(`${result.adjectives[i].toUpperCase()}!!!`);
              break;
            
          }
          
        }

        
      })

      res.json({ results });
    }).catch((err) => {
      console.error('Error parsing tweets:', err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: err.message
      });
    });*/
  }).catch((err) => {
    console.error('Error loading results:', err);
    res.status(httpStatus.BAD_REQUEST).json({
      error: err.message
    });
  });
});

function makeRequest(title) {
  console.log('making request');
  return request(`https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=${title}`, {
    method: 'GET'
  }).then((res) => {
    const bodyJson = JSON.parse(res);
    const pages = Object.keys(bodyJson.query.pages).map((key) => {
      const page = bodyJson.query.pages[key];
      return {
        title: page.title,
        extract: page.extract
      };
    });

    return wump.parsePages(pages).then((parsed) => {
      return Promise.all(parsed.map((page) => {
        const { countMap, sorted } = wump.countRecurrances(page.words, config.MAX_COUNT);

        return new SavedResults({
          title: sanitizeTitle(page.title),
          countMap: countMap,
          sortedWords: sorted,
          adjectives: page.adjectives,
          nouns: page.nouns,
          timestamp: new Date
        }).save();
      }));
    });

  });/*, function (err, res, body) {
    if (err) {
      console.error('Error:', err);
    } else {
      const bodyJson = JSON.parse(body);
      const pages = Object.keys(bodyJson.query.pages).map((key) => {
        const page = bodyJson.query.pages[key];
        return {
          title: page.title,
          extract: page.extract
        };
      });

      const parsed = wump.parsePages(pages);
      const recurrances = parsed.map((page) => {
        const { countMap, sorted } = wump.countRecurrances(page.words);

        new SavedResults({
          title: page.title,
          countMap: countMap,
          sortedWords: sorted,
          timestamp: new Date
        }).then((savedResults) => {
          
        })
      });
      
    }
  });*/
}

function sanitizeTitle(title) {
  return encodeURIComponent(
    title.split(/\s+/g)
      .filter(s => s != '')
      .map((s) => {
        const lower = s.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(' ')
  );
}

function loadArticle(title) {
  const titleSanitized = sanitizeTitle(title);

  if (config.USE_SAVED_SEARCHES) {
    return SavedResults.find({
      title: new RegExp(titleSanitized, 'i')
    }).then((savedResults) => {
      if (savedResults != null && savedResults.length > 0) {
        return savedResults;
      } else {
        return makeRequest(titleSanitized);
      }
    });
  } else {
    return makeRequest(titleSanitized);
  }
}

/*request('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=Stack%20Overflow', {
  method: 'GET'
}, function (err, res, body) {
  if (err) {
    console.error('Error:', err);
  } else {
    const bodyJson = JSON.parse(body);
    const pages = Object.keys(bodyJson.query.pages).map((key) => {
      const page = bodyJson.query.pages[key];
      return {
        title: page.title,
        extract: page.extract
      };
    });

    const parsed = wump.parsePages(pages);
    const recurrances = parsed.map((page) => {
      return wump.countRecurrances(page.words);
    });
    console.log(recurrances);
  }
});*/

(function (port) {
  console.log(`Listening on port ${port}...`);
  server.listen(port);
})(9001);