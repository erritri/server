const Project = require('../models/Project');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { Types } = require('mongoose');

// ==============================================
//  HELPER FUNCTIONS
// ==============================================

const validateProjectData = (data) => {
  const errors = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Judul proyek minimal 3 karakter');
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('Deskripsi proyek minimal 10 karakter');
  }

  if (!data.technologies?.length) {
    errors.push('Pilih minimal 1 teknologi');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
};

const deleteImageFile = async (imagePath) => {
  if (!imagePath || imagePath === '/uploads/default.jpg') return;

  try {
    const filename = path.basename(imagePath);
    const filePath = path.join(__dirname, '../public/uploads', filename);
    await fs.unlink(filePath);
    logger.info(`Deleted image file: ${filename}`);
  } catch (err) {
    logger.error(`Failed to delete image: ${err.message}`);
  }
};

// ==============================================
//  CONTROLLER METHODS
// ==============================================

/**
 * @desc    Get all projects (public access)
 * @route   GET /api/projects
 */
exports.getAllProjects = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10, sort = '-createdAt' } = req.query;

  const filter = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Project.countDocuments(filter)
  ]);

  res.json({
    success: true,
    count: projects.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
    data: projects
  });
});

/**
 * @desc    Get single project (public access)
 * @route   GET /api/projects/:slug
 */
exports.getProjectBySlug = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne({ slug: req.params.slug });

  if (!project) {
    return next(new NotFoundError('Project tidak ditemukan'));
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

/**
 * @desc    Create new project (admin only)
 * @route   POST /api/projects
 */
exports.createProject = asyncHandler(async (req, res) => {
  // Pastikan technologies bisa diparse
  if (typeof req.body.technologies === 'string') {
    try {
      req.body.technologies = JSON.parse(req.body.technologies);
    } catch (err) {
      throw new ValidationError('Format technologies tidak valid');
    }
  }

  // Validasi input
  validateProjectData(req.body);

  // Buat project baru
  const project = new Project({
    title: req.body.title,
    description: req.body.description,
    technologies: req.body.technologies,
    createdBy: req.user.id,
    coverImage: req.file ? `/uploads/${req.file.filename}` : '/uploads/default.jpg'
  });

  // Simpan agar pre('save') (slug) berjalan
  await project.save();

  logger.info(`Project created by ${req.user.id}`, { projectId: project._id });

  res.status(201).json({ success: true, data: project });
});

/**
 * @desc    Update project (admin only)
 * @route   PUT /api/projects/:id
 */
exports.updateProject = asyncHandler(async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new ValidationError('ID tidak valid');
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new NotFoundError('Project tidak ditemukan');
  }

  // Parse technologies if string
  if (typeof req.body.technologies === 'string') {
    req.body.technologies = JSON.parse(req.body.technologies);
  }

  const updates = { ...req.body };

  // Handle file upload
  if (req.file) {
    updates.coverImage = `/uploads/${req.file.filename}`;
    await deleteImageFile(project.coverImage);
  }

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  res.json({ success: true, data: updatedProject });
});

/**
 * @desc    Delete project (admin only)
 * @route   DELETE /api/projects/:id
 */
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new NotFoundError('Project tidak ditemukan');
  }

  await project.deleteOne();
  await deleteImageFile(project.coverImage);

  logger.warn(`Project deleted by ${req.user.id}`, { projectId: req.params.id });

  res.json({
    success: true,
    message: 'Project berhasil dihapus'
  });
});
