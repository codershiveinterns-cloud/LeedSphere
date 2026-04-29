import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { protect } from './src/middleware/auth.js';

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
import inviteTokenRoutes from './src/routes/inviteTokenRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import searchRoutes from './src/routes/searchRoutes.js';
import { getMyWorkspaces } from './src/controllers/workspaceController.js';

import { handleSockets } from './src/sockets/socketHandler.js';
import { setIO } from './src/sockets/io.js';
import { startReminderCrons } from './src/services/reminderCron.js';

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);

/**
 * CORS allowlist for both Express and Socket.IO.
 *
 * Production note: `origin: true` (the previous setting) reflected any
 * caller's Origin header — convenient, but it makes signaling cross-origin
 * issues harder to debug because rejected requests look identical to
 * unrelated failures. We pin to an explicit list and let CORS_ORIGIN extend
 * it via env var without a code change.
 */
const STATIC_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://leed-sphere.vercel.app',
  'https://leedsphere.com',
  'https://www.leedsphere.com',
];
const ENV_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...STATIC_ORIGINS, ...ENV_ORIGINS])];

const corsOptions = {
  origin: (origin, cb) => {
    // Same-origin / curl requests have no Origin header — let them through.
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // Allow any *.vercel.app preview by default; useful while iterating.
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

const io = new Server(httpServer, {
  // Explicit path so client + server agree even if defaults change in a
  // future Socket.IO release. Must match the client's `path` option.
  path: '/socket.io',
  cors: corsOptions,
  // Order matters in some proxy setups: polling first so the handshake
  // succeeds even when websockets are blocked, then upgrade to ws. This
  // is also what the Socket.IO client is now configured to expect.
  transports: ['polling', 'websocket'],
});

// Express CORS — same allowlist as Socket.IO so REST and signaling agree.
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ===== API Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.get('/api/my-workspaces', protect, getMyWorkspaces);
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
app.use('/api/invites', inviteRoutes);            // legacy: authenticated team-mgmt invites
app.use('/api/invite',  inviteTokenRoutes);       // new:    token-based magic-link flow
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
      myWorkspaces: '/api/my-workspaces',
      projects: '/api/projects',
      tasks: '/api/tasks',
      roles: '/api/roles',
      events: '/api/events',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Attach Socket Handlers + expose io to controllers (taskController etc.)
setIO(io);
handleSockets(io);

// Background notifications: due-soon tasks, upcoming calendar events.
// Safe to start unconditionally — internal interval; no external deps.
startReminderCrons();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API docs at http://localhost:${PORT}/`);
});
