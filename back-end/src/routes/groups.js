import { Router } from 'express';
import { createGroupHandler } from '../controllers/groupsController.js';

const router = Router();

router.post('/', createGroupHandler);

export default router;




