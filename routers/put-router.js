const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const express_fileupload = require('express-fileupload');
const models = require('../models');
const { fn, col, Op } = require('sequelize');
const cloudinary_manager = require('../cloudinary_manager');

const PutRouter = express.Router();


PutRouter.put('/sign_in', async (request, response) => {
  const data = request.body;

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

  const check_user = await models.User.findOne({ where: { email: data.email } });
  if (!check_user) {
    return response.status(400).json({
      error: true,
      message: 'Invalid credentials.'
    });
  }

  if (bcrypt.compareSync(data.password, check_user.dataValues.password) === false) {
    return response.status(400).json({
      error: true,
      message: 'Invalid credentials.'
    });
  }

  let user = check_user.dataValues;
  
  request.session.id = Date.now();
  request.session.youModel = check_user;
  request.session.you = { ...check_user.dataValues };
  delete user.password;

  return response.status(200).json({
    user,
    session_id: request.session.id,
    message: 'Signed in successfully'
  });
});

PutRouter.put('/update_user_setting', async (request, response) => {
  const data = request.body;
  const you = request.session.you;
  console.log(request.files, request.body);
  const icon_file = request.files && request.files['avatar-input'] || null;

  if (icon_file) {
    try {
      const results = await cloudinary_manager.store(icon_file, you.icon_id);
      console.log(results);
      const cloudinary_image_id = results.result.public_id;
      const cloudinary_image_link = results.result.secure_url;
      await models.User.update({ icon_id: cloudinary_image_id, icon_link: cloudinary_image_link }, { where: { id: you.id } });
      const get_user = await models.User.findOne({ where: { id: you.id } });
      let user = get_user.dataValues;
      
      request.session.youModel = get_user;
      request.session.you = { ...get_user.dataValues };
      delete user.password;
      return response.status(200).json({
        user,
        message: 'Updates successfully!'
      });
    } catch(e) {
      console.log(e);
      return response.status(500).json({
        error: true,
        message: `could not process request`
      });
    }
  }

  const updatesObj = {
    bio: data.bio,
    displayname: data.displayname,
    available_balance: data.available_balance >= 0 && data.available_balance || 0
  };
  
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
  if (!data.paypal) {
    return response.status(400).json({
      error: true,
      message: 'Paypal Email is missing/invalid.'
    });
  }
  if (!data.phone_cc) {
    return response.status(400).json({
      error: true,
      message: 'Phone country code is missing/invalid.'
    });
  }
  updatesObj.phone_cc = data.phone_cc;

  if (!data.phone) {
    return response.status(400).json({
      error: true,
      message: 'Phone number is missing/invalid.'
    });
  }
  updatesObj.phone = data.phone;

  if (!data.city) {
    return response.status(400).json({
      error: true,
      message: 'City code is missing/invalid.'
    });
  }
  updatesObj.city = data.city;

  if (!data.state) {
    return response.status(400).json({
      error: true,
      message: 'State is missing/invalid.'
    });
  }
  updatesObj.state = data.state;

  if (!data.zipcode) {
    return response.status(400).json({
      error: true,
      message: 'Zipcode is missing/invalid.'
    });
  }
  updatesObj.zipcode = data.zipcode;

  if (data.username !== you.username) {
    const check_username = await models.User.findOne({ where: { username: data.username } });
    if (check_username) {
      return response.status(400).json({
        error: true,
        message: 'Username is taken.'
      });
    }
    updatesObj.username = data.username;
  }

  if (data.email !== you.email) {
    const check_email = await models.User.findOne({ where: { email: data.email } });
    if (check_email) {
      return response.status(400).json({
        error: true,
        message: 'Email is already in use.'
      });
    }
    updatesObj.email = data.email;
  }

  if (data.paypal !== you.paypal) {
    const check_paypal = await models.User.findOne({ where: { paypal: data.paypal } });
    if (check_paypal) {
      return response.status(400).json({
        error: true,
        message: 'Paypal email is already in use.'
      });
    }
    updatesObj.paypal = data.paypal;
  }

  if (!data.oldPassword && (data.password || data.confirmPassword)) {
    return response.status(400).json({
      error: true,
      message: 'Current Password is missing/invalid.'
    });
  }
  if (data.oldPassword) {
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

    if (bcrypt.compareSync(data.password, request.session.youModel.dataValues.password) === false) {
      return response.status(400).json({
        error: true,
        message: 'Invalid credentials.'
      });
    }
    updatesObj.password = bcrypt.hashSync(data.password);
  }

  console.log('updatesObj', updatesObj);

  await models.User.update(updatesObj, { where: { id: you.id } });
  const get_user = await models.User.findOne({ where: { id: you.id } });

  let user = get_user.dataValues;
  
  request.session.youModel = get_user;
  request.session.you = { ...get_user.dataValues };
  delete user.password;

  return response.status(200).json({
    user,
    message: 'Updates successfully!'
  });
  
});

PutRouter.put('/loan-requests/:id', async (request, response) => {
  const loan_request = request.body;
  const you = request.session.you;

  if (loan_request.approval_state === null) {
    return response.status(400).json({
      error: true,
      message: '"approval_state" property missing from request body'
    });
  }
  
  const loanRequestUpdates = await models.LoanRequest.update(
    { approved: loan_request.approval_state, lender_message: loan_request.lender_message },
    { where: { id: loan_request.id } }
  );

  if (loan_request.approval_state === true) {
    const lender = await models.User.findOne({ where: { id: loan_request.lender_id } });
    lender.available_balance = lender.dataValues.available_balance - loan_request.amount;
    await lender.save();
    const newLoan = await models.Loan.create({
      lender_id: loan_request.lender_id,
      recipient_id: loan_request.requester_id,
      amount: loan_request.amount,
      date_loaned: new Date(),
      date_due: loan_request.expected_payoff_date,
    });

    return response.json({
      message: 'loan request updated: new loan created',
      loan: newLoan,
    });
  } else {
    return response.json({
      message: 'loan request updated: declined',
    });
  }
});

PutRouter.put('/loans/:id', async (request, response) => {
  // mark loan as paid off
  await models.Loan.update(
    { paid_off: true },
    { where: { id: parseInt(request.params.id, 10) } }
  );

  return response.json({
    message: 'loan updated successfully'
  });
});


module.exports = PutRouter;