import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { findUserTeams } from '../services/teamMember.js';

/**
 * IMPORTANT: We intentionally do NOT include a `role` field in the login /
 * register response. Team roles live on TeamMember (Team.members[]) and are
 * looked up per-team via GET /api/auth/me/teams. The old `User.role` column
 * was a legacy field and must never drive UI role gating.
 */
const toAuthPayload = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  token,
});

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Don't accept a role from the client — roles are per-team and assigned via TeamMember.
    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);
    res.status(201).json(toAuthPayload(user, token));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json(toAuthPayload(user, token));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me/teams
// Returns the TeamMember records (+ teams) for the logged-in user.
// The frontend calls this immediately after login to decide onboarding:
//   0 teams → create-team screen
//   1 team  → auto-select, go to dashboard
//   N teams → team picker
export const getMyTeams = async (req, res) => {
  try {
    const memberships = await findUserTeams(req.user._id);
    res.json({ memberships });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
