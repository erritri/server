const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAllProjects,
  getProjectBySlug,      // ✅ ganti nama biar jelas
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

// Public
router.get('/', getAllProjects);
router.get('/slug/:slug', getProjectBySlug); // ✅ slug route aman

// Protected (admin only)
router.use(protect);
router.use(authorize('admin'));

router.post('/', upload.single('coverImage'), createProject);
router.put('/:id', upload.single('coverImage'), updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
