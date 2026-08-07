import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  getLeads, 
  createLead, 
  updateLead, 
  addTimelineEntry,
  convertLeadToCustomer,
  bulkCreateLeads,
  deleteLead
} from '../controllers/leadController';

const router = express.Router();

// Multer setup for memory storage (for bulk import)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Multer setup for disk storage (for PDFs)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `contract-${uniqueSuffix}${ext}`);
  },
});

const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.route('/')
  .get(getLeads)
  .post(createLead);

router.post('/bulk', upload.single('file'), bulkCreateLeads);

router.route('/:id')
  .put(updateLead)
  .delete(deleteLead);

router.route('/:id/timeline')
  .post(addTimelineEntry);

router.post('/:id/convert', uploadPdf.single('pdf'), convertLeadToCustomer);

export default router;
