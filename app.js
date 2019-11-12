const express = require('express');
const body_parser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const client_sessions = require('client-sessions');
const express_fileupload = require('express-fileupload');
const models = require('./models');
const { fn, col, Op } = require('sequelize');
const cloudinary_manager = require('./cloudinary_manager');

const GetRouter = require('./routers/get-router');
const PostRouter = require('./routers/post-router');
const PutRouter = require('./routers/put-router');
const DeleteRouter = require('./routers/delete-router');


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


// Mount Routers On Main Express App
app.use('/', GetRouter);
app.use('/', PostRouter);
app.use('/', PutRouter);
app.use('/', DeleteRouter);


/**
 * 
 */

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
