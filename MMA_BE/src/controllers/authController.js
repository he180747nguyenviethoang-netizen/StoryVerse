import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { verifyGoogleToken } from '../services/googleAuthService.js';
import {
    sendPasswordResetCodeEmail,
    sendVerificationCodeEmail,
} from '../services/emailService.js';

const CODE_EXPIRES_MS = 10 * 60 * 1000;

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
const isCodeMatch = (code, storedValue) => {
    if (!storedValue) return false;
    const hashed = hashCode(code);

    // Backward compatibility: support legacy plain-code values already in DB.
    return storedValue === hashed || storedValue === code;
};

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

export const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const email = normalizeEmail(req.body.email);

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'username, email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existingByUsername = await User.findOne({ username });
        if (existingByUsername && normalizeEmail(existingByUsername.email) !== email) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const verificationCode = generateCode();
        const verificationCodeHash = hashCode(verificationCode);
        const verificationCodeExpires = new Date(Date.now() + CODE_EXPIRES_MS);
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingByEmail = await User.findOne({ email });
        if (existingByEmail && existingByEmail.isVerified) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let user;

        if (existingByEmail) {
            existingByEmail.username = username;
            existingByEmail.password = hashedPassword;
            existingByEmail.isVerified = false;
            existingByEmail.verificationCode = verificationCodeHash;
            existingByEmail.verificationCodeExpires = verificationCodeExpires;
            existingByEmail.resetPasswordCode = undefined;
            existingByEmail.resetPasswordCodeExpires = undefined;

            user = await existingByEmail.save();
        } else {
            user = await User.create({
                username,
                email,
                password: hashedPassword,
                isVerified: false,
                verificationCode: verificationCodeHash,
                verificationCodeExpires,
            });
        }

        await sendVerificationCodeEmail(user.email, verificationCode);

        res.status(201).json({
            message: 'Verification code sent to your email. Verify your account to continue.',
            email: user.email,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyCode = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
        const purpose = typeof req.body.purpose === 'string' ? req.body.purpose.trim().toLowerCase() : '';

        if (!email || !code || !purpose) {
            return res.status(400).json({ message: 'email, code and purpose are required' });
        }

        if (!['register', 'forgot-password'].includes(purpose)) {
            return res.status(400).json({ message: 'purpose must be register or forgot-password' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (purpose === 'register') {
            if (user.isVerified) {
                return res.status(400).json({ message: 'Account is already verified' });
            }

            if (
                !isCodeMatch(code, user.verificationCode)
                || !user.verificationCodeExpires
                || user.verificationCodeExpires < new Date()
            ) {
                return res.status(400).json({ message: 'Invalid or expired verification code' });
            }

            user.isVerified = true;
            user.verificationCode = undefined;
            user.verificationCodeExpires = undefined;
            await user.save();

            return res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken({ id: user._id }),
            });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'Password login is not enabled for this account' });
        }

        if (
            !isCodeMatch(code, user.resetPasswordCode)
            || !user.resetPasswordCodeExpires
            || user.resetPasswordCodeExpires < new Date()
        ) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        user.resetPasswordCode = undefined;
        user.resetPasswordCodeExpires = undefined;
        user.resetPasswordVerifiedUntil = new Date(Date.now() + CODE_EXPIRES_MS);
        await user.save();

        res.json({
            message: 'Code verified. You can now reset password.',
            email: user.email,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.password && !user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in' });
        }

        if (user.password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        } else {
             return res.status(401).json({ message: 'Please login with Google' });
        }

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            token: generateToken({ id: user._id }),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'idToken is required' });
        }

        const googleUser = await verifyGoogleToken(idToken);

        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            // Create user if not exists
            user = await User.create({
                username: googleUser.name + Math.floor(Math.random() * 1000), // Ensure unique username
                email: googleUser.email,
                avatar: googleUser.avatar,
                googleId: googleUser.googleId,
                isVerified: true,
            });
        } else {
            // Update googleId if user exists but linked later (optional)
            if (!user.googleId) {
                user.googleId = googleUser.googleId;
                if (!user.avatar) user.avatar = googleUser.avatar;
                user.isVerified = true;
                await user.save();
            }
        }

        res.json({
            accessToken: generateToken({ id: user._id }),
            user: {
                id: user._id,
                email: user.email,
                name: user.username,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email) {
            return res.status(400).json({ message: 'email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: 'If the email exists, a reset code has been sent' });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'Password login is not enabled for this account' });
        }

        const resetCode = generateCode();
        user.resetPasswordCode = hashCode(resetCode);
        user.resetPasswordCodeExpires = new Date(Date.now() + CODE_EXPIRES_MS);
        await user.save();

        await sendPasswordResetCodeEmail(user.email, resetCode);

        res.json({ message: 'If the email exists, a reset code has been sent' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: 'email and newPassword are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findOne({ email });

        if (
            !user
            || !user.resetPasswordVerifiedUntil
            || user.resetPasswordVerifiedUntil < new Date()
        ) {
            return res.status(400).json({ message: 'Please verify reset code first' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordCode = undefined;
        user.resetPasswordCodeExpires = undefined;
        user.resetPasswordVerifiedUntil = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
