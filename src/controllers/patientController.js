import Patient from '../schemas/Patient.js';
import logger from '../config/logger.js';
import axios from 'axios';

const AUTH_SVC = 'http://authorization-svc:3001/api/v1';
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

    try {
      console.log("Paso 3.1: Inicia proceso de creación de usuario en servicio de autenticación");
      // Llamada al servicio de autenticación para crear usuario
      const authResponse = await axios.post(`${AUTH_SVC}/users`, {
        password,
        email,
        roles: ['patient']
      }, {
        withCredentials: true,
        headers: {
          Cookie: `token=${req.cookies?.token}`
        }
      });
      console.log(authResponse);
      // Asignar el ID del usuario creado al paciente
      patient.userId = authResponse.data._id;

      console.log("Paso 3.2: Usuario creado en servicio de autenticación:", authResponse.data);

    } catch (error) {
      // Manejo de errores al crear usuario
      logger.error('Could not create user in authentication service', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers?.['x-forwarded-for'] || req.ip,
        error: error.message,
        responseData: error.response?.data,
      });
      return res.status(400).json({
        message: 'Failed to create user in authentication service',
        error: error.response?.data || error.message,
      });
    }

    console.log("Paso 5: Paciente guardado en base de datos");
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
    // Manejo de errores generales
    logger.error('Error creating patient', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      ip: req.headers?.['x-forwarded-for'] || req.ip,
      requestId: req.headers?.['x-request-id'] || null,
    });
    res.status(500).json({ message: 'Internal server error' });
  }

}


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
