const express = require('express');
const body_parser = require('body-parser');
const client_sessions = require('client-sessions');
const express_fileupload = require('express-fileupload');
const cors = require('cors');
const GetRouter = require('./routers/get-router');
const PostRouter = require('./routers/post-router');
const PutRouter = require('./routers/put-router');
const DeleteRouter = require('./routers/delete-router');
/** Setup */
const app = express();
const port = process.env.PORT || 4000;
require('dotenv').config()
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(client_sessions({
  cookieName: 'session',
  secret: 'secretkey',
  duration: 2 * 30 * 60 * 1000,
  activeDuration: 2 * 5 * 60 * 1000,
  cookie: {
	  httpOnly: false,
	  secure: false,
	  ephemeral: false
  }
}));
app.use(express_fileupload({ safeFileNames: true, preserveExtension: true }));
// setup cors policy
const whitelist_domains = [
  // dev origin(s)
  'http://localhost:3000',
  // prod origin(s)
  'http://haboclient.herokuapp.com',
  'https://haboclient.herokuapp.com',
];
const corsOptions = {
  // https://expressjs.com/en/resources/middleware/cors.html
  origin: function (origin, callback) {
    const originIsAllowed = whitelist_domains.includes(origin);
    console.log({
      origin,
      callback,
      originIsAllowed,
    });
    if (originIsAllowed) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.options('*', cors(corsOptions));
// Mount Routers On Main Express App
app.use('/', cors(corsOptions), GetRouter);
app.use('/', cors(corsOptions), PostRouter);
app.use('/', cors(corsOptions), PutRouter);
app.use('/', cors(corsOptions), DeleteRouter);
/**
 * 
 */
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});