import Patient from '../schemas/Patient.js';
import axios from 'axios';

import logger from '../config/logger.js';

export const register = async (req, res) => {
  try {
    const { name, surname,birthdate, dni, city, clinicHistoryId, username, password, email} = req.body;
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
        // userId: authResponse.data._id
        userId: '18e373c7-092a-1720-a381-fd909g52153'
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