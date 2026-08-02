const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const ACCESS_COOKIE_NAME = 'pf_access_token';
const REFRESH_COOKIE_NAME = 'pf_refresh_token';

const generateAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: '15m'
    }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d'
    }
  );

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  generateAccessToken,
  generateRefreshToken,
  hashToken
};
