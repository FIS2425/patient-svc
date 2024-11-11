import Patient from '../schemas/Patient.js';
import axios from 'axios';

import logger from '../config/logger.js';

export const register = async (req, res) => {
  try {
    const { name, surname,birthdate, dni, city, clinicHistory, username, password, email} = req.body;
    try {

      const Patient = new Patient({
        name,
        surname,
        birthdate,
        dni,
        city, 
        clinicHistory, 
        username, 
        password, 
        email,
        // userId: authResponse.data._id
        userId: '18e373c7-092a-1720-a381-fd909g52153'
      });

      await Patient.save();
      logger.info(`Patient ${Patient._id} created`);
      res.status(201).json(Patient);

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


export const deletePatient = async (req, res) => {

  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      logger.error('Patient not found', {
        method: req.method,
        url: req.originalUrl
      });
      res.status(404).json({ message: 'Patient not found' });
    } else {
      try {
        await patient.deleteOne();
        logger.info(Patient ${patient._id} deleted from database);
        res.status(204).json({ message: 'Patient deleted' });
      } catch (error) {
        logger.error('Error deleting user', {
          method: req.method,
          url: req.originalUrl,
          error: error
        });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};