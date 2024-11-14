import express from 'express';
import {register,obtainAll,deletePatient, updatePatient,getPatientById} from '../controllers/patientController.js';

const router = express.Router();

router.post('/register', register);
router.get('/obtainAll', obtainAll);
router.delete('/deletePatient/:id', deletePatient);
router.put('/updatePatient/:id', updatePatient);
router.get('/getPatientById/:id', getPatientById);

export default router;