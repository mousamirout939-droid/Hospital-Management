const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Signs a JWT, sets it as an httpOnly cookie, and sends the user object
 * in the JSON response (cookie is for browser convenience, token is for
 * clients like mobile apps / Postman that prefer Authorization headers).
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieExpiresDays = Number(process.env.JWT_COOKIE_EXPIRES_DAYS) || 7;

  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpiresDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeObject ? user.toSafeObject() : user,
  });
};

module.exports = { signToken, sendTokenResponse };
