var mongoose = require('mongoose');
var express = require('express');
var http = require('http');
var request = require('request-promise');
var httpStatus = require('http-status-codes');
var bodyParser = require('body-parser');
var natural = require('natural');
var nounInflector = new natural.NounInflector();

var { SavedTweet } = require('./models/saved-tweet');
var { SavedResults } = require('./models/saved-results');
var config = require('./config');
var util = require('./util');
var wump = require('./wump');
var summary = require('./summary');

mongoose.connect('mongodb://localhost/wump');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

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

console.log(summary(
  `
  Donald John Trump (born June 14, 1946) is the 45th and current President of the United States. Before entering politics, he was a businessman and television personality.

Trump was born and raised in Queens, New York City, and earned an economics degree from the Wharton School. He then took charge of The Trump Organization, the real estate and construction firm founded by his paternal grandmother, which he ran for 45 years until 2016. During his real estate career, Trump built, renovated, and managed numerous office towers, hotels, casinos, and golf courses. Besides real estate, he started several side ventures and has licensed the use of his name for the branding of various products and properties. He owned the Miss USA and Miss Universe pageants from 1996 to 2015, and he produced and hosted The Apprentice, a reality television series on NBC, from 2004 to 2015. His net worth was estimated to be $3.5 billion as of 2017, making him the 544th richest person in the world.

Trump first publicly expressed interest in running for political office in 1987. He won two Reform Party presidential primaries in 2000, but withdrew his candidacy early on. In June 2015, he launched his campaign for the 2016 presidential election and quickly emerged as the front-runner among seventeen candidates in the Republican primaries. His remaining opponents suspended their campaigns in May 2016, and in July he was formally nominated at the Republican National Convention along with Indiana governor Mike Pence as his running mate. Many of his campaign statements were controversial or false, generating much free media coverage.
  `,

  2

));



function createTweetString(savedResult) {
  const titleDecoded = decodeURIComponent(savedResult.title);

  let str = titleDecoded;
  str += ': ' + savedResult.sortedWords
    .slice(0, 10)
    .sort((a, b) => {
      return 0.5 - Math.random();
    })
    .slice(0, 4)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('. ') + ' - ';

  const rand = util.getRandomInt(0, 7);

  switch (rand) {
    case 0:
      str += 'SAD!';
      break;
    case 1:
      str += 'Phony hypocrite';

      if (nounInflector.pluralize(titleDecoded) == titleDecoded) {
        str += 's';
      }
      str += '.';
      break;
    case 2:
      str += 'NO!';
      break;
    case 3:
      str += 'This is REAL news!';
      break;
    case 4:
      str += '#FakeNews';
      break;
    case 5:
      str = `We have the best ${nounInflector.singularize(titleDecoded)} of ALL the ${nounInflector.pluralize(titleDecoded)}!`;
      break;
    case 6:
      str = titleDecoded;
      
      if (nounInflector.pluralize(titleDecoded) == titleDecoded) {
        str += ' are ';
      } else {
        str += ' is ';
      }
      
      if (savedResult.adjectives != null) {
        if (savedResult.adjectives.length != 0) {
          const count = Math.min(4, savedResult.adjectives.length);
          for (let i = 0; i < count; i++) {
            str += savedResult.adjectives[i];
            if (i == count - 2) {
              str += ' and ';
            } else if (i != count - 1) {
              str += ', ';
            }
          }
        } else {
          str += 'crude, rude, obnoxious and dumb';
        }
      } else {
        str += 'crude, rude, obnoxious and dumb';
      }

      str += ` - other than that I like ${titleDecoded} very much!`;

      break;
    case 7:
      str += 'What ';
      if (savedResult.nouns != null && savedResult.nouns[0] != null) {
        
        if (nounInflector.pluralize(savedResult.nouns[0]) == savedResult.nouns[0]) {
          str += savedResult.nouns[0].toUpperCase() + '!';
        } else {
          str += 'a ' + savedResult.nouns[0].toUpperCase() + '!';
        }
      } else {
        str += 'a JOKE!';
      }
      break;
  }

  return new SavedTweet({
    tweet: str,
    savedResult: savedResult,
    timestamp: new Date
  }).save().then((savedTweet) => {
    return savedTweet;
  });
}


app.get('/saved/:offset/:amount', (req, res) => {
  SavedTweet.find({})
  .sort({ timestamp: -1 })
  .skip(parseInt(req.params.offset))
  .limit(parseInt(req.params.amount))
  .then((savedTweets) => {
    res.json({
      tweets: savedTweets
    });
  }).catch((err) => {
    console.error('Error finding saved tweets:', err);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: err.message
    });
  });

  /*SavedResults.find({})
  .sort({ timestamp: -1 })
  .skip(parseInt(req.params.offset))
  .limit(parseInt(req.params.amount))
  .then((savedResults) => {
    res.json({
      tweets: savedResults.map(result => ({
        tweet: createTweetString(result),
        timestamp: result.timestamp,
        id: result._id
      }))
    });
  }).catch((err) => {
    console.error('Error finding saved results:', err);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: err.message
    });
  });*/
});

app.get('/search/:q', (req, res) => {
  loadArticle(req.params.q).then((results) => {

    Promise.all(results.map((result) => {
      return createTweetString(result);
    })).then((savedTweets) => {
      savedTweets.forEach((tweet) => {
        io.emit('new wump', tweet);
      });

      res.json({
        tweets: savedTweets
      });
    }).catch((err) => {
      console.error('Error creating tweet strings:', err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: err.message
      });
    });
  }).catch((err) => {
    console.error('Error loading results:', err);
    res.status(httpStatus.BAD_REQUEST).json({
      error: err.message
    });
  });
});

function makeRequest(title) {
  return request(`https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=${title}&redirects`, {
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
        return new SavedResults({
          title: sanitizeTitle(page.title),
          countMap: page.countMap,
          sortedWords: page.sorted,
          adjectives: page.adjectives,
          nouns: page.nouns,
          adverbs: page.adverbs,
          timestamp: new Date
        }).save().then((wump) => {
          return wump;
        });
      }));
    });

  });
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
        // set timestamp to now
        return savedResults.map((result) => {
          result.timestamp = new Date();
          return result;
        });
      } else {
        return makeRequest(titleSanitized);
      }
    });
  } else {
    return makeRequest(titleSanitized);
  }
}

(function (port) {
  console.log(`Listening on port ${port}...`);
  server.listen(port);
})(9001);