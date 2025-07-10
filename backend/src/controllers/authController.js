const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwtUtil = require('../utils/jwt');
const tokenBlacklistService = require('../services/tokenBlacklistService');

const SALT_ROUNDS = 10;

module.exports = {
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      const existing = await User.findOne({ $or: [{ email }, { username }] });
      if (existing) {
        return res.status(409).json({ message: 'User already exists' });
      }
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await User.create({ username, email, password: hashed });
      res.status(201).json({
        message: 'User registered',
        user: { _id: user._id, username: user.username, email: user.email },
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: 'Registration failed', error: err.message });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }
      const user = await User.findOne({ email });
      if (!user)
        return res.status(401).json({ message: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid)
        return res.status(401).json({ message: 'Invalid credentials' });
      const accessToken = jwtUtil.generateAccessToken(user._id);
      const refreshToken = jwtUtil.generateRefreshToken(user._id);
      res.json({ accessToken, refreshToken });
    } catch (err) {
      res.status(500).json({ message: 'Login failed', error: err.message });
    }
  },
  logout: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken)
        return res.status(400).json({ message: 'Refresh token required' });
      const payload = jwtUtil.verifyRefreshToken(refreshToken);
      await tokenBlacklistService.blacklistToken(refreshToken, payload.exp);
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      res.status(400).json({ message: 'Invalid refresh token' });
    }
  },
  refresh: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken)
        return res.status(400).json({ message: 'Refresh token required' });
      const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(
        refreshToken
      );
      if (isBlacklisted)
        return res.status(401).json({ message: 'Token blacklisted' });
      const payload = jwtUtil.verifyRefreshToken(refreshToken);
      const accessToken = jwtUtil.generateAccessToken(payload.userId);
      res.json({ accessToken });
    } catch (err) {
      res.status(400).json({ message: 'Invalid refresh token' });
    }
  },
  me: async (req, res) => {
    res.json({ user: req.user });
  },
};
