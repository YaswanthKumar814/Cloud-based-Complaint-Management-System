import express from 'express';
import complaintRoutes from './routes/complaintRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

app.use(complaintRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
