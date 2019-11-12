module.exports = {};

module.exports.validateEmail = function validateEmail(email) {
  if(!email) { return false; }
  if(email.constructor !== String) { return false; }
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
}

module.exports.validateEmail = function validatePassword(password) {
  if(!password) { return false; }
  if(password.constructor !== String) { return false; }

  let hasMoreThanSixCharacters = password.length > 6;
  let hasUpperCase = /[A-Z]/.test(password);
  let hasLowerCase = /[a-z]/.test(password);
  let hasNumbers = /\d/.test(password);
  let hasNonalphas = /\W/.test(password);

  return (
    hasMoreThanSixCharacters &&
    (hasUpperCase || hasLowerCase) &&
    hasNumbers
  );
}