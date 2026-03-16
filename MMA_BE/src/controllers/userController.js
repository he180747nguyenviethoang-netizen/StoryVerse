import { User } from '../models/index.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('favorites');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { username, email, avatar } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { username, email, avatar },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addFavorite = async (req, res) => {
    try {
        const { comicId } = req.body;

        const user = await User.findById(req.user._id);

        if (user.favorites.includes(comicId)) {
            return res.status(400).json({ message: 'Comic already in favorites' });
        }

        user.favorites.push(comicId);
        await user.save();

        res.json({ message: 'Added to favorites', favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const removeFavorite = async (req, res) => {
    try {
        const { comicId } = req.params;

        const user = await User.findById(req.user._id);
        user.favorites = user.favorites.filter(id => id.toString() !== comicId);
        await user.save();

        res.json({ message: 'Removed from favorites', favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};