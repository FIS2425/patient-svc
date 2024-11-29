import express from 'express';
import {register,obtainAll,deletePatient, updatePatient,getPatientById} from '../controllers/patientController.js';

const router = express.Router();

router.post('/', register);
router.get('/', obtainAll);
router.delete('/:id', deletePatient);
router.put('/:id', updatePatient);
router.get('/:id', getPatientById);

export default router;