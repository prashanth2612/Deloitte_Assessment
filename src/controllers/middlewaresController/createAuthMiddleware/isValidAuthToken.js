const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel }) => {
  if (!databasePassword) {
    return res.status(404).json({ success: false, result: null, message: 'User credentials not found.' });
  }

  const isMatch = await bcrypt.compare(databasePassword.salt + password, databasePassword.password);
  if (!isMatch) {
    return res.status(403).json({ success: false, result: null, message: 'Invalid credentials.' });
  }

  const rememberMe = Boolean(req.body.remember);
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? '365d' : '24h',
  });

  await UserPasswordModel.findOneAndUpdate(
    { user: user._id },
    { $push: { loggedSessions: token } },
    { new: true }
  ).exec();

  const isProduction = process.env.NODE_ENV === 'production';

  return res
    .status(200)
    .cookie('token', token, {
      httpOnly: true,
      sameSite: isProduction ? 'None' : 'Lax',
      secure: isProduction,
      path: '/',
      ...(rememberMe && { maxAge: 365 * 24 * 60 * 60 * 1000 }),
    })
    .json({
      success: true,
      result: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        role: user.role,
        email: user.email,
        photo: user.photo,
      },
      message: 'Successfully logged in.',
    });
};

module.exports = authUser;