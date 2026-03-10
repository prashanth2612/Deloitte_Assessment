const isValidAuthToken = require('./isValidAuthToken');
const login = require('./login');
const logout = require('./logout');
const forgetPassword = require('./forgetPassword');
const resetPassword = require('./resetPassword');

const register = require('./register.js'); 

const createAuthMiddleware = (userModel) => {
  let authMethods = {};

  authMethods.isValidAuthToken = (req, res, next) =>
    isValidAuthToken(req, res, next, {
      userModel,
    });

  authMethods.login = async(req, res) =>
    login(req, res, {
      userModel,
    });

  authMethods.forgetPassword = (req, res) =>
    forgetPassword(req, res, {
      userModel,
    });

  authMethods.resetPassword = (req, res) =>
    resetPassword(req, res, {
      userModel,
    });

  authMethods.logout = async(req, res) =>
    logout(req, res, {
      userModel,
    });

  // Ensure naming consistency
  authMethods.register = async (req, res) => {
    register(req, res, { userModel }); // Call register correctly
  };

  return authMethods;
};

module.exports = createAuthMiddleware;
