const { Sequelize, Model, DataTypes } = require('sequelize');

/**
 * For Operators,
 * @see: https://sequelize.org/v5/manual/querying.html#where
 */

let sequelize, db_env;
if(process.env.DATABASE_URL) {
  db_env = 'Production';
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: true
    },
    logging: false,
  });
} else {
  db_env = 'Development';
  sequelize = new Sequelize({
    password: null,
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: true,
  });
}



/**
 * Models
 * ---
 * Each `class` is a model of a database table; each property is a field of the table.
 * These class definition outline the types of values of the table.
 * @see: https://sequelize.org/v5/
 */

class User extends Model {}
User.init({
  displayname:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  username:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  email:                  { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  paypal:                 { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  password:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  phone_cc:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  phone:                  { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  available_balance:      { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  city:                   { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  state:                  { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  zipcode:                { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  bio:                    { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  icon_id:                { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  icon_link:              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  verified:               { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:           { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                   { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { sequelize, modelName: 'user', freezeTableName: true, underscored: true, });

class UserReview extends Model {}
UserReview.init({
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  writer_id:       { type: Sequelize.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  rating:          { type: Sequelize.INTEGER, allowNull: false },
  title:           { type: Sequelize.STRING(250), allowNull: true },
  summary:         { type: Sequelize.STRING(500), allowNull: true },

  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { sequelize, modelName: 'user_review', freezeTableName: true, underscored: true, });

class Loan extends Model {}
Loan.init({
  lender_id:       { type: Sequelize.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  recipient_id:    { type: Sequelize.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  amount:          { type: Sequelize.INTEGER, allowNull: false },
  date_loaned:     { type: Sequelize.DATE, allowNull: false },
  date_due:        { type: Sequelize.DATE, allowNull: false },
  paid_off:        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { sequelize, modelName: 'loans', freezeTableName: true, underscored: true, });

class LoanRequest extends Model {}
LoanRequest.init({
  lender_id:                  { type: Sequelize.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  requester_id:               { type: Sequelize.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  amount:                     { type: Sequelize.INTEGER, allowNull: false },
  expected_payoff_date:       { type: Sequelize.DATE, allowNull: false },
  approved:                   { type: Sequelize.BOOLEAN, allowNull: true },
  lender_message:             { type: Sequelize.STRING(250), allowNull: true },
  requester_message:          { type: Sequelize.STRING(250), allowNull: true },
  date_created:               { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                       { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { sequelize, modelName: 'loan_requests', freezeTableName: true, underscored: true, });

/**
 * Relationships
 * ---
 * this portion of the file determines the relationship between the database tables.
 * this will help when we are doing joins where one table has may have multiple foreign keys
 * to one other table.
 * */

User.hasMany(Loan, { as: 'loans_given', foreignKey: 'lender_id', sourceKey: 'id' });
Loan.belongsTo(User, { as: 'loan_lender', foreignKey: 'lender_id', targetKey: 'id' });
User.hasMany(Loan, { as: 'loans_taken', foreignKey: 'recipient_id', sourceKey: 'id' });
Loan.belongsTo(User, { as: 'loan_recipient', foreignKey: 'recipient_id', targetKey: 'id' });

User.hasMany(LoanRequest, { as: 'loan_requests', foreignKey: 'lender_id', sourceKey: 'id' });
LoanRequest.belongsTo(User, { as: 'loan_lender', foreignKey: 'lender_id', targetKey: 'id' });
User.hasMany(LoanRequest, { as: 'loans_requesting', foreignKey: 'requester_id', sourceKey: 'id' });
LoanRequest.belongsTo(User, { as: 'loan_requester', foreignKey: 'requester_id', targetKey: 'id' });

User.hasMany(UserReview, { as: 'user_reviews', foreignKey: 'user_id', sourceKey: 'id' });
UserReview.belongsTo(User, { as: 'review_user', foreignKey: 'user_id', targetKey: 'id' });
User.hasMany(UserReview, { as: 'reviews_written', foreignKey: 'writer_id', sourceKey: 'id' });
UserReview.belongsTo(User, { as: 'writer', foreignKey: 'writer_id', targetKey: 'id' });



sequelize.sync({ force: false })
  .then(() => { console.log('Database Initialized! ENV: ' + db_env); })
  .catch((error) => { console.log('Database Failed!', error); });

module.exports = {
  User,
  UserReview,
  Loan,
  LoanRequest,
  //
  sequelize,
};
