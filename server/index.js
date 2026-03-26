const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' })); // bumped limit for base64 images

// quick health check
app.get('/', (req, res) => {
  res.json({ msg: 'server is up' });
});

// routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));

// centralised error handler (must be after routes)
app.use(require('./middleware/errorMiddleware'));

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
