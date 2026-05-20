const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const customerRoutes = require('./routes/customerRoutes');
const milkEntryRoutes = require('./routes/milkEntryRoutes');
const dairyEntryRoutes = require('./routes/dairyEntryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dairyRoutes = require('./routes/dairyRoutes');
const seedAdmin = require('./config/seedAdmin');
const seedDairies = require('./config/seedDairies');
const migrateUserDairies = require('./config/migrateUsers');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'VNR Milk Collection API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dairies', dairyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/milk-entry', milkEntryRoutes);
app.use('/api/dairy-entry', dairyEntryRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

connectDB().then(async () => {
  await seedDairies();
  await migrateUserDairies();
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
});
