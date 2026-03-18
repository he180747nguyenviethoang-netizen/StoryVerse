import { Genre } from '../models/index.js';

export const createGenre = async (req, res) => {
    try {
        const genre = await Genre.create(req.body);
        res.status(201).json(genre);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllGenres = async (req, res) => {
    try {
        const genres = await Genre.find();
        res.json(genres);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getGenreById = async (req, res) => {
    try {
        const genre = await Genre.findById(req.params.id);

        if (!genre) {
            return res.status(404).json({ message: 'Genre not found' });
        }

        res.json(genre);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateGenre = async (req, res) => {
    try {
        const genre = await Genre.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!genre) {
            return res.status(404).json({ message: 'Genre not found' });
        }

        res.json(genre);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteGenre = async (req, res) => {
    try {
        const genre = await Genre.findByIdAndDelete(req.params.id);

        if (!genre) {
            return res.status(404).json({ message: 'Genre not found' });
        }

        res.json({ message: 'Genre deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};