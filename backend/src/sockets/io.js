/**
 * Tiny holder for the Socket.IO server instance.
 *
 * Why this exists: REST controllers (taskController, eventController, …)
 * need to push real-time notifications, but they can't import server.js
 * without creating a circular dependency. The server calls setIO(io) once
 * at boot, and controllers call getIO() whenever they need to emit.
 *
 * Returns null until the server has booted — every caller treats that as
 * "skip the realtime push, but the DB write should still succeed".
 */
let _io = null;

export const setIO = (io) => { _io = io; };
export const getIO = () => _io;
