import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setAuthenticated, setOnboardingCompleted, setLoading } from '../store/authSlice';
import { OnboardingScreen } from '../../features/onboarding/screens/OnboardingScreen';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Simulate checking auth status
    // В реальном приложении здесь была бы проверка AsyncStorage или токенов
    setTimeout(() => {
      // Для тестирования: запускаем онбординг
      dispatch(setAuthenticated(false));
      dispatch(setOnboardingCompleted(false)); // ВКЛЮЧАЕМ онбординг!
      dispatch(setLoading(false));
    }, 1000);
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Здесь можно добавить splash screen */}
      </View>
    );
  }

  // Если не завершен онбординг - показываем OnboardingScreen
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  // После онбординга показываем главное приложение
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
