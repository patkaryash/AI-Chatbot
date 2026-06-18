import  'dotenv/config';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

import http from 'http';
import app from './app.js';
import { initSocket } from './services/socket.service.js';

const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = initSocket(server);

app.set('io', io);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
