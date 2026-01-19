import { io, Socket } from 'socket.io-client';
import { CONFIG } from '../config';

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  if (socket) return socket;

  socket = io(CONFIG.SOCKET_URL, {
    auth: { token },
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  return socket;
};

export const getSocket = () => socket;
