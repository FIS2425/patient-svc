import express from 'express';
import {register,obtainAll,deletePatient, updatePatient,getPatientById} from '../controllers/patientController.js';

import { verifyAuth } from '../middleware/verifyAuth.js';
import { verifyAdmin } from '../middleware/verifyAdmin.js';

const router = express.Router();

router.post('/register', verifyAuth, verifyAdmin,register);
router.get('/obtainAll', verifyAuth, verifyAdmin,obtainAll);
router.delete('/deletePatient/:id', verifyAuth, verifyAdmin,deletePatient);
router.put('/updatePatient/:id', verifyAuth, verifyAdmin,updatePatient);
router.get('/getPatientById/:id', verifyAuth, verifyAdmin,getPatientById);

export default router;