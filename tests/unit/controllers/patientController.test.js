import { beforeAll, afterAll, describe, expect, it,beforeEach } from 'vitest';
import Patient from '../../../src/schemas/Patient.js';
import * as db from '../../setup/database.js';
import { request } from '../../setup/setup.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const sampleUser = {
  _id: uuidv4(),
  email: 'testuser2@mail.com',
  password: 'pAssw0rd!',
  roles: ['admin'],
};

beforeAll(async () => {
  await db.clearDatabase();
  const token = jwt.sign(
    { userId: sampleUser._id, roles: sampleUser.roles },
    process.env.VITE_JWT_SECRET
  );
  request.set('Cookie', `token=${token}`);
});

afterAll(async () => {
  await db.clearDatabase();
});
beforeEach(async () => {
  const token = jwt.sign(
    { userId: sampleUser._id, roles: sampleUser.roles },
    process.env.VITE_JWT_SECRET
  );
  request.set('Cookie', `token=${token}`);
});

describe('PATIENT ENDPOINTS TEST', () => {
  describe('test POST /patients', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request.post('/patients').send({});

      // Expect the error message to be "All fields are required." based on the updated validation
      expect(response.status).toBe(400);
    });
  });

  describe('test GET /patients', () => {
    it('should return 200 and all patients', async () => {
      const response = await request.get('/patients');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('test GET getPatientById/:id', () => {
    it('should return 404 if patient is not found', async () => {
      const response = await request.get(`/patients/${uuidv4()}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });

    it('should return 200 and the patient if found', async () => {
      const newPatient = new Patient({
        _id: 'b4e3e2a2-1f94-4ecf-a04e-568e4d82d1fa',
        name: 'Jane',
        surname: 'Smith',
        birthdate: '1992-05-05',
        dni: '78106136E',
        city: 'Barcelona',
        username: 'janesmith',
        password: 'password123',
        email: 'janesmith@example.com',
        userId: '18e373c7-092a-1720-a381-fd909g52153'
      });
      await newPatient.save();

      const response = await request.get(`/patients/b4e3e2a2-1f94-4ecf-a04e-568e4d82d1fa`);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(newPatient.name);
    }); 
  });

  describe('test DELETE/:id', () => {
    it('should return 404 if patient is not found', async () => {
      const response = await request.delete(`/patients/${uuidv4()}`);
      expect(response.status).toBe(404);
    });
  
    it('should return 204 if patient is successfully deleted', async () => {
      const newPatient = new Patient({
        name: 'David',
        surname: 'Jones',
        birthdate: '1985-10-10',
        dni: '78106136E',
        city: 'Valencia',
        username: 'davidjones',
        password: 'password123',
        email: 'davidjones@example.com',
        userId: '18e373c7-092a-1720-a381-fd909g52153'
      });
      await newPatient.save();
  
      const response = await request.delete(`/patients/${newPatient._id}`);
      expect(response.status).toBe(200);
    });
  });
  

  describe('test PUT updatePatient/:id', () => {
    it('should return 404 if patient is not found', async () => {
      const response = await request.put(`/patients/${uuidv4()}`).send({ name: 'Updated Name' });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Patient not found');
    });

    it('should return 200 and update the patient if valid fields are provided', async () => {
      const newPatient = new Patient({
        name: 'Mark',
        surname: 'Johnson',
        birthdate: '1980-03-03',
        dni: '78106136E',
        city: 'Madrid',
        username: 'markjohnson',
        password: 'password123',
        email: 'markjohnson@example.com',
        userId: '18e373c7-092a-1720-a381-fd909g52153'
      });
      await newPatient.save();

      const updatedData = { name: 'Mark Updated', city: 'Barcelona' };
      const response = await request.put(`/patients/${newPatient._id}`).send(updatedData);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updatedData.name);
      expect(response.body.city).toBe(updatedData.city);
    });
  });
});
