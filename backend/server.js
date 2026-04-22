import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';
import workspaceRoutes from './src/routes/workspaceRoutes.js';
import channelRoutes from './src/routes/channelRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import teamRoutes from './src/routes/teamRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import roleRoutes from './src/routes/roleRoutes.js';
import eventRoutes from './src/routes/eventRoutes.js';
import { handleSockets } from './src/sockets/socketHandler.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.use('/workspaces', workspaceRoutes);
app.use('/channels', channelRoutes);
app.use('/messages', messageRoutes);
app.use('/teams', teamRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/roles', roleRoutes);
app.use('/events', eventRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('API Running');
});

// Attach Socket Handlers
handleSockets(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
