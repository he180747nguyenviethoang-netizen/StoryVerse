import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';

const normalizeEmail = (email) =>
    typeof email === 'string' ? email.trim().toLowerCase() : '';

export const register = async (req, res) => {
    try {
        const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
        const email = normalizeEmail(req.body.email);
        const password = typeof req.body.password === 'string' ? req.body.password : '';

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'username, email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existingByEmail = await User.findOne({ email });
        if (existingByEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const existingByUsername = await User.findOne({ username });
        if (existingByUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            isVerified: true,
            isActive: true,
            role: 'user',
        });

        const accessToken = generateToken({ id: user._id });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: accessToken,
            accessToken,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
        const password = typeof req.body.password === 'string' ? req.body.password : '';

        if (!password) {
            return res.status(400).json({ message: 'password is required' });
        }

        if (!email && !username) {
            return res.status(400).json({ message: 'email or username is required' });
        }

        const user = email
            ? await User.findOne({ email })
            : await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.password) {
            return res.status(401).json({ message: 'Password login is not enabled for this account' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = generateToken({ id: user._id });

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            token: accessToken,
            accessToken,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
