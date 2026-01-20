import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import AuthScreen from './auth/index';
import ClientHome from './client/index';
import ProviderHome from './provider/index';

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Animações da splash
  const scaleAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Se não está carregando e já temos dados de auth, esconder splash
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000); // 2 segundos de splash

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    // Animação da splash screen (simplificada)
    if (showSplash) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSplash]);

  const SplashScreen = () => {
    return (
      <View style={styles.splashContainer}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name="construct" size={80} color="#007AFF" />
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.appName}>ServiçoApp</Text>
          <Text style={styles.tagline}>🔧 Conectando você aos melhores profissionais</Text>
        </Animated.View>
      </View>
    );
  };

  // Mostrar splash screen enquanto está carregando ou durante animação
  if (isLoading || showSplash) {
    console.log('🔄 [INDEX] Mostrando splash screen');
    return <SplashScreen />;
  }

  if (!isAuthenticated || !user) {
    console.log('❌ [INDEX] Usuário não autenticado, mostrando AuthScreen');
    return <AuthScreen />;
  }

  console.log('✅ [INDEX] Usuário autenticado:', user.name, 'Tipo:', user.user_type);

  // Redirect based on user type
  if (user.user_type === 1) {
    console.log('👷 [INDEX] Redirecionando para ProviderHome');
    return <ProviderHome />;
  } else if (user.user_type === 2) {
    console.log('👤 [INDEX] Redirecionando para ClientHome');
    return <ClientHome />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Erro: Tipo de usuário inválido</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    backgroundColor: '#E3F2FD',
    borderRadius: 60,
    marginBottom: 40,
    elevation: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  loadingDots: {
    position: 'absolute',
    bottom: 100,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
});