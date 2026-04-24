import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';
import { errorHandler } from './src/middleware/errorHandler.js';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import workspaceRoutes from './src/routes/workspaceRoutes.js';
import channelRoutes from './src/routes/channelRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import teamRoutes from './src/routes/teamRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import roleRoutes from './src/routes/roleRoutes.js';
import eventRoutes from './src/routes/eventRoutes.js';
import conversationRoutes from './src/routes/conversationRoutes.js';
import noteRoutes from './src/routes/noteRoutes.js';
import activityRoutes from './src/routes/activityRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import inviteRoutes from './src/routes/inviteRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import searchRoutes from './src/routes/searchRoutes.js';

import { handleSockets } from './src/sockets/socketHandler.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ===== API Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

// Backward compat: old routes without /api prefix
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
  res.json({
    message: 'Leedsphere API Running',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      teams: '/api/teams',
      channels: '/api/channels',
      messages: '/api/messages',
      conversations: '/api/conversations',
      notes: '/api/notes',
      activity: '/api/activity',
      notifications: '/api/notifications',
      workspaces: '/api/workspaces',
      projects: '/api/projects',
      tasks: '/api/tasks',
      roles: '/api/roles',
      events: '/api/events',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Attach Socket Handlers
handleSockets(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API docs at http://localhost:${PORT}/`);
});
