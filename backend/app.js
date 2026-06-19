const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const labReportRoutes = require('./routes/labReportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Trust the first proxy (Render sits behind a load balancer) - needed for
// correct secure-cookie / rate-limit behavior in production.
app.set('trust proxy', 1);

// ---------- Security middleware ----------
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// ---------- CORS ----------
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ---------- Body parsing ----------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ---------- Logging ----------
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ---------- Rate limiting ----------
const limiter = rateLimit({
  windowMs: (Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ---------- Static files (uploaded images/pdfs) ----------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'HMS API is running', timestamp: new Date().toISOString() });
});

// ---------- API Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/lab-reports', labReportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hospital Management System API',
    docs: 'See /api/health for status check',
  });
});

// ---------- Error handling (must be last) ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
