import Patient from '../schemas/Patient.js';
import logger from '../config/logger.js';

export const register = async (req, res) => {
  try {
    const { name, surname, birthdate, dni, city, clinicHistoryId, username, password, email } = req.body;

    if (!name || !surname || !birthdate || !dni || !city || !clinicHistoryId || !username || !password || !email) {
      logger.error('Missing fields', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });
      return res.status(400).json({ message: 'Missing fields' });
    }
    const patient = new Patient({
      name,
      surname,
      birthdate,
      dni,
      city,
      clinicHistoryId,
      username,
      password,
      email,
      userId: req.user.userId
    });

    await patient.save();
    logger.info(`Patient ${patient._id} created successfully`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });
    res.status(201).json(patient);

  } catch (error) {
    logger.error('Error creating patient', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });
    res.status(500).json({ message: error.message });
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
