import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import { CONFIG } from '../config';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('ðŸš€ [SOCKET] SocketProvider inicializado');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token, logout } = useAuth();

  console.log('ðŸ” [SOCKET] Estado atual:', { user: user?.name, token: !!token, isConnected });

  useEffect(() => {
    if (user && token) {
      console.log('ðŸ”Œ [SOCKET] Iniciando conexÃ£o Socket.io...');
      console.log('ðŸ”Œ [SOCKET] User:', user.name, 'Type:', user.user_type);

      try {
        // Socket.io conecta no mesmo servidor da API
        const socketUrl = CONFIG.SOCKET_URL || CONFIG.API_URL;
        console.log('ðŸ”Œ [SOCKET] Conectando em:', socketUrl);

        if (!socketUrl) {
          throw new Error('SOCKET_URL nao esta configurado');
        }

        const normalizedToken = String(token).replace(/^Bearer\s+/i, '').trim();
        if (!normalizedToken) {
          throw new Error('Token invalido para Socket.io');
        }

        const newSocket = io(socketUrl, {
          auth: {
            token: normalizedToken,
          },
          transports: ['websocket'], // Use websocket for better stability on mobile
          path: '/socket.io',
          forceNew: true,
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
          console.log('âœ… [SOCKET] Conectado com ID:', newSocket.id);
          setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('âŒ [SOCKET] Desconectado. Motivo:', reason);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('âŒ [SOCKET] Erro de conexÃ£o:', error.message);
          console.error('âŒ [SOCKET] Detalhes do erro:', error);
          setIsConnected(false);
          if (error?.message?.includes('Authentication error')) {
            void logout();
          }
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('ðŸ”„ [SOCKET] Reconectado apÃ³s', attemptNumber, 'tentativas');
          setIsConnected(true);
        });

        newSocket.on('reconnect_error', (error) => {
          console.error('âŒ [SOCKET] Erro de reconexÃ£o:', error.message);
        });

        newSocket.on('reconnect_failed', () => {
          console.error('âŒ [SOCKET] Falha na reconexÃ£o apÃ³s todas as tentativas');
          setIsConnected(false);
        });

        // Event listeners alinhados com o backend atual
        newSocket.on('request_offer', (data) => {
          console.log('[SOCKET] request_offer:', data);
          if (user.user_type === 1) { // Provider
            Alert.alert(
              'Nova solicitacao!',
              `Cliente: ${data.client_name || ''}\nServico: ${data.category || ''}\nValor: R$ ${data.price || ''}`,
              [{ text: 'OK' }]
            );
          }
        });

        newSocket.on('job_accepted', (data) => {
          console.log('[SOCKET] job_accepted:', data);
          if (user.user_type === 2) { // Customer
            Alert.alert(
              'Solicitacao aceita!',
              'Um prestador aceitou seu servico.',
              [{ text: 'OK' }]
            );
          }
        });

        newSocket.on('job_status_update', (data) => {
          console.log('[SOCKET] job_status_update:', data);
        });

        newSocket.on('location_update', (data) => {
          console.log('[SOCKET] location_update:', data);
        });

        setSocket(newSocket);

        return () => {
          console.log('ðŸ”Œ [SOCKET] Limpando conexÃ£o...');
          newSocket.disconnect();
          setSocket(null);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('âŒ [SOCKET] Erro ao criar Socket.io:', error);
        setIsConnected(false);
      }
    } else {
      console.log('â³ [SOCKET] Aguardando autenticaÃ§Ã£o...');
    }
  }, [user, token]);

  const sendMessage = (event: string, data: any) => {
    if (socket && isConnected) {
      console.log(`ðŸ“¤ [SOCKET] Enviando ${event}:`, data);
      socket.emit(event, data);
    } else {
      console.warn('âš ï¸ [SOCKET] NÃ£o conectado. NÃ£o foi possÃ­vel enviar:', event);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};





