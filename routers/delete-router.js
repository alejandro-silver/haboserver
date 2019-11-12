const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const express_fileupload = require('express-fileupload');
const models = require('../models');
const { fn, col, Op } = require('sequelize');
const cloudinary_manager = require('../cloudinary_manager');

const DeleteRouter = express.Router();


DeleteRouter.delete('/loan-requests/:id/cancel', async (request, response) => {
  const you = request.session.you;
  // const you_id = parseInt(you.id, 10);
  const loan_request_id = parseInt(request.params.id, 10);

  const loan_request = await models.LoanRequest.findOne({
    where: { id: loan_request_id }
  });

  if (loan_request.dataValues.approved !== null) {
    return response.status(400).json({
      error: true,
      message: 'cannot cancel a loan request that has been approved or declined'
    });
  }
  
  await models.LoanRequest.destroy({
    where: { id: loan_request_id }
  });

  return response.json({
    message: 'loan request canceled successfully'
  });
});


module.exports = DeleteRouter;