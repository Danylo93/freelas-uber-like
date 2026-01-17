import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:8015' : 'http://localhost:8015');

let socket: Socket | null = null;

export const connectSocket = async () => {
    const token = await SecureStore.getItemAsync('auth_token');

    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
        auth: {
            token: token
        },
        transports: ['websocket'],
        autoConnect: true,
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
