import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createWorkLog, getWorkLogsByTask, getWorkLogsByProject, deleteWorkLog } from '../controllers/workLogController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer: disk storage with unique timestamped filenames
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Only accept image files
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPG, JPEG, PNG, WEBP, GIF)'));
  }
};

// No limit on number of images; 10MB per file
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// All routes require authentication
router.use(protect);

router.post('/', upload.array('images'), createWorkLog);
router.get('/task/:taskId', getWorkLogsByTask);
router.get('/project/:projectId', getWorkLogsByProject);
router.delete('/:id', adminOnly, deleteWorkLog);

export default router;
