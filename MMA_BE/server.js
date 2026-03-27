import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './src/routes/authRoutes.js';
import genreRoutes from './src/routes/genreRoutes.js';
import comicRoutes from './src/routes/comicRoutes.js';
import chapterRoutes from './src/routes/chapterRoutes.js';
import commentRoutes from './src/routes/commentRoutes.js';
import readingHistoryRoutes from './src/routes/readingHistoryRoutes.js';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/database.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swagger.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';


const app = express();

connectDB();

app.set('trust proxy', 1);
app.set('etag', false);

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/comics', comicRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reading-history', readingHistoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Comic API is running' });
});

app.use(errorHandler);

app.listen(process.env.PORT || 5000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});

export default app;
