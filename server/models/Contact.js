const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    // optional — not every contact has an email
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    // stored as base64 data URL (fine for small images)
    image: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// helps with search performance
contactSchema.index({ user: 1, name: 1 });
contactSchema.index({ user: 1, phone: 1 });
contactSchema.index({ favorite: 1 });
contactSchema.index({ dateOfBirth: 1 });

module.exports = mongoose.model('Contact', contactSchema);
