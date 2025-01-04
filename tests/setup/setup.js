import { beforeAll, afterEach, afterAll } from 'vitest';
import supertest from 'supertest';

import * as db from './database';
import configureApp from '../../src/api.js';
process.env.API_PREFIX = '';

const app = configureApp();

let server;
let request;

beforeAll(async () => {
  await db.connect();
  server = app.listen(0);
  request = supertest.agent(server);
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
  server.close();
});

export { request };
