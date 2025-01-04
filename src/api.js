import express from 'express';
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import cookieParser from 'cookie-parser';
import patientRoute from './routes/patientRoute.js';
// import { verifyAuth } from './middlewares/auth.js';

const swaggerDocument = YAML.load('./openapi.yaml');

export default function () {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/', (req, res) => {
    res.send('API working correctly');
  });

  app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
  app.use(`${process.env.API_PREFIX || ''}/patients`, patientRoute);

  // Uncomment this line to protect the /patients routes
  // app.use(`${process.env.API_PREFIX || ''}/patients`, verifyAuth, patientRoute);

  return app;
}
