const mongoose = require('mongoose');

const logout = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');
  const token = req.cookies.token;
  const userId = req.admin?._id || req[userModel.toLowerCase()]?._id;

  if (token && userId) {
    await UserPassword.findOneAndUpdate(
      { user: userId },
      { $pull: { loggedSessions: token } },
      { new: true }
    ).exec();
  }

  const isProduction = process.env.NODE_ENV === 'production';

  return res
    .clearCookie('token', {
      httpOnly: true,
      sameSite: isProduction ? 'None' : 'Lax',
      secure: isProduction,
      domain: req.hostname,
      path: '/',
    })
    .json({ success: true, result: {}, message: 'Successfully logged out.' });
};

module.exports = logout;
