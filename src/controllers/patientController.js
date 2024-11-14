import Patient from '../schemas/Patient.js';
import axios from 'axios';

import logger from '../config/logger.js';

export const register = async (req, res) => {
  try {
    const { name, surname, birthdate, dni, city, clinicHistoryId, username, password, email } = req.body;

    // Check if any required field is missing
    if (!name || !surname || !birthdate || !dni || !city || !clinicHistoryId || !username || !password || !email) {
      return res.status(400).json({ message: "All fields are required." });
    }

    try {
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
        userId: '18e373c7-092a-1720-a381-fd909g52153' // Consider dynamically generating or validating this field
      });

      await patient.save();
      logger.info(`Patient ${patient._id} created`);
      res.status(201).json(patient);

    } catch (error) {
      logger.error('Invalid credentials', {
        method: req.method,
        url: req.originalUrl,
        error: error
      });

      res.status(400).json({ message: error.message });
    }

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


export const obtainAll = async (req, res) => {
  try {
    const patients = await Patient.find();
    res.status(200).json(patients);
  } catch (error) {
    logger.error('Error fetching patients', {
      method: req.method,
      url: req.originalUrl,
      error: error
    });
    res.status(500).json({ message: error.message });
  }
}

export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      logger.error('Patient not found', {
        method: req.method,
        url: req.originalUrl
      });
      return res.status(404).json({ message: 'Patient not found' });
    }

    try {
      await patient.deleteOne();
      logger.info(`Patient ${patient._id} deleted from database`);

      return res.status(204).send();
    } catch (error) {
      logger.error('Error deleting patient', {
        method: req.method,
        url: req.originalUrl,
        error: error
      });
      return res.status(500).json({ message: 'Error deleting patient' });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, surname, birthdate, dni, city, clinicHistory, username, password, email } = req.body;
    const patient = await Patient.findById(id);
    
    if (!patient) {
      logger.error('Patient not found', {
        method: req.method,
        url: req.originalUrl,
        patientId: id,
      });
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (name && typeof name !== 'string') {
      return res.status(400).json({ message: 'Invalid name format' });
    }

    if (surname && typeof surname !== 'string') {
      return res.status(400).json({ message: 'Invalid surname format' });
    }

    if (birthdate && isNaN(Date.parse(birthdate))) {
      return res.status(400).json({ message: 'Invalid birthdate format' });
    }

    if (dni) {
      const dniRegex = /^[0-9]{8}[A-Z]$/;
      if (!dniRegex.test(dni)) {
        return res.status(400).json({ message: `${dni} is not a valid DNI number!` });
      }
      const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
      const number = parseInt(dni.slice(0, 8), 10);
      const letter = dni.slice(8, 9);
      if (letters[number % 23] !== letter) {
        return res.status(400).json({ message: `${dni} is not a valid DNI number!` });
      }
    }

    if (city && typeof city !== 'string') {
      return res.status(400).json({ message: 'Invalid city format' });
    }

    patient.name = name || patient.name;
    patient.surname = surname || patient.surname;
    patient.birthdate = birthdate || patient.birthdate;
    patient.dni = dni || patient.dni;
    patient.city = city || patient.city;

    await patient.save();

    logger.info(`Patient ${patient._id} updated successfully`, {
      method: req.method,
      url: req.originalUrl,
    });

    res.status(200).json(patient);

  } catch (error) {
    logger.error('Error updating patient', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
}

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id); 

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    logger.info(`Patient ${patient._id} retrieved`);
    res.status(200).json(patient);

  } catch (error) {
    logger.error('Error retrieving patient', {
      method: req.method,
      url: req.originalUrl,
      error: error
    });

    res.status(500).json({ message: 'An error occurred while retrieving the patient' });
  }
};
