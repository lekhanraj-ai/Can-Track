// userDetails route removed — kept as a harmless stub to avoid accidental imports
import express from 'express';
const router = express.Router();

router.use((req, res) => {
  res.status(410).json({ error: 'User details API removed' });
});

export default router;