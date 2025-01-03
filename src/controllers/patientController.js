import Patient from '../schemas/Patient.js';
import logger from '../config/logger.js';
import axios from 'axios';

const AUTH_SVC = process.env.AUTH_SVC || 'http://localhost:3001/api/v1';
const HISTORY_SVC = process.env.HISTORY_SVC || 'http://localhost:3005/api/v1';
export const register = async (req, res) => {
  let createdPatient = null; // Para rastrear si el paciente fue creado
  let userId = null; // Para rastrear si el usuario fue creado

  try {
    const { name, surname, birthdate, dni, city, username, password, email } = req.body;

    // Validación de campos requeridos
    if (!name || !surname || !birthdate || !dni || !city || !username || !password || !email) {
      logger.error('Missing fields', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers?.['x-forwarded-for'] || req.ip,
        requestId: req.headers?.['x-request-id'] || null,
      });
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Verificar si el DNI ya existe
    const availableDNI = await checkAvailableDNI(dni);
    if (availableDNI) {
      logger.error('DNI already exists', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers?.['x-forwarded-for'] || req.ip,
        requestId: req.headers?.['x-request-id'] || null,
      });
      return res.status(400).json({ message: 'DNI already exists' });
    }

    // Crear el usuario asociado
    userId = await createUser(username, password, email, req.cookies.token);

    // Crear el paciente
    const patient = new Patient({
      name,
      surname,
      birthdate,
      dni,
      city,
      username,
      password,
      email,
      userId,
    });
    createdPatient = await patient.save();

    // Crear historial clínico
    await createClinicHistory(createdPatient._id, req.cookies.token);

    logger.info(`Patient ${createdPatient._id} created successfully`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.headers?.['x-forwarded-for'] || req.ip,
      requestId: req.headers?.['x-request-id'] || null,
    });

    res.status(201).json(createdPatient);
  } catch (error) {
    // Rollback manual
    try {
      if (createdPatient) {
        // Si el paciente fue creado, eliminarlo
        console.log('Paciente eliminado');
        await Patient.findByIdAndDelete(createdPatient._id);
      }
      if (userId) {
        // Si el usuario fue creado, eliminarlo
        console.log('Usuario eliminado');
        await deleteUser(userId, req.cookies.token);
      }
    } catch (rollbackError) {
      logger.error('Error during rollback', {
        method: req.method,
        url: req.originalUrl,
        error: rollbackError.message,
        ip: req.headers?.['x-forwarded-for'] || req.ip,
        requestId: req.headers?.['x-request-id'] || null,
      });
    }
    logger.error('Error creating patient', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      ip: req.headers?.['x-forwarded-for'] || req.ip,
      requestId: req.headers?.['x-request-id'] || null,
    });

    if (error.message.includes('Error creating user')) {
      res.status(400).json({ message: error.message });
    } else if (error.message.includes('Error creating clinic History')) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};


const createUser = async (username, password, email, token) => {
  try {
    const response = await axios.post(`${AUTH_SVC}/users`,
      {
        username,
        password,
        email,
        roles: ['patient'],
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
  } catch (error) {
    let errorMessage = 'Error creating user: ';
    if (error.response) {
      errorMessage += error.response.data.message;
    }
    throw new Error(errorMessage);
  }
};

const createClinicHistory = async (patientId, token) => {
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
    let errorMessage = 'Error creating clinic History: ';
    if (error.response) {
      errorMessage += error.response.data.message;
    }
    throw new Error(errorMessage);
  }

}

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
