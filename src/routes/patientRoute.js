import express from 'express';
import {register,obtainAll,deletePatient, updatePatient,getPatientById} from '../controllers/patientController.js';
import { verifyAuth } from '../middleware/verifyAuth.js';
import { verifyAdmin } from '../middleware/verifyAdmin.js';

const router = express.Router();

router.post('/',verifyAuth,verifyAdmin,register);
router.get('/', obtainAll);
router.delete('/:id', verifyAuth, verifyAdmin,deletePatient);
router.put('/:id',updatePatient);
router.get('/:id', getPatientById);

export default router;