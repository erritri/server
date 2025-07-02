const mongoose = require('mongoose');
const slugify = require('slugify');
const path = require('path');
const fs = require('fs');

const ProjectSchema = new mongoose.Schema({
  // Informasi Dasar
  title: {
    type: String,
    required: [true, 'Judul proyek harus diisi'],
    trim: true,
    maxlength: [100, 'Judul tidak boleh lebih dari 100 karakter'],
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    index: true,
    sparse: true // Hindari error jika slug belum dibuat
  },
  description: {
    type: String,
    required: [true, 'Deskripsi harus diisi'],
    maxlength: [500, 'Deskripsi maksimal 500 karakter']
  },

  // Media
  coverImage: {
    type: String,
    default: '/uploads/default.jpg'
  },
  screenshots: [{
    url: String,
    caption: String
  }],

  // Metadata
  technologies: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Auto-generate unique slug
ProjectSchema.pre('save', async function (next) {
  if (!this.isModified('title')) return next();

  const baseSlug = slugify(this.title, { lower: true });
  let slug = baseSlug;
  let counter = 1;

  // Cek apakah slug sudah ada di DB
  while (await mongoose.models.Project.findOne({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;
  next();
});

// Hapus file ketika project dihapus
ProjectSchema.post('remove', function (doc) {
  if (doc.coverImage !== '/uploads/default.jpg') {
    fs.unlinkSync(path.join(__dirname, '../public', doc.coverImage));
  }
  doc.screenshots.forEach(screenshot => {
    fs.unlinkSync(path.join(__dirname, '../public', screenshot.url));
  });
});

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
