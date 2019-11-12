const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const express_fileupload = require('express-fileupload');
const models = require('../models');
const { fn, col, Op } = require('sequelize');
const cloudinary_manager = require('../cloudinary_manager');

const PostRouter = express.Router();


PostRouter.post('/sign_up', async (request, response) => {
  const data = request.body;

  if (!data.username) {
    return response.status(400).json({
      error: true,
      message: 'Username is missing/invalid.'
    });
  }
  if (!data.email) {
    return response.status(400).json({
      error: true,
      message: 'Email is missing/invalid.'
    });
  }
  if (!data.password) {
    return response.status(400).json({
      error: true,
      message: 'Password is missing/invalid.'
    });
  }
  if (!data.confirmPassword) {
    return response.status(400).json({
      error: true,
      message: 'Confirm password is missing/invalid.'
    });
  }
  if (data.password !== data.confirmPassword) {
    return response.status(400).json({
      error: true,
      message: 'Passowrds does not match.'
    });
  }

  const check_username = await models.User.findOne({ where: { username: data.username } });
  if (check_username) {
    return response.status(400).json({
      error: true,
      message: 'Username is taken.'
    });
  }

  const check_email = await models.User.findOne({ where: { email: data.email } });
  if (check_email) {
    return response.status(400).json({
      error: true,
      message: 'Email is already in use.'
    });
  }

  const hash = bcrypt.hashSync(data.password);
  const new_user = await models.User.create({
    username: data.username,
    email: data.email,
    password: hash,
  });

  let user = new_user.dataValues;
  
  request.session.id = Date.now();
  request.session.youModel = new_user;
  request.session.you = { ...new_user.dataValues };
  delete user.password;

  return response.status(200).json({
    user,
    session_id: request.session.id,
    message: 'Signed up successfully'
  });
});

PostRouter.post('/users/:id/create-review', async (request, response) => {
  const data = request.body;
  const you = request.session.you;
  const user_id = parseInt(request.params.id, 10);
  const you_id = parseInt(you.id, 10);

  if (you_id === user_id) {
    return response.status(400).json({
      error: true,
      message: 'request invalid: users cannot write a review on themselves'
    });
  }
  if (!data.title) {
    return response.status(400).json({
      error: true,
      message: 'title is missing/invalid'
    });
  }
  if (!data.summary) {
    return response.status(400).json({
      error: true,
      message: 'summary is missing/invalid'
    });
  }
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    return response.status(400).json({
      error: true,
      message: 'rating is missing/invalid. must be a number between 1 - 5.'
    });
  }


  const createObj = {
    user_id: user_id,
    writer_id: you_id,
    rating: data.rating,
    title: data.title,
    summary: data.summary,
  };

  const new_review = await models.UserReview.create(createObj);

  const { id, displayname, username, icon_link, verified } = you;
  const new_review_data = {
    ...new_review.dataValues,
    writer: { id, displayname, username, icon_link, verified },
  };

  return response.status(200).json({
    review: new_review_data,
    message: 'review created successfully'
  });
});

PostRouter.post('/users/:user_id/request-loan', async (request, response) => {
  const data = request.body;
  const you = request.session.you;
  const user_id = parseInt(request.params.user_id, 10);
  const you_id = parseInt(you.id, 10);

  if (you_id === user_id) {
    return response.status(400).json({
      error: true,
      message: 'request invalid: users cannot request a loan from themselves'
    });
  }

  const userModel = await models.User.findOne({ where: { id: user_id } });
  if (data.amount < 1 || data.amount > userModel.dataValues.available_balance) {
    return response.status(400).json({
      error: true,
      message: 'amount is eithermissing/invalid or above the user\'s available balance.'
    });
  }
  if (!data.expected_payoff_date) {
    return response.status(400).json({
      error: true,
      message: 'expected payoff date is missing/invalid'
    });
  }
  const expected_payoff_date = new Date(data.expected_payoff_date);
  if (isNaN(expected_payoff_date.getTime())) {
    return response.status(400).json({
      error: true,
      message: 'expected payoff date is missing/invalid'
    });
  }
  const today = new Date(); 
  if (expected_payoff_date < today) {
    return response.status(400).json({
      error: true,
      message: 'expected payoff date is a past date. please pick a future date'
    });
  }

  const new_loan_request = await models.LoanRequest.create({
    lender_id: user_id,
    requester_id: you_id,
    amount: parseInt(data.amount, 10),
    expected_payoff_date: expected_payoff_date,
    approved: null,
    lender_message: null,
    requester_message: data.requester_message,
  });

  response.json({
    new_loan_request,
    message: 'Loan request reated successfully',
  });
});

module.exports = PostRouter;