import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Patient from '../src/schemas/Patient.js';

const MONGO_URI = process.env.MONGOURL;

const connectToDatabase = async () => {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB successfully');
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error.message);
    });
};

const sample = [
  
  {
    _id: 'f8b8d3e7-4bb7-4d1b-99a4-e3a8f0452f63',
    name: 'John',
    surname: 'Doe',
    birthdate: '2000-05-15T00:00:00.000Z',
    dni: '50106073K',
    city: 'Sevilla',
    userId: '8d0f780c-45f6-423d-ad86-87ef69740da9'
  },
  {
    _id: 'a2c7f9d1-5b3a-42d8-8e5f-7c4b9f1e8a92',
    name: 'Ana',
    surname: 'López',
    birthdate: '1992-08-22T00:00:00.000Z',
    dni: '72590723D',
    city: 'Madrid',
    userId: '03ceec7e-6682-42be-b4ad-bcfe1baf73dc'
  },
  {
    _id: 'd4f8b1a9-3e7c-45d2-9c6a-2b9f7e4a8c53',
    name: 'Carlos',
    surname: 'Martínez',
    birthdate: '1985-03-10T00:00:00.000Z',
    dni: '16071962E',
    city: 'Barcelona',
    userId: '⁠307408c6-954c-4505-bb4b-74e713267b84'
  },
  {
    _id: 'b1a7f9e3-6c5d-49d2-8f4a-3b7e9f5a6c71',
    name: 'Lucía',
    surname: 'Fernández',
    birthdate: '1998-12-05T00:00:00.000Z',
    dni: '79546831C',
    city: 'Valencia',
    userId: '⁠f1c78f18-b62e-4b0f-80fa-1655be4cd80e'
  }
];

async function populatePatients() {
  try {
    for (const apptData of sample) {
      const pacientes = new Patient(apptData);
      await pacientes.save();
      console.log('Patient created successfully');
    }

    console.log('All sample Patients have been created');
  } catch (error) {
    console.error('Error populating Patients:', error);
  } finally {
    mongoose.disconnect();
  }
}

(async () => {
  await connectToDatabase();
  await populatePatients();
})();
