import dotenv from 'dotenv';
import http from 'http';
import { createApp } from './server.js';

dotenv.config();

const port = process.env.PORT || 4000;
const app = createApp();
const server = http.createServer(app);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Habita backend listening on http://localhost:${port}`);
});

export default server;




