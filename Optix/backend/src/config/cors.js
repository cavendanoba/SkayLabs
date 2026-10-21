// backend/src/config/cors.js
import env from './env.js';

export const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS no permitido'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
};

export default corsOptions;
