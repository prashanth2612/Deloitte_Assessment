const bcrypt = require('bcryptjs');
const Joi = require('joi');
const mongoose = require('mongoose');
const sendWelcomeEmail = require('./sendIdurarOffer');

const register = async (req, res, { userModel }) => {
  const UserPasswordModel = mongoose.model(userModel + 'Password');
  const UserModel = mongoose.model(userModel);
  const { name, email, password, country } = req.body;

  // Validation
  const objectSchema = Joi.object({
    email: Joi.string().email({ tlds: { allow: true } }).required(),
    name: Joi.string().min(2).max(100).required(),
    country: Joi.string().required(),
    password: Joi.string().min(6).required(),
  });

  const { error } = objectSchema.validate({ name, email, password, country });
  if (error) {
    return res.status(422).json({
      success: false,
      result: null,
      message: 'Validation failed.',
      errorMessage: error.message,
    });
  }

  // Check duplicate
  const existingUser = await UserModel.findOne({ email, removed: false });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'An account with this email already exists.',
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const createdUser = await UserModel.create({ name, email, country, enabled: true });

  const databasePassword = await UserPasswordModel.create({
    removed: false,
    user: createdUser._id,
    password: hashedPassword,
    salt,
    emailVerified: false,
    authType: 'email',
    loggedSessions: [],
  });

  if (!createdUser || !databasePassword) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error creating your account. Please try again.',
    });
  }

  // Send welcome email (non-blocking)
  sendWelcomeEmail({ email: createdUser.email, name: createdUser.name }).catch((err) =>
    console.error('[register] Welcome email failed:', err.message)
  );

  return res.status(201).json({
    success: true,
    result: {
      _id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      country: createdUser.country,
    },
    message: 'Account created successfully.',
  });
};

module.exports = register;
