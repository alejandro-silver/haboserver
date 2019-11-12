const express = require('express');
const models = require('../models');
const { fn, col, Op } = require('sequelize');
const cloudinary_manager = require('../cloudinary_manager');

const GetRouter = express.Router();


GetRouter.get('/', async (request, response) => {
  return response.json({});
});

GetRouter.get('/sign_out', async (request, response) => {
  request.session.reset();
  return response.json({ online: false, successful: true });
});

GetRouter.get('/check_session', async (request, response) => {
  if (request.session.id) {
    const user = { ...request.session.you };
    delete user.password;
    return response.json({ user });
  } else {
    return response.json({ user: null });
  }
});

GetRouter.get('/users/:id', async (request, response) => {
  const user = await models.User.findOne({ where: { id: request.params.id } });
  response.json({ user });
});

GetRouter.get('/users/:id/page-details', async (request, response) => {
  const user = await models.User.findOne({ where: { id: request.params.id } });

  const reviews_info = await models.UserReview.findOne({
    where: { user_id: request.params.id },
    attributes: [
      [fn('AVG', col('rating')), 'ratingAvg'],
      [fn('COUNT', col('rating')), 'ratingCount'],
    ],
    group: ['user_id'],
  });

  const loans_info_active = await models.Loan.findOne({
    where: { recipient_id: request.params.id, paid_off: false },
    attributes: [
      [fn('SUM', col('amount')), 'loansSum'],
      [fn('COUNT', col('amount')), 'loansCount'],
    ],
    group: ['recipient_id'],
  });

  const loans_info_archive = await models.Loan.findOne({
    where: { recipient_id: request.params.id, paid_off: true },
    attributes: [
      [fn('SUM', col('amount')), 'loansSum'],
      [fn('COUNT', col('amount')), 'loansCount'],
    ],
    group: ['recipient_id'],
  });

  return response.json({
    user,
    reviews_info: {
      ratingAvg: reviews_info && reviews_info.dataValues.ratingAvg || 0,
      ratingCount: reviews_info && reviews_info.dataValues.ratingCount || 0,
    },
    loans_info_active: {
      loansSum: loans_info_active && loans_info_active.dataValues.loansSum || 0,
      loansCount: loans_info_active && loans_info_active.dataValues.loansCount || 0,
    },
    loans_info_archive: {
      loansSum: loans_info_archive && loans_info_archive.dataValues.loansSum || 0,
      loansCount: loans_info_archive && loans_info_archive.dataValues.loansCount || 0,
    }
  });
});

GetRouter.get(['/users/:id/loans-taken', '/users/:id/loans-taken/:loan_id'], async (request, response) => {
  const user_id = parseInt(request.params.id, 10);
  const loan_id = parseInt(request.params.loan_id, 10);

  const loans = await models.Loan.findAll({
    where: (!loan_id ? { recipient_id: user_id } : { recipient_id: user_id, id: { [Op.lt]: loan_id } }),
    include: [{
      model: models.User,
      as: 'loan_lender',
      attributes: { exclude: ['password'] }
    }],
    limit: 5,
    order: [["id","DESC"]],
  });

  return response.json({ loans });
});

GetRouter.get(['/users/:id/loans-given', '/users/:id/loans-given/:loan_id'], async (request, response) => {
  const user_id = parseInt(request.params.id, 10);
  const loan_id = parseInt(request.params.loan_id, 10);

  const loans = await models.Loan.findAll({
    where: (!loan_id ? { lender_id: user_id } : { lender_id: user_id, id: { [Op.lt]: loan_id } }),
    include: [{
      model: models.User,
      as: 'loan_recipient',
      attributes: { exclude: ['password'] }
    }],
    limit: 5,
    order: [["id","DESC"]],
  });

  return response.json({ loans });
});

GetRouter.get(['/users/:id/loan-requests', '/users/:id/loan-requests/:loan_request_id'], async (request, response) => {
  const user_id = parseInt(request.params.id, 10);
  const loan_request_id = parseInt(request.params.loan_request_id, 10);

  const loan_requests = await models.LoanRequest.findAll({
    where: (!loan_request_id ? { lender_id: user_id } : { lender_id: user_id, id: { [Op.lt]: loan_request_id } }),
    include: [{
      model: models.User,
      as: 'loan_requester',
      attributes: { exclude: ['password'] }
    }],
    limit: 5,
    order: [["id","DESC"]],
  });

  return response.json({ loan_requests });
});

GetRouter.get(['/users/:id/loans-requested', '/users/:id/loans-requested/:loan_request_id'], async (request, response) => {
  const user_id = parseInt(request.params.id, 10);
  const loan_request_id = parseInt(request.params.loan_request_id, 10);

  const loan_requests = await models.LoanRequest.findAll({
    where: (!loan_request_id ? { requester_id: user_id } : { requester_id: user_id, id: { [Op.lt]: loan_request_id } }),
    include: [{
      model: models.User,
      as: 'loan_lender',
      attributes: { exclude: ['password'] }
    }],
    limit: 5,
    order: [["id","DESC"]],
  });

  return response.json({ loan_requests });
});

GetRouter.get(['/users/:id/reviews', '/users/:id/reviews/:review_id'], async (request, response) => {
  const { id, review_id } = request.params;
  console.log({ id, review_id });
  const reviews = await models.UserReview.findAll({
    where: (!review_id ? { user_id: id } : { user_id: id, id: { [Op.lt]: review_id } }),
    include: [{
      model: models.User,
      as: 'writer',
      attributes: { exclude: ['password'] }
    }],
    limit: 5,
    order: [["id","DESC"]],
  });

  return response.json({ reviews });
});

GetRouter.get(['/search-users/:minimum_available_amount', '/search-users/:minimum_available_amount/:user_id'], async (request, response) => {
  let { user_id, minimum_available_amount } = request.params;
  const amount = parseInt(minimum_available_amount, 10);
  user_id = parseInt(user_id, 10);
  const you = request.session.you;
  const you_id = parseInt(you.id, 10);

  if (!amount || amount < 1) {
    return response.status(400).json({
      error: true,
      message: 'Bad amount path value; must be a number above 0.'
    });
  }

  const whereClause = {
    available_balance: { [Op.gte]: amount }
  };
  if (user_id) {
    whereClause.id = { [Op.lt]: user_id, [Op.ne]: you_id }
  } else {
    whereClause.id = { [Op.ne]: you_id }
  }

  const usersResults = await models.User.findAll({
    where: whereClause,
    attributes: { exclude: ['password'] },
    limit: 5,
    order: [["id","DESC"]],
  });

  const users = usersResults.map(user => user.dataValues);
  const promise_list = users.map(async (user) => {
    return models.LoanRequest.findOne({
      where: { lender_id: user.id, requester_id: you_id, approved: null }
    }).then((loan_request) => {
      user.loan_request = loan_request && loan_request.dataValues;
    });
  });

  Promise.all(promise_list).then(() => {
    return response.json({ users });
  });
});


module.exports = GetRouter;