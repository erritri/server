const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama harus diisi'],
    trim: true,
    maxlength: [50, 'Nama maksimal 50 karakter']
  },
  email: {
    type: String,
    required: [true, 'Email harus diisi'],
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Email tidak valid']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9+\-\s]+$/, 'Nomor telepon hanya boleh angka dan tanda +/-'] 
  },
  subject: {
  type: String,
  required: [true, 'Subjek harus diisi'],
  trim: true,
  maxlength: [100, 'Subjek maksimal 100 karakter'],
  default: 'Pertanyaan'
},
message: {
    type: String,
    required: [true, 'Pesan harus diisi'],
    maxlength: [1000, 'Pesan maksimal 1000 karakter']
  },
  read: {
    type: Boolean,
    default: false
  },
  replied: {  // Tambahan status balasan
    type: Boolean,
    default: false
  },
  ipAddress: String,  // Untuk tracking spam
  userAgent: String   // Info device pengirim
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

// Index untuk manajemen pesan admin
MessageSchema.index({ read: 1, createdAt: -1 });

// Virtual untuk format tanggal lebih user-friendly
MessageSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('id-ID');
});


module.exports = mongoose.model('Message', MessageSchema);