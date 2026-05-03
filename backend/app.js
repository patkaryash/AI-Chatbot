import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import connect from './db/db.js';
import chatRoutes from './routes/chat.routes.js';
import userRoutes from './routes/user.routes.js';
import requestRoutes from './routes/request.routes.js';
import helmet from 'helmet';

import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
app.set('trust proxy', 1); // Allow secure cookies behind reverse proxy

connect();

app.use(helmet());
app.use(mongoSanitize());
const allowedOrigins = [
  'http://localhost:5173',
  'https://ai-chatbot-iota-olive.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/chat', chatRoutes);
app.use('/requests', requestRoutes);


app.get('/', (_req, res) => {
  res.json({
    name: 'Developer Chat Platform API',
    status: 'ok',
  });
});

app.use(errorHandler);

export default app;
