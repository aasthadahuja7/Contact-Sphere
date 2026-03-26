const express = require('express');
const router = express.Router();
const {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  exportContacts,
  getAnalytics,
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes
router.route('/').get(getContacts).post(createContact);
router.get('/analytics', getAnalytics);
router.get('/export', exportContacts);

router
  .route('/:id')
  .get(getContactById)
  .put(updateContact)
  .delete(deleteContact);

module.exports = router;
