import Patient from '../schemas/Patient.js';
import logger from '../config/logger.js';
import axios from 'axios';

const AUTH_SVC = 'http://127.0.0.1:3001/api/v1';
const CLINIC_SVC = 'http://history-svc:3005/api/v1';

export const register = async (req, res) => {
  try {
    console.log("Paso 1: Inicia proceso de creación");

    // Destructurando los datos del cuerpo de la solicitud
    const { name, surname, birthdate, dni, city, clinicHistoryId, username, password, email } = req.body;

    // Validación de campos requeridos
    if (!name || !surname || !birthdate || !dni || !city || !clinicHistoryId || !username || !password || !email) {
      logger.error('Missing fields', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers?.['x-forwarded-for'] || req.ip,
        requestId: req.headers?.['x-request-id'] || null,
      });
      return res.status(400).json({ message: 'Missing fields' });
    }

    console.log("Paso 2: Validación de campos completada");

    // Creación del paciente
    const patient = new Patient({
      name,
      surname,
      birthdate,
      dni,
      city,
      clinicHistoryId,
      username,
      password,
      email
    });

    console.log("Paso 3: Paciente creado localmente");

    const userId = await createUser(username, password, email, req.cookies.token); 
    console.log(userId);
    patient.userId = userId;

    // Guardar el paciente en la base de datos
    await patient.save();
    logger.info(`Patient ${patient._id} created successfully`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.headers?.['x-forwarded-for'] || req.ip,
      requestId: req.headers?.['x-request-id'] || null,
    });

    res.status(201).json(patient);

  } catch (error) {
    console.log(JSON.stringify(error));
    // Manejo de errores generales
    logger.error('Error creating patient', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      ip: req.headers?.['x-forwarded-for'] || req.ip,
      requestId: req.headers?.['x-request-id'] || null,
    });
    if (error.message === 'Error creating user') {
      res.status(400).json({ message: 'Error creating user' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

}

const createUser = async (username, password, email, token) => {
  try {
    const response = await axios.post(`${AUTH_SVC}/users`, 
      {
        username,
        password,
        email,
        roles: ["patient"],
      },
      {
        withCredentials: true, // Ensures cookies are sent along
        headers: {
          // Properly set the Cookie header for the request
          'Cookie': `token=${token}`,
          'Content-Type': 'application/json', // Ensure JSON content type
        },
      }
    );
    console.log(response.data);
    return response.data._id;
  } catch (error) {
    console.error('Error creating user:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw new Error('Error creating user');
  }
};



export const obtainAll = async (req, res) => {
  try {
    const patients = await Patient.find();
    logger.debug('Patients retrieved successfully', {
      method: req.method,
      url: req.originalUrl,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });
    res.status(200).json(patients);
  } catch (error) {
    logger.error('Error retrieving patients', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });
    res.status(500).json({ message: error.message });
  }
}



export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByIdAndDelete(id);
    if (!patient) {
      logger.error('Patient not found', {
        method: req.method,
        url: req.originalUrl,
        patientId: id,
        ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });
      return res.status(404).json({ message: 'Patient not found' });
    }
    logger.info(`Patient ${patient._id} deleted successfully`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });
    res.status(200).json(patient);
  } catch (error) {
    logger.error('Error deleting patient', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });
    res.status(500).json({ message: error.message });
  }
}

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    if (!id) {
      logger.error('Missing patient ID', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });
      return res.status(400).json({ message: 'Missing patient ID' });
    }

    const updatedPatient = await Patient.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updatedPatient) {
      logger.error('Patient not found', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });
      return res.status(404).json({ message: 'Patient not found' });
    }
    logger.info(`Patient ${updatedPatient._id} updated`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      patientId: updatedPatient._id,
    });
    res.status(200).json(updatedPatient);
  } catch (error) {
    logger.error('Error updating patient', {
      method: req.method,
      url: req.originalUrl,
      error: error,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null
    });
    res.status(500).json({ message: error.message });
  }
}

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      logger.error('Patient not found', {
        method: req.method,
        url: req.originalUrl,
        patientId: id,
        ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });
      return res.status(404).json({ message: 'Patient not found' });
    }
    logger.debug('Patient retrieved successfully', {
      method: req.method,
      url: req.originalUrl,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      patientId: patient._id,
    });
    res.status(200).json(patient);
  } catch (error) {
    logger.error('Error retrieving patient', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });
    res.status(500).json({ message: error.message });
  }
}
