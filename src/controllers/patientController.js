import Patient from '../schemas/Patient.js';
import logger from '../config/logger.js';
import axios from 'axios';
import CircuitBreaker from 'opossum';

const AUTH_SVC = process.env.AUTH_SVC || 'http://localhost:3001/api/v1';
const HISTORY_SVC = process.env.HISTORY_SVC || 'http://localhost:3005/api/v1';

const circuitOptions = {
  timeout: 5000, 
  errorThresholdPercentage: 50, 
  resetTimeout: 10000,
};

export const register = async (req, res) => {
  const createUserWithCircuitBreaker = new CircuitBreaker(createUser, circuitOptions);
  const createClinicHistoryWithCircuitBreaker = new CircuitBreaker(createClinicHistory, circuitOptions);

  createUserWithCircuitBreaker.on('open', () => console.error('Circuit Breaker OPEN for AUTH_SVC!'));
  createUserWithCircuitBreaker.on('close', () => console.info('Circuit Breaker CLOSED for AUTH_SVC!'));
  createClinicHistoryWithCircuitBreaker.on('open', () => console.error('Circuit Breaker OPEN for HISTORY_SVC!'));
  createClinicHistoryWithCircuitBreaker.on('close', () => console.info('Circuit Breaker CLOSED for HISTORY_SVC!'));

  let patientId = null;
  let userId = null;

  try {
    const { name, surname, birthdate, dni, city, password, email } = req.body;

    if (!name || !surname || !birthdate || !dni || !city || !password || !email) {
      logger.error('Missing fields', { method: req.method, url: req.originalUrl });
      return res.status(400).json({ message: 'Missing fields' });
    }

    const availableDNI = await checkAvailableDNI(dni);
    if (availableDNI) {
      logger.error('DNI already exists', { method: req.method, url: req.originalUrl });
      return res.status(400).json({ message: 'DNI already exists' });
    }

    userId ='Prueba';
    // Crear paciente en la base de datos local
    const patient = new Patient({ name, surname, birthdate, dni, city, userId });
    const newPatient = await patient.save();
    patientId = newPatient._id;

    // Crear usuario en AUTH_SVC
    userId = await createUserWithCircuitBreaker.fire(password, email,patientId, req.cookies.token);

    //actualizar el paciente con el userId
    await Patient.findByIdAndUpdate(patientId, { userId: userId });
    
    // Crear historial clínico en HISTORY_SVC
    await createClinicHistoryWithCircuitBreaker.fire(newPatient._id, req.cookies.token);

    logger.info(`Patient ${newPatient._id} created successfully`);
    res.status(201).json(newPatient);

  } catch (error) {
    logger.error('Error during registration', { message: error.message, service: error.serviceName });

    // Revertir creación del usuario si fue creado
    if (userId) {
      try {
        await deleteUser(userId, req.cookies.token);
        logger.info(`Rolled back user creation for userId: ${userId}`);
      } catch (rollbackError) {
        logger.error('Error rolling back user creation', { message: rollbackError.message });
      }
    }

    // Revertir creación del paciente si fue creado
    if (patientId) {
      try {
        await rollbackPatientCreation(patientId);
        logger.info(`Rolled back patient creation for patientId: ${patientId}`);
      } catch (rollbackError) {
        logger.error('Error rolling back patient creation', { message: rollbackError.message });
      }
    }

    if (error.message === 'Breaker is open') {
      res.status(503).json({
        message: 'Service temporarily unavailable',
        service: error.serviceName || 'Unknown',
      });
    } else if (error.isServiceUnavailable) {
      res.status(503).json({
        message: `Service unavailable: ${error.serviceName}`,
      });
    } else if (error.isClientError) {
      res.status(error.status).json({
        message: `Client error: ${error.message}`,
        service: error.serviceName || 'Unknown',
      });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};


const rollbackPatientCreation = async (patientId) => {
  try {
    const patient = await Patient.findByIdAndDelete(patientId);
    if (!patient) {
      throw new Error('Error when rolling back patient creation');
    }
    return patient;
  } catch (error) {
    throw new Error(error.message);
  }
};


export const createUser = async (password, email,patientId, token) => {
  try {
    const response = await axios.post(`${AUTH_SVC}/users`,
      {
        password,
        email,
        roles: ['patient'],
        patientid: patientId,
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
    return response.data._id;
  } catch (error){
    handleServiceError(error, 'AUTH_SVC');
  }
};


export const createClinicHistory = async (patientId, token) => {
  try {
    const clinicResponse = await axios.post(`${HISTORY_SVC}/histories`, {
      patientId: patientId
    }, {
      withCredentials: true, // Ensures cookies are sent along
      headers: {
        // Properly set the Cookie header for the request
        'Cookie': `token=${token}`,
        'Content-Type': 'application/json', // Ensure JSON content type
      },
    });
    return clinicResponse.data._id;
  } catch (error) {
    handleServiceError(error, 'HISTORY_SVC');
  }
};


const handleServiceError = (error, serviceName) => {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    const timeoutError = new Error(`Timeout error: ${serviceName}`);
    timeoutError.isServiceUnavailable = true;
    timeoutError.serviceName = serviceName;
    throw timeoutError;
  } else if (error.response) {
    const status = error.response.status;

    if (status >= 400 && status < 500) {
      // Errores del cliente (400, 404, etc.)
      const clientError = new Error(`Client error (${status}): ${serviceName}`);
      clientError.isClientError = true;
      clientError.status = status;
      clientError.serviceName = serviceName;
      throw clientError;
    } else if (status >= 500) {
      // Errores del servidor externo (500, 503, etc.)
      const serverError = new Error(`Service unavailable: ${serviceName}`);
      serverError.isServiceUnavailable = true;
      serverError.serviceName = serviceName;
      throw serverError;
    }
  } else if (error.request) {
    // Error de red (sin respuesta del servidor)
    const networkError = new Error(`Network error: ${serviceName}`);
    networkError.isServiceUnavailable = true;
    networkError.serviceName = serviceName;
    throw networkError;
  }

  // Otros errores no relacionados con la disponibilidad del servicio
  const unexpectedError = new Error(`Unexpected error in ${serviceName}: ${error.message}`);
  unexpectedError.serviceName = serviceName;
  throw unexpectedError;
};


const checkAvailableDNI = async (dni) => {
  const response = await Patient.find({ dni: dni });
  return response.length > 0;
}

const deleteUser = async (id, token) => {
  try {
    const response = await axios.delete(`${AUTH_SVC}/users/${id}`, {
      withCredentials: true,
      headers: {
        'Cookie': `token=${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.message;
  } catch (error) {
    let errorMessage = 'Error deleting user: ';
    if (error.response) {
      errorMessage += error.response.data.message;
    }
    throw new Error(errorMessage);
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

    const updatedPatient = await Patient.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });
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
    console.log(error.message);
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
