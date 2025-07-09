const User = require('../models/User');

module.exports = {
  list: async (req, res) => {
    try {
      const users = await User.find({}, 'username email');
      res.json({ users });
    } catch (err) {
      res
        .status(500)
        .json({ message: 'Failed to fetch users', error: err.message });
    }
  },
};
