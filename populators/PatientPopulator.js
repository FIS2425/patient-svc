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

// Sample Patient data
const sample = [
  
  {
    _id: uuidv4(),
    name: 'Juan',
    surname: 'Pérez',
    birthdate: '1985-05-15T00:00:00.000Z',
    dni: '12345678Z',
    city: 'Madrid',
    userId: 'user001'
  }
];

async function populatePatients() {
  try {
    // Save each Patient
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

// Run the script
(async () => {
  await connectToDatabase();
  await populatePatients();
})();
