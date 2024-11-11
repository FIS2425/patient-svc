import express from 'express';
import { register, deletePatient } from '../controllers/patientController.js';

const router = express.Router();

router.post('/register', register);
router.delete('/deletePatient/:id', deletePatient);

export default router;