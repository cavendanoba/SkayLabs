// backend/src/app.js
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import env from './config/env.js';
import corsOptions from './config/cors.js';
import { securityHeaders } from './config/security.js';

import authRouter from './modules/auth/auth.router.js';
import usersRouter from './modules/users/users.router.js';
import patientsRouter from './modules/patients/patients.router.js';
import appointmentsRouter from './modules/appointments/appointments.router.js';
import hxRecordsRouter from './modules/hx-records/hx-records.router.js';
import transactionsRouter from './modules/transactions/transactions.router.js';
import dashboardRouter from './modules/dashboard/dashboard.router.js';
import errorHandler from './middlewares/error-handler.middleware.js';

const app = express();

// ============= MIDDLEWARE GLOBAL =============

app.use((req, res, next) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 100,
  message: 'Demasiadas solicitudes, intenta más tarde',
});
app.use('/api/', limiter);

// ============= RUTAS =============

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const API = `/api/v${env.API_VERSION}`;
app.use(`${API}/auth`, authRouter);
app.use(`${API}/users`, usersRouter);
app.use(`${API}/patients`, patientsRouter);
app.use(`${API}/appointments`, appointmentsRouter);
app.use(`${API}/hx-records`, hxRecordsRouter);
app.use(`${API}/transactions`, transactionsRouter);
app.use(`${API}/dashboard`, dashboardRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', code: 'NOT_FOUND', path: req.path });
});

app.use(errorHandler);

export default app;

