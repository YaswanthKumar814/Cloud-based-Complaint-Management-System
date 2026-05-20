import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import indexRoutes from './routes/index.js';
import complaintRoutes from './routes/complaintRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.use(indexRoutes);
app.use('/api', complaintRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
