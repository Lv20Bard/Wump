var mongoose = require('mongoose');
var express = require('express');
var http = require('http');
var request = require('request-promise');
var httpStatus = require('http-status-codes');
var bodyParser = require('body-parser');

var { SavedResults } = require('./models/saved-results');
var config = require('./config');
var wump = require('./wump');

mongoose.connect('mongodb://localhost/wump');

const app = express();
const server = http.createServer(app);

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
  loadArticle(req.params.p).then((results) => {
    res.json({ results });
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

    const parsed = wump.parsePages(pages);

    return Promise.all(parsed.map((page) => {
      const { countMap, sorted } = wump.countRecurrances(page.words, config.MAX_COUNT);

      return new SavedResults({
        title: sanitizeTitle(page.title),
        countMap: countMap,
        sortedWords: sorted,
        timestamp: new Date
      }).save();
    }));

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