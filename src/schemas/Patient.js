import mongoose from 'mongoose';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

const patientSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
    validate: {
      validator: (v) => uuidValidate(v),
      message: (props) => `${props.value} is not a valid UUID`,
    },
  },
  name: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  birthdate: {  
    type: Date,
    required: true
  },
  dni: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        const dniRegex = /^[0-9]{8}[A-Z]$/;
        if (!dniRegex.test(v)) {
          return false;
        }
        const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
        const number = v.slice(0, 8);
        const letter = v.slice(8, 9);
        return letters[number % 23] === letter;
      },
      message: props => `${props.value} is not a valid DNI number!`
    }
  },
  city: {
    type: String,
    required: true
  },
  clinicHistoryId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
export default Patient;