import express from 'express';
import { register,obtainAll,deletePatient} from '../controllers/patientController.js';

const router = express.Router();

router.post('/register', register);
router.get('/obtainAll', obtainAll);
router.delete('/deletePatient/:id', deletePatient);

export default router;