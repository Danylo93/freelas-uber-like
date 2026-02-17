import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SocketProvider } from '../src/contexts/SocketContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SocketProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </SocketProvider>
    </AuthProvider>
  );
}
