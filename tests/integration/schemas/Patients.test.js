import { describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import Patient from '../../../src/schemas/Patient.js';
import * as db from '../../setup/database';
import { request } from '../../setup/setup';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

describe('PATIENTS VALIDATION TEST', () => {
  describe('DNI is invalid number', () => {
    it('shouldn t create the patient', async () => {

      const newPatient = new Patient({
         name: 'Mark',
         surname: 'Johnson',
         birthdate: '1980-03-03',
         dni: 'INVALID',
         city: 'Madrid',
         username: 'markjohnson',
         password: 'password123',
         email: 'markjohnson@example.com',
         userId: '18e373c7-092a-1720-a381-fd909g52153'
       });
      await expect(newPatient.save()).rejects.toThrowError('Patient validation failed: dni: INVALID is not a valid DNI number!');
    });
  });
});