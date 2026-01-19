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
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="client" />
          <Stack.Screen name="provider" />
          <Stack.Screen name="profile" />
        </Stack>
      </SocketProvider>
    </AuthProvider>
  );
}