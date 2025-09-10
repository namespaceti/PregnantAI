
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Animated,
  TextInput,
  Alert,
  Dimensions,
  ScrollView,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { setOnboardingCompleted } from '../../../shared/store/authSlice';
import { updateUserPhysicalData } from '../../../shared/store/pregnancySlice';

const { width, height } = Dimensions.get('window');

interface OnboardingData {
  name?: string;
  week?: number;
  trimester?: number;
  day?: number;
  dueDate?: string;
  isFirstPregnancy?: boolean;
  interests: string[];
  height?: number; // см - рост
  prePregnancyWeight?: number; // кг - вес до беременности
  weightMethod?: 'remember' | 'current'; // Помню вес ДО vs Знаю только сейчас
  currentWeight?: number; // кг - текущий вес (если выбран weightMethod: 'current')
}

// Вставить перед компонентом OnboardingScreen:
const OnboardingCard = ({
  image,
  step,
  totalSteps,
  title,
  onSkip,
  progressAnim,
  children
}: {
  image: ImageSourcePropType | string,
  step: number,
  totalSteps: number,
  title: string,
  onSkip: () => void,
  progressAnim: any,
  children?: React.ReactNode
}) => (
  <View style={styles.visualCard}>
    <View style={styles.visualCardImageWrapper}>
      <Image
        source={typeof image === 'string' ? { uri: image } : image}
        style={styles.visualCardImage}
        resizeMode="cover"
      />
      {/* Overlay: прогресс-бар, шаг, заголовок, Пропустить */}
      <View style={styles.visualOverlay}>
        <View style={styles.visualHeaderRow}>
          <FontAwesome5 name="heart" size={16} color="#ec4899" solid style={styles.visualHeartIcon} />
          <TouchableOpacity onPress={onSkip}>
            <Text style={styles.visualSkipText}>Пропустить</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.visualProgressBarBg}>
          <Animated.View 
            style={[
              styles.visualProgressBarFill,
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>
        <View style={styles.visualProgressLabels}>
          <Text style={styles.visualProgressStep}>Шаг {step} из {totalSteps}</Text>
          <Text style={styles.visualProgressTitle}>{title}</Text>
        </View>
      </View>
    </View>
    {children}
  </View>
);

export const OnboardingScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [currentScreen, setCurrentScreen] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({ interests: [] });
  const [showRegistration, setShowRegistration] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showTrimesterDropdown, setShowTrimesterDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(8); // Сентябрь (0-based)
  const [currentYear, setCurrentYear] = useState(2025);
  const [errors, setErrors] = useState<{ 
    name?: boolean;
    trimester?: boolean;
    week?: boolean;
    day?: boolean;
    dueDate?: boolean;
    isFirstPregnancy?: boolean;
    interests?: boolean;
  }>({});

  // Функции для работы с календарем
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Понедельник = 0
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Пустые ячейки для начала месяца
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };
  

  // Animations
  const bounceAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    // Reset animations for each screen
    bounceAnim.setValue(0.3);
    fadeAnim.setValue(0);

    // Bounce animation for images
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.1,
        duration: 350,
        useNativeDriver: false,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: false,
      }),
    ]).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();

    // Update progress
    updateProgress(currentScreen);
  }, [currentScreen]);

  const updateProgress = (step: number) => {
    const progress = step / 4; // Возвращаем обратно 4 экрана
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const nextScreen = () => {
    if (currentScreen < 4) { // Возвращаем обратно 4 экрана
      setCurrentScreen(currentScreen + 1);
    } else {
      setShowRegistration(true);
    }
  };

  const skipOnboarding = () => {
    setShowRegistration(true);
  };

  const toggleInterest = (interest: string) => {
    const interests = onboardingData.interests;
    let updated: string[];
    if (interests.includes(interest)) {
      updated = interests.filter(i => i !== interest);
    } else {
      updated = [...interests, interest];
    }
    setOnboardingData({
      ...onboardingData,
      interests: updated
    });
    if (updated.length > 0) {
      setErrors(prev => ({ ...prev, interests: false }));
    }
  };

  const completeRegistration = () => {
    const missing: string[] = [];
    const invalid: string[] = [];

    const trimmedName = onboardingData.name?.trim();
    if (!trimmedName) missing.push('Имя');

    if (onboardingData.trimester == null) missing.push('Триместр');

    const week = onboardingData.week;
    if (week == null) {
      missing.push('Неделя');
    } else if (week < 1 || week > 42) {
      invalid.push('Неделя (1–42)');
    }

    const day = onboardingData.day;
    if (day == null) {
      missing.push('День');
    } else if (day < 0 || day > 6) {
      invalid.push('День (0–6)');
    }

    if (!onboardingData.dueDate) missing.push('Дата родов');

    if (onboardingData.isFirstPregnancy == null) missing.push('Первая беременность');

    if (!onboardingData.interests || onboardingData.interests.length === 0) missing.push('Интересы');

    // Установим подсветку ошибок
    setErrors({
      name: !trimmedName || false,
      trimester: onboardingData.trimester == null || false,
      week: week == null || week < 1 || week > 42 || false,
      day: day == null || day < 0 || day > 6 || false,
      dueDate: !onboardingData.dueDate || false,
      isFirstPregnancy: onboardingData.isFirstPregnancy == null || false,
      interests: !onboardingData.interests || onboardingData.interests.length === 0 || false,
    });

    if (missing.length || invalid.length) {
      const parts: string[] = [];
      if (missing.length) parts.push(`Не заполнены: ${missing.join(', ')}`);
      if (invalid.length) parts.push(`Некорректные значения: ${invalid.join(', ')}`);
      Alert.alert('Заполни данные', parts.join('\n'));
      return;
    }

    setShowRegistration(false);
    setShowSubscription(true);
  };

  const selectSubscription = (type: 'free' | 'premium') => {
    setShowSubscription(false);
    setShowPermissions(true);
  };

  const continueWithPermissions = () => {
    setShowPermissions(false);
    setShowTutorial(true);
  };

  const finishTutorial = () => {
    setShowTutorial(false);
    setShowLoading(true);
    
    // Сохраняем данные пользователя в store
    if (onboardingData.height || onboardingData.prePregnancyWeight) {
      dispatch(updateUserPhysicalData({
        height: onboardingData.height,
        prePregnancyWeight: onboardingData.prePregnancyWeight
      }));
    }
    
    // Simulate loading
    setTimeout(() => {
      // Complete onboarding and go to main app
      dispatch(setOnboardingCompleted(true));
    }, 3000);
  };

  const getStepTitle = () => {
    const titles = ['Добро пожаловать', 'AI помощник', 'Отслеживание', 'Сообщество'];
    return titles[currentScreen - 1];
  };

  // Loading screen
  if (showLoading) {
    return (
      <LinearGradient
        colors={['#f0fdfa', '#f0f9ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fullScreen}
      >
        <SafeAreaView style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingImageContainer, { transform: [{ scale: bounceAnim }] }]}>
            <Image
              source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/227c1724ab-483bb96c93af42f3d2b0.png' }}
              style={styles.loadingImage}
              resizeMode="cover"
            />
          </Animated.View>

          <Text style={styles.loadingTitle}>Готовим все для тебя...</Text>
          <Text style={styles.loadingSubtitle}>
            Персонализируем контент и настраиваем рекомендации под твой срок беременности.
          </Text>

          <View style={styles.loadingBars}>
            <View style={styles.loadingBarItem}>
              <View style={styles.loadingBarHeader}>
                <Text style={styles.loadingBarTitle}>Загружаем информацию о 23-й неделе</Text>
                <Text style={styles.loadingBarPercent}>100%</Text>
              </View>
              <View style={styles.loadingBarTrack}>
                <View style={[styles.loadingBarFill, { width: '100%', backgroundColor: '#059669' }]} />
              </View>
            </View>

            <View style={styles.loadingBarItem}>
              <View style={styles.loadingBarHeader}>
                <Text style={styles.loadingBarTitle}>Настраиваем AI помощника</Text>
                <Text style={styles.loadingBarPercent}>85%</Text>
              </View>
              <View style={styles.loadingBarTrack}>
                <View style={[styles.loadingBarFill, { width: '85%', backgroundColor: '#2563eb' }]} />
              </View>
            </View>

            <View style={styles.loadingBarItem}>
              <View style={styles.loadingBarHeader}>
                <Text style={styles.loadingBarTitle}>Подбираем сообщества</Text>
                <Text style={styles.loadingBarPercent}>70%</Text>
              </View>
              <View style={styles.loadingBarTrack}>
                <View style={[styles.loadingBarFill, { width: '70%', backgroundColor: '#ec4899' }]} />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Tutorial screen
  if (showTutorial) {
    return (
      <LinearGradient
        colors={['#fef7f0', '#fdf2f8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fullScreen}
      >
        <SafeAreaView style={styles.tutorialContainer}>
          <View style={styles.tutorialHeader}>
            <LinearGradient
              colors={['#ec4899', '#ea580c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tutorialIcon}
            >
              <FontAwesome5 name="graduation-cap" size={24} color="#ffffff" solid />
            </LinearGradient>
            <Text style={styles.tutorialTitle}>Быстрый обзор</Text>
            <Text style={styles.tutorialSubtitle}>Узнай, как пользоваться основными функциями</Text>
          </View>

          <ScrollView style={styles.tutorialContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tutorialCard}>
              <View style={styles.tutorialCardHeader}>
                <View style={styles.tutorialCardIcon}>
                  <FontAwesome5 name="home" size={16} color="#ec4899" solid />
                </View>
                <Text style={styles.tutorialCardTitle}>Главный экран</Text>
              </View>
              <Text style={styles.tutorialCardText}>
                Здесь ты увидишь информацию о развитии малыша, советы дня и чек-лист задач.
              </Text>
              <View style={styles.tutorialExample}>
                <View style={styles.tutorialExampleIcon}>
                  <FontAwesome5 name="baby" size={14} color="#ec4899" solid />
                </View>
                <Text style={styles.tutorialExampleText}>Ты на 23-й неделе</Text>
              </View>
            </View>

            <View style={styles.tutorialCard}>
              <View style={styles.tutorialCardHeader}>
                <View style={styles.tutorialCardIcon}>
                  <FontAwesome5 name="robot" size={16} color="#8b5cf6" solid />
                </View>
                <Text style={styles.tutorialCardTitle}>AI помощник</Text>
              </View>
              <Text style={styles.tutorialCardText}>
                Нажми на плавающую кнопку внизу справа, чтобы задать вопрос умному помощнику.
              </Text>
              <View style={styles.tutorialExample}>
                <Text style={styles.tutorialExampleQuestion}>Можно ли мне пить кофе?</Text>
                <View style={styles.tutorialExampleBot}>
                  <FontAwesome5 name="robot" size={12} color="#ffffff" solid />
                </View>
              </View>
            </View>

            <View style={styles.tutorialCard}>
              <View style={styles.tutorialCardHeader}>
                <View style={styles.tutorialCardIcon}>
                  <FontAwesome5 name="chart-line" size={16} color="#059669" solid />
                </View>
                <Text style={styles.tutorialCardTitle}>Трекинг</Text>
              </View>
              <Text style={styles.tutorialCardText}>
                Отмечай настроение, симптомы и движения малыша каждый день.
              </Text>
              <View style={styles.tutorialExample}>
                <Text style={styles.tutorialExampleQuestion}>Как настроение?</Text>
                <View style={styles.moodEmojis}>
                  <Text style={styles.moodEmoji}>😊</Text>
                  <Text style={styles.moodEmoji}>😌</Text>
                  <Text style={styles.moodEmoji}>😐</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.finishButton} onPress={finishTutorial}>
            <LinearGradient
              colors={['#ec4899', '#ea580c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.finishButtonGradient}
            >
              <Text style={styles.finishButtonText}>Понятно, начать пользоваться!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Permissions screen
  if (showPermissions) {
    return (
      <View style={styles.fullScreen}>
        <SafeAreaView style={styles.permissionsContainer}>
          <View style={styles.permissionsHeader}>
            <LinearGradient
              colors={['#2563eb', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.permissionsIcon}
            >
              <FontAwesome5 name="shield-alt" size={24} color="#ffffff" solid />
            </LinearGradient>
            <Text style={styles.permissionsTitle}>Разрешения</Text>
            <Text style={styles.permissionsSubtitle}>Помоги нам сделать приложение еще лучше</Text>
          </View>

          <ScrollView style={styles.permissionsContent} showsVerticalScrollIndicator={false}>
            <LinearGradient
              colors={['#eff6ff', '#e0f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.permissionCard}
            >
              <View style={styles.permissionIcon}>
                <FontAwesome5 name="bell" size={20} color="#ffffff" solid />
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Уведомления</Text>
                <Text style={styles.permissionText}>
                  Получай напоминания о приеме витаминов, записи симптомов и важных событиях беременности.
                </Text>
                <TouchableOpacity style={styles.permissionButton}>
                  <Text style={styles.permissionButtonText}>Разрешить уведомления</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#f0fdf4', '#ecfdf5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.permissionCard}
            >
              <View style={[styles.permissionIcon, { backgroundColor: '#059669' }]}>
                <FontAwesome5 name="microphone" size={20} color="#ffffff" solid />
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Микрофон</Text>
                <Text style={styles.permissionText}>
                  Используй голосовые сообщения для общения с AI помощником - это быстрее и удобнее.
                </Text>
                <TouchableOpacity style={[styles.permissionButton, { backgroundColor: '#059669' }]}>
                  <Text style={styles.permissionButtonText}>Разрешить микрофон</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#faf5ff', '#f3e8ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.permissionCard}
            >
              <View style={[styles.permissionIcon, { backgroundColor: '#8b5cf6' }]}>
                <FontAwesome5 name="camera" size={20} color="#ffffff" solid />
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Камера</Text>
                <Text style={styles.permissionText}>
                  Добавляй фото в дневник беременности и делись моментами с сообществом.
                </Text>
                <TouchableOpacity style={[styles.permissionButton, { backgroundColor: '#8b5cf6' }]}>
                  <Text style={styles.permissionButtonText}>Разрешить камеру</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ScrollView>

          <View style={styles.permissionsFooter}>
            <TouchableOpacity style={styles.continueButton} onPress={continueWithPermissions}>
              <LinearGradient
                colors={['#2563eb', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueButtonGradient}
              >
                <Text style={styles.continueButtonText}>Продолжить</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={continueWithPermissions}>
              <Text style={styles.skipPermissionsText}>Пропустить (можно настроить позже)</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Subscription screen
  if (showSubscription) {
    return (
      <LinearGradient
        colors={['#f3e8ff', '#fce7f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fullScreen}
      >
        <SafeAreaView style={styles.subscriptionContainer}>
          <View style={styles.subscriptionHeader}>
            <LinearGradient
              colors={['#8b5cf6', '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscriptionIcon}
            >
              <FontAwesome5 name="crown" size={24} color="#ffffff" solid />
            </LinearGradient>
            <Text style={styles.subscriptionTitle}>Выбери свой план</Text>
            <Text style={styles.subscriptionSubtitle}>Получи максимум от BabyJoy</Text>
          </View>

          <View style={styles.plansContainer}>
            {/* Free Plan */}
            <View style={styles.freePlan}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Базовый план</Text>
                <Text style={styles.planPrice}>Бесплатно</Text>
              </View>
              <View style={styles.planFeatures}>
                <View style={styles.planFeature}>
                  <FontAwesome5 name="check" size={12} color="#059669" solid />
                  <Text style={styles.planFeatureText}>Еженедельные обновления о малыше</Text>
                </View>
                <View style={styles.planFeature}>
                  <FontAwesome5 name="check" size={12} color="#059669" solid />
                  <Text style={styles.planFeatureText}>Базовый трекинг симптомов</Text>
                </View>
                <View style={styles.planFeature}>
                  <FontAwesome5 name="check" size={12} color="#059669" solid />
                  <Text style={styles.planFeatureText}>Доступ к сообществу</Text>
                </View>
                <View style={styles.planFeature}>
                  <FontAwesome5 name="times" size={12} color="#9ca3af" solid />
                  <Text style={[styles.planFeatureText, { color: '#9ca3af' }]}>AI помощник (ограничено)</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.freePlanButton}
                onPress={() => selectSubscription('free')}
              >
                <Text style={styles.freePlanButtonText}>Продолжить бесплатно</Text>
              </TouchableOpacity>
            </View>

            {/* Premium Plan */}
            <LinearGradient
              colors={['#8b5cf6', '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumPlan}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Популярно</Text>
              </View>
              <View style={styles.planHeader}>
                <Text style={styles.premiumPlanName}>Premium план</Text>
                <View style={styles.premiumPrice}>
                  <Text style={styles.premiumPriceValue}>$9.99</Text>
                  <Text style={styles.premiumPricePeriod}>/месяц</Text>
                </View>
              </View>
              <View style={styles.planFeatures}>
                <View style={styles.planFeature}>
                  <FontAwesome5 name="check" size={12} color="#ffffff" solid />
                  <Text style={[styles.planFeatureText, { color: '#ffffff' }]}>Все функции базового плана</Text>
                </View>
                <View style={styles.planFeature}>
                  <FontAwesome5 name="check" size={12} color="#ffffff" solid />
                  <Text style={[styles.planFeatureText, { color: '#ffffff' }]}>Безлимитный AI помощник</Text>
                </View>
                <View style={styles.planFeature}>
                  <FontAwesome5 name="check" size={12} color="#ffffff" solid />
                  <Text style={[styles.planFeatureText, { color: '#ffffff' }]}>Детальная аналитика здоровья</Text>
                </View>
                <View style={styles.planFeature}>
                  <FontAwesome5 name="check" size={12} color="#ffffff" solid />
                  <Text style={[styles.planFeatureText, { color: '#ffffff' }]}>Персональные рекомендации</Text>
                </View>
                <View style={styles.planFeature}>
                  <FontAwesome5 name="check" size={12} color="#ffffff" solid />
                  <Text style={[styles.planFeatureText, { color: '#ffffff' }]}>Эксклюзивный контент</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.premiumPlanButton}
                onPress={() => selectSubscription('premium')}
              >
                <Text style={styles.premiumPlanButtonText}>Попробовать 7 дней бесплатно</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <Text style={styles.subscriptionDisclaimer}>
            Отмена в любое время • Без скрытых платежей
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Registration screen
  if (showRegistration) {
    return (
      <View style={styles.fullScreen}>
        <SafeAreaView style={styles.registrationContainer}>
          <ScrollView contentContainerStyle={styles.registrationContent} showsVerticalScrollIndicator={false}>
            <View style={styles.registrationHeader}>
              <LinearGradient
                colors={['#ec4899', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registrationIcon}
              >
                <FontAwesome5 name="heart" size={24} color="#ffffff" solid />
              </LinearGradient>
              <Text style={styles.registrationTitle}>Расскажи о себе</Text>
              <Text style={styles.registrationSubtitle}>Это поможет нам персонализировать твой опыт</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Как тебя зовут?</Text>
                <TextInput
                  style={[styles.textInput, errors.name && styles.errorInput]}
                  placeholder="Введи свое имя"
                  placeholderTextColor="#9ca3af"
                  value={onboardingData.name || ''}
                  onChangeText={(name) => {
                    setOnboardingData({ ...onboardingData, name });
                    if (name && name.trim().length > 0) {
                      setErrors(prev => ({ ...prev, name: false }));
                    }
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>На какой неделе беременности?</Text>
                <View style={styles.pregnancyWeekContainer}>
                  <View style={styles.trimesterContainer}>
                    <TouchableOpacity 
                      style={[styles.trimesterDropdown, errors.trimester && styles.errorInput]}
                      onPress={() => setShowTrimesterDropdown(!showTrimesterDropdown)}
                    >
                      <Text style={styles.trimesterText}>
                        {onboardingData.trimester ? `${onboardingData.trimester} трим` : '1 трим'}
                      </Text>
                      <FontAwesome5 name="chevron-down" size={12} color="#6b7280" />
                    </TouchableOpacity>
                    
                  </View>
                  <TextInput
                    style={[styles.weekInputSeparate, errors.week && styles.errorInput]}
                    placeholder="Неделя"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={onboardingData.week?.toString() || ''}
                    onChangeText={(text) => {
                      const num = parseInt(text);
                      const value = isNaN(num) ? undefined : num;
                      setOnboardingData({ ...onboardingData, week: value });
                      if (value != null && value >= 1 && value <= 42) {
                        setErrors(prev => ({ ...prev, week: false }));
                      }
                    }}
                  />
                  <TextInput
                    style={[styles.weekInputSeparate, errors.day && styles.errorInput]}
                    placeholder="День"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={onboardingData.day?.toString() || ''}
                    onChangeText={(text) => {
                      const num = parseInt(text);
                      const value = isNaN(num) ? undefined : num;
                      setOnboardingData({ ...onboardingData, day: value });
                      if (value != null && value >= 0 && value <= 6) {
                        setErrors(prev => ({ ...prev, day: false }));
                      }
                    }}
                  />
                </View>
                
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Дата родов (приблизительно)</Text>
                <TouchableOpacity 
                  style={[styles.datePickerButton, errors.dueDate && styles.errorInput]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {onboardingData.dueDate || 'ДД.ММ.ГГГГ'}
                  </Text>
                  <FontAwesome5 name="calendar-alt" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Это твоя первая беременность?</Text>
                <View style={styles.pregnancyOptionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pregnancyOption,
                      onboardingData.isFirstPregnancy === true && styles.selectedPregnancyOption,
                      onboardingData.isFirstPregnancy == null && errors.isFirstPregnancy && styles.errorOption,
                    ]}
                    onPress={() => {
                      setOnboardingData({ ...onboardingData, isFirstPregnancy: true });
                      setErrors(prev => ({ ...prev, isFirstPregnancy: false }));
                    }}
                  >
                    <FontAwesome5 name="baby" size={16} color="#ec4899" solid style={styles.pregnancyOptionIcon} />
                    <Text style={styles.pregnancyOptionText}>Да, первая</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.pregnancyOption,
                      onboardingData.isFirstPregnancy === false && styles.selectedPregnancyOption,
                      onboardingData.isFirstPregnancy == null && errors.isFirstPregnancy && styles.errorOption,
                    ]}
                    onPress={() => {
                      setOnboardingData({ ...onboardingData, isFirstPregnancy: false });
                      setErrors(prev => ({ ...prev, isFirstPregnancy: false }));
                    }}
                  >
                    <FontAwesome5 name="child" size={16} color="#ec4899" solid style={styles.pregnancyOptionIcon} />
                    <Text style={styles.pregnancyOptionText}>Нет, уже есть дети</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Поля рост и вес */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Твой рост и вес до беременности</Text>
                <Text style={styles.registrationSubtitle}>Для персональных рекомендаций по здоровью</Text>
                
                {/* ЛУЧШИЙ UX: Выбор метода ввода веса */}
                <View style={styles.weightMethodSelection}>
                  <Text style={styles.weightMethodTitle}>⚖️ Как указать вес?</Text>
                  
                  <View style={styles.weightMethodOptions}>
                    <TouchableOpacity 
                      style={[
                        styles.weightMethodOption,
                        onboardingData.weightMethod === 'remember' && styles.selectedWeightMethod
                      ]}
                      onPress={() => setOnboardingData({...onboardingData, weightMethod: 'remember'})}
                    >
                      <FontAwesome5 name="brain" size={16} color="#10b981" />
                      <View style={styles.weightMethodContent}>
                        <Text style={styles.weightMethodLabel}>💭 Помню вес ДО беременности</Text>
                        <Text style={styles.weightMethodDesc}>Самый точный расчет ИМТ</Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.weightMethodOption,
                        onboardingData.weightMethod === 'current' && styles.selectedWeightMethod
                      ]}
                      onPress={() => setOnboardingData({...onboardingData, weightMethod: 'current'})}
                    >
                      <FontAwesome5 name="calculator" size={16} color="#3b82f6" />
                      <View style={styles.weightMethodContent}>
                        <Text style={styles.weightMethodLabel}>📱 Знаю только текущий</Text>
                        <Text style={styles.weightMethodDesc}>Система рассчитает приблизительно</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Поля ввода в зависимости от выбора */}
                {onboardingData.weightMethod && (
                  <View style={styles.compactPhysicalData}>
                    {/* Рост - всегда нужен */}
                    <View style={styles.compactRow}>
                      <Text style={styles.compactLabel}>📏 Рост:</Text>
                      <View style={styles.compactControls}>
                        <TouchableOpacity 
                          style={styles.compactButton}
                          onPress={() => setOnboardingData({
                            ...onboardingData, 
                            height: Math.max(140, (onboardingData.height || 165) - 1)
                          })}
                        >
                          <FontAwesome5 name="minus" size={10} color="#6b7280" />
                        </TouchableOpacity>
                        
                        <Text style={styles.compactValue}>{onboardingData.height || 165} см</Text>
                        
                        <TouchableOpacity 
                          style={styles.compactButton}
                          onPress={() => setOnboardingData({
                            ...onboardingData, 
                            height: Math.min(200, (onboardingData.height || 165) + 1)
                          })}
                        >
                          <FontAwesome5 name="plus" size={10} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Вес ДО беременности (если помнит) */}
                    {onboardingData.weightMethod === 'remember' && (
                      <View style={styles.compactRow}>
                        <Text style={styles.compactLabel}>⚖️ Вес ДО:</Text>
                        <View style={styles.compactControls}>
                          <TouchableOpacity 
                            style={styles.compactButton}
                            onPress={() => setOnboardingData({
                              ...onboardingData, 
                              prePregnancyWeight: Math.max(40, (onboardingData.prePregnancyWeight || 65) - 0.5)
                            })}
                          >
                            <FontAwesome5 name="minus" size={10} color="#6b7280" />
                          </TouchableOpacity>
                          
                          <Text style={styles.compactValue}>{onboardingData.prePregnancyWeight || 65} кг</Text>
                          
                          <TouchableOpacity 
                            style={styles.compactButton}
                            onPress={() => setOnboardingData({
                              ...onboardingData, 
                              prePregnancyWeight: Math.min(120, (onboardingData.prePregnancyWeight || 65) + 0.5)
                            })}
                          >
                            <FontAwesome5 name="plus" size={10} color="#6b7280" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Текущий вес (если знает только его ИЛИ дополнительно к весу ДО) */}
                    <View style={styles.compactRow}>
                      <Text style={styles.compactLabel}>
                        {onboardingData.weightMethod === 'remember' ? 
                          '📱 Сейчас (опц):' : 
                          '⚖️ Вес сейчас:'}
                      </Text>
                      <View style={styles.compactControls}>
                        <TouchableOpacity 
                          style={styles.compactButton}
                          onPress={() => setOnboardingData({
                            ...onboardingData, 
                            currentWeight: Math.max(40, (onboardingData.currentWeight || 70) - 0.5)
                          })}
                        >
                          <FontAwesome5 name="minus" size={10} color="#6b7280" />
                        </TouchableOpacity>
                        
                        <Text style={[
                          styles.compactValue,
                          onboardingData.weightMethod === 'remember' && styles.optionalValue
                        ]}>
                          {onboardingData.currentWeight || (onboardingData.weightMethod === 'remember' ? '–' : '70')} {onboardingData.currentWeight || onboardingData.weightMethod === 'current' ? 'кг' : ''}
                        </Text>
                        
                        <TouchableOpacity 
                          style={styles.compactButton}
                          onPress={() => setOnboardingData({
                            ...onboardingData, 
                            currentWeight: Math.min(120, (onboardingData.currentWeight || 70) + 0.5)
                          })}
                        >
                          <FontAwesome5 name="plus" size={10} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Показываем расчеты и прибавку */}
                    {onboardingData.weightMethod === 'current' && onboardingData.week && onboardingData.currentWeight && (
                      <View style={styles.calculationInfo}>
                        <FontAwesome5 name="calculator" size={12} color="#3b82f6" />
                        <Text style={styles.calculationText}>
                          Расчет: {onboardingData.currentWeight}кг - {Math.round((onboardingData.week * 0.3) * 10) / 10}кг = ~{Math.round(((onboardingData.currentWeight || 70) - (onboardingData.week * 0.3)) * 10) / 10}кг до беременности
                        </Text>
                      </View>
                    )}

                    {/* Показываем текущую прибавку если знаем оба веса */}
                    {onboardingData.weightMethod === 'remember' && onboardingData.prePregnancyWeight && onboardingData.currentWeight && (
                      <View style={styles.gainInfo}>
                        <FontAwesome5 name="chart-line" size={12} color="#10b981" />
                        <Text style={styles.gainText}>
                          Прибавка: +{Math.round((onboardingData.currentWeight - onboardingData.prePregnancyWeight) * 10) / 10} кг на {onboardingData.week || 0} неделе
                        </Text>
                      </View>
                    )}

                    {/* ИМТ на основе веса ДО беременности */}
                    <View style={styles.bmiRow}>
                      <FontAwesome5 name="heart" size={14} color="#ec4899" />
                      <Text style={styles.bmiResultText}>
                        ИМТ: {(() => {
                          const h = onboardingData.height || 165;
                          const w = onboardingData.weightMethod === 'remember' ? 
                            (onboardingData.prePregnancyWeight || 65) : 
                            ((onboardingData.currentWeight || 70) - ((onboardingData.week || 0) * 0.3));
                          const bmi = w / Math.pow(h/100, 2);
                          return Math.round(bmi * 10) / 10;
                        })()} ({(() => {
                          const h = onboardingData.height || 165;
                          const w = onboardingData.weightMethod === 'remember' ? 
                            (onboardingData.prePregnancyWeight || 65) : 
                            ((onboardingData.currentWeight || 70) - ((onboardingData.week || 0) * 0.3));
                          const bmi = w / Math.pow(h/100, 2);
                          return bmi < 18.5 ? 'недовес' : bmi < 25 ? 'норма' : bmi < 30 ? 'избыток' : 'ожирение';
                        })()}) 
                        {onboardingData.weightMethod === 'current' ? ' (примерно)' : ''}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Что тебя больше всего интересует?</Text>
                <View style={styles.interestsGrid}>
                  {[
                    { id: 'health', icon: 'heartbeat', color: '#059669', label: 'Здоровье' },
                    { id: 'nutrition', icon: 'apple-alt', color: '#2563eb', label: 'Питание' },
                    { id: 'fitness', icon: 'dumbbell', color: '#8b5cf6', label: 'Фитнес' },
                    { id: 'preparation', icon: 'baby-carriage', color: '#ea580c', label: 'Подготовка' },
                  ].map(interest => (
                    <TouchableOpacity
                      key={interest.id}
                      style={[
                        styles.interestOption,
                        onboardingData.interests.includes(interest.id) && styles.selectedInterestOption,
                        errors.interests && !onboardingData.interests.includes(interest.id) && styles.errorOption
                      ]}
                      onPress={() => toggleInterest(interest.id)}
                    >
                      <FontAwesome5 name={interest.icon as any} size={16} color={interest.color} solid style={styles.interestIcon} />
                      <Text style={styles.interestText}>{interest.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.registrationFooter}>
              <TouchableOpacity 
                style={styles.completeButton} 
                onPress={() => {
                  // ЧЕСТНЫЙ расчет веса до беременности
                  let finalPrePregnancyWeight = 65;
                  
                  if (onboardingData.weightMethod === 'remember') {
                    // Пользователь помнит точный вес ДО беременности
                    finalPrePregnancyWeight = onboardingData.prePregnancyWeight || 65;
                  } else if (onboardingData.weightMethod === 'current') {
                    // Пользователь указал текущий вес - вычисляем вес ДО
                    const estimatedGain = (onboardingData.week || 0) * 0.3;
                    finalPrePregnancyWeight = (onboardingData.currentWeight || 70) - estimatedGain;
                  }
                  
                  // Сохраняем рассчитанный вес до беременности
                  dispatch(updateUserPhysicalData({
                    height: onboardingData.height || 165,
                    prePregnancyWeight: Math.round(finalPrePregnancyWeight * 10) / 10
                  }));
                  
                  // TODO: В будущем добавить сохранение currentWeight в дневник/календарь
                  // if (onboardingData.currentWeight) {
                  //   dispatch(addWeightEntry({
                  //     week: onboardingData.week,
                  //     weight: onboardingData.currentWeight
                  //   }));
                  // }
                  
                  // Завершаем весь онбординг (пропускаем подписки и тутorial)
                  dispatch(setOnboardingCompleted(true));
                }}
              >
                <LinearGradient
                  colors={['#ec4899', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.completeButtonGradient}
                >
                  <Text style={styles.completeButtonText}>Завершить регистрацию</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.termsText}>
                Нажимая "Завершить регистрацию", ты соглашаешься с{' '}
                <Text style={styles.termsLink}>Условиями использования</Text> и{' '}
                <Text style={styles.termsLink}>Политикой конфиденциальности</Text>
              </Text>
            </View>
          </ScrollView>
          
          {/* Dropdown триместров вне ScrollView */}
          {showTrimesterDropdown && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
            }}>
              {/* Невидимый backdrop для закрытия */}
              <TouchableOpacity 
                style={{ flex: 1 }}
                onPress={() => setShowTrimesterDropdown(false)}
              />
              {/* Сам dropdown */}
              <View style={{
                position: 'absolute',
                top: '39%', // Процентное позиционирование
                left: '6%', // Левее, чтобы совпадал с кнопкой
                width: 120,
                backgroundColor: 'white',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 100,
              }}>
              <TouchableOpacity 
                onPress={() => {
                  setOnboardingData({ ...onboardingData, trimester: 1 });
                  setErrors(prev => ({ ...prev, trimester: false }));
                  setShowTrimesterDropdown(false);
                }}
                style={{ 
                  paddingVertical: 12, 
                  paddingHorizontal: 16, 
                  borderBottomWidth: 1, 
                  borderBottomColor: '#f3f4f6',
                  backgroundColor: onboardingData.trimester === 1 ? '#3b82f6' : 'transparent'
                }}
              >
                <Text style={{ 
                  fontSize: 14, 
                  color: onboardingData.trimester === 1 ? 'white' : '#374151', 
                  textAlign: 'center',
                  fontWeight: onboardingData.trimester === 1 ? '500' : 'normal'
                }}>1 трим</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setOnboardingData({ ...onboardingData, trimester: 2 });
                  setErrors(prev => ({ ...prev, trimester: false }));
                  setShowTrimesterDropdown(false);
                }}
                style={{ 
                  paddingVertical: 12, 
                  paddingHorizontal: 16, 
                  borderBottomWidth: 1, 
                  borderBottomColor: '#f3f4f6',
                  backgroundColor: onboardingData.trimester === 2 ? '#3b82f6' : 'transparent'
                }}
              >
                <Text style={{ 
                  fontSize: 14, 
                  color: onboardingData.trimester === 2 ? 'white' : '#374151', 
                  textAlign: 'center',
                  fontWeight: onboardingData.trimester === 2 ? '500' : 'normal'
                }}>2 трим</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setOnboardingData({ ...onboardingData, trimester: 3 });
                  setErrors(prev => ({ ...prev, trimester: false }));
                  setShowTrimesterDropdown(false);
                }}
                style={{ 
                  paddingVertical: 12, 
                  paddingHorizontal: 16,
                  backgroundColor: onboardingData.trimester === 3 ? '#3b82f6' : 'transparent'
                }}
              >
                <Text style={{ 
                  fontSize: 14, 
                  color: onboardingData.trimester === 3 ? 'white' : '#374151', 
                  textAlign: 'center',
                  fontWeight: onboardingData.trimester === 3 ? '500' : 'normal'
                }}>3 трим</Text>
              </TouchableOpacity>
            </View>
            </View>
          )}
          
          {/* Календарь для выбора даты */}
          {showDatePicker && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 99999,
            }}>
              <View style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 20,
                marginHorizontal: 20,
                maxWidth: 400,
                width: '90%',
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 20,
                  color: '#1f2937',
                }}>Выберите дату родов</Text>
                
{/* Простой календарь */}
                <View style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: 8,
                  padding: 15,
                }}>
                  {/* Заголовок с навигацией */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 15,
                  }}>
                    <TouchableOpacity onPress={goToPreviousMonth} style={{
                      padding: 8,
                    }}>
                      <FontAwesome5 name="chevron-left" size={16} color="#3b82f6" />
                    </TouchableOpacity>
                    
                    <Text style={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: '#1f2937',
                    }}>{monthNames[currentMonth]} {currentYear}</Text>
                    
                    <TouchableOpacity onPress={goToNextMonth} style={{
                      padding: 8,
                    }}>
                      <FontAwesome5 name="chevron-right" size={16} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Заголовки дней недели */}
                  <View style={{
                    flexDirection: 'row',
                    marginBottom: 10,
                  }}>
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                      <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{
                          fontSize: 12,
                          color: '#6b7280',
                          fontWeight: '500',
                        }}>{day}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Динамическая сетка дат */}
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                  }}>
                    {generateCalendarDays().map((day, index) => {
                      if (day === null) {
                        // Пустая ячейка
                        return (
                          <View key={index} style={{
                            width: `${100/7}%`,
                            alignItems: 'center',
                            paddingVertical: 8,
                          }} />
                        );
                      }
                      
                      return (
                        <TouchableOpacity 
                          key={index}
                          style={{
                            width: `${100/7}%`,
                            alignItems: 'center',
                            paddingVertical: 8,
                            backgroundColor: day === 15 ? '#3b82f6' : 'transparent', // Пример выделенной даты
                            borderRadius: 8,
                          }}
                          onPress={() => {
                            const formattedDate = `${day.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`;
                            setOnboardingData({ ...onboardingData, dueDate: formattedDate });
                            setErrors(prev => ({ ...prev, dueDate: false }));
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={{
                            fontSize: 16,
                            color: day === 15 ? 'white' : '#374151',
                            fontWeight: day === 15 ? 'bold' : 'normal',
                          }}>{day}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={{
                    backgroundColor: '#f3f4f6',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 8,
                    marginTop: 20,
                  }}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={{
                    textAlign: 'center',
                    color: '#6b7280',
                    fontWeight: '500',
                  }}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
        </SafeAreaView>
      </View>
    );
  }

  // Main onboarding screens (1-4) - БЕЗ ХЕДЕРА!
  const renderOnboardingScreen = () => {
    switch (currentScreen) {
      case 1:
        return (
          <LinearGradient
            colors={['#fef7f0', '#fdf2f8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fullScreen}
          >
            <View style={styles.onboardingContent}>
              <OnboardingCard
                image={require('../../../../assets/images/onboarding_preview.png')}
                step={currentScreen}
                totalSteps={4}
                title={getStepTitle()}
                onSkip={skipOnboarding}
                progressAnim={progressAnim}
              />
              <View style={styles.screenContentContainerVisual}>
                <Text style={styles.heroTitleVisual}>
                  Добро пожаловать в
                  <Text style={styles.brandTextVisual}> BabyJoy</Text>
                </Text>
                <Text style={styles.heroSubtitleVisual}>
                  Твой персональный спутник на пути к материнству. Мы поддержим тебя каждый день этого удивительного путешествия.
                </Text>
                <View style={styles.featuresRowVisual}>
                  <View style={styles.featureCardVisual}>
                    <FontAwesome5 name="baby" size={24} color="#ec4899" solid style={styles.featureIconVisual} />
                    <Text style={styles.featureLabelVisual}>Развитие малыша</Text>
                  </View>
                  <View style={styles.featureCardVisual}>
                    <FontAwesome5 name="heart" size={24} color="#059669" solid style={styles.featureIconVisual} />
                    <Text style={styles.featureLabelVisual}>Здоровье мамы</Text>
                  </View>
                  <View style={styles.featureCardVisual}>
                    <FontAwesome5 name="robot" size={24} color="#8b5cf6" solid style={styles.featureIconVisual} />
                    <Text style={styles.featureLabelVisual}>AI помощник</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.startButtonVisual} onPress={nextScreen}>
                  <LinearGradient
                    colors={['#ec4899', '#8b5cf6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startButtonGradientVisual}
                  >
                    <Text style={styles.startButtonTextVisual}>Начать путешествие</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        );
      case 2:
        return (
          <LinearGradient
            colors={['#f0fdfa', '#f0f9ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fullScreen}
          >
            <View style={styles.onboardingContent}>
              <OnboardingCard
                image={'https://storage.googleapis.com/uxpilot-auth.appspot.com/10dafd2227-0d77a0f92f8a07c0412d.png'}
                step={currentScreen}
                totalSteps={4}
                title={getStepTitle()}
                onSkip={skipOnboarding}
                progressAnim={progressAnim}
              />
              <View style={styles.aiContentContainer}>
                <Text style={styles.aiTitleRow}>
                  <Text style={styles.aiTitleBlack}>Умный </Text>
                  <Text style={styles.aiTitleGreen}>AI помощник</Text>
                </Text>
                <Text style={styles.aiDesc}>
                  Получай персональные советы, отвечай на вопросы и получай поддержку 24/7 от нашего умного помощника.
                </Text>
                <View style={styles.aiFeatureList}>
                  <View style={styles.aiFeatureCard}>
                    <View style={[styles.aiIconCircle, { backgroundColor: '#059669' }]}> 
                      <FontAwesome5 name="question-circle" size={16} color="#fff" solid />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiFeatureTitleNew}>Можно ли мне...?</Text>
                      <Text style={styles.aiFeatureDesc}>Быстрые ответы на ежедневные вопросы</Text>
                    </View>
                  </View>
                  <View style={styles.aiFeatureCard}>
                    <View style={[styles.aiIconCircle, { backgroundColor: '#2563eb' }]}> 
                      <FontAwesome5 name="lightbulb" size={16} color="#fff" solid />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiFeatureTitleNew}>Что делать если...?</Text>
                      <Text style={styles.aiFeatureDesc}>Советы для любой ситуации</Text>
                    </View>
                  </View>
                  <View style={styles.aiFeatureCard}>
                    <View style={[styles.aiIconCircle, { backgroundColor: '#8b5cf6' }]}> 
                      <FontAwesome5 name="microphone" size={16} color="#fff" solid />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiFeatureTitleNew}>Голосовые сообщения</Text>
                      <Text style={styles.aiFeatureDesc}>Говори как с лучшей подругой</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.aiButton} onPress={nextScreen}>
                  <LinearGradient
                    colors={['#059669', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.aiButtonGradient}
                  >
                    <Text style={styles.aiButtonText}>Звучит отлично!</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        );
      case 3:
        return (
          <LinearGradient
            colors={['#fdf2f8', '#fef7f0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fullScreen}
          >
            <View style={styles.onboardingContent}>
              <OnboardingCard
                image={require('../../../../assets/images/onboarding_track.png')}
                step={currentScreen}
                totalSteps={4}
                title={getStepTitle()}
                onSkip={skipOnboarding}
                progressAnim={progressAnim}
              />
              <View style={styles.screenContentContainerVisual}>
                <Text style={styles.trackTitleRow}>
                  <Text style={styles.trackTitleBlack}>Отслеживай </Text>
                  <Text style={styles.trackTitlePink}>развитие</Text>
                </Text>
                <Text style={styles.trackDesc}>
                  Следи за ростом малыша, записывай симптомы и веди дневник самых важных моментов беременности.
                </Text>
                <View style={styles.trackGrid2x2}>
                  <View style={styles.trackFeatureCard}>
                    <FontAwesome5 name="calendar-check" size={28} color="#ec4899" solid style={styles.trackFeatureIcon} />
                    <Text style={styles.trackFeatureTitle}>Календарь</Text>
                    <Text style={styles.trackFeatureDesc}>40 недель развития</Text>
                  </View>
                  <View style={styles.trackFeatureCard}>
                    <FontAwesome5 name="heartbeat" size={28} color="#ea580c" solid style={styles.trackFeatureIcon} />
                    <Text style={styles.trackFeatureTitle}>Симптомы</Text>
                    <Text style={styles.trackFeatureDesc}>Ежедневный трекер</Text>
                  </View>
                  <View style={styles.trackFeatureCard}>
                    <FontAwesome5 name="book" size={28} color="#059669" solid style={styles.trackFeatureIcon} />
                    <Text style={styles.trackFeatureTitle}>Дневник</Text>
                    <Text style={styles.trackFeatureDesc}>Твоя история</Text>
                  </View>
                  <View style={styles.trackFeatureCard}>
                    <FontAwesome5 name="chart-line" size={28} color="#2563eb" solid style={styles.trackFeatureIcon} />
                    <Text style={styles.trackFeatureTitle}>Графики</Text>
                    <Text style={styles.trackFeatureDesc}>Визуальный прогресс</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.trackButton} onPress={nextScreen}>
                  <LinearGradient
                    colors={['#ec4899', '#ea580c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.trackButtonGradient}
                  >
                    <Text style={styles.trackButtonText}>Готова отслеживать</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        );
      case 4:
        return (
          <LinearGradient
            colors={['#f0f9ff', '#f0fdfa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fullScreen}
          >
            <View style={styles.onboardingContent}>
              <OnboardingCard
                image={require('../../../../assets/images/onboarding_support.png')}
                step={currentScreen}
                totalSteps={4}
                title={getStepTitle()}
                onSkip={skipOnboarding}
                progressAnim={progressAnim}
              />
              <View style={styles.supportContentContainer}>
                <Text style={styles.supportTitleRow}>
                  <Text style={styles.supportTitleBlack}>Найди свою </Text>
                  <Text style={styles.supportTitleBlue}>поддержку</Text>
                </Text>
                <Text style={styles.supportDesc}>
                  Присоединяйся к сообществу будущих мам, делись опытом и получай поддержку от тех, кто понимает.
                </Text>
                <View style={styles.supportFeatureList}>
                  <View style={styles.supportFeatureCard}>
                    <View style={[styles.supportIconCircle, { backgroundColor: '#2563eb' }]}> 
                      <FontAwesome5 name="users" size={18} color="#fff" solid />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.supportFeatureTitle}>Группы по неделям</Text>
                      <Text style={styles.supportFeatureDesc}>Общайся с мамами на том же сроке</Text>
                    </View>
                  </View>
                  <View style={styles.supportFeatureCard}>
                    <View style={[styles.supportIconCircle, { backgroundColor: '#059669' }]}> 
                      <FontAwesome5 name="comments" size={18} color="#fff" solid />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.supportFeatureTitle}>Чаты по интересам</Text>
                      <Text style={styles.supportFeatureDesc}>Питание, спорт, подготовка к родам</Text>
                    </View>
                  </View>
                  <View style={styles.supportFeatureCard}>
                    <View style={[styles.supportIconCircle, { backgroundColor: '#8b5cf6' }]}> 
                      <FontAwesome5 name="heart" size={18} color="#fff" solid />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.supportFeatureTitle}>Поддержка 24/7</Text>
                      <Text style={styles.supportFeatureDesc}>Кто-то всегда онлайн и готов помочь</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.supportButton} onPress={nextScreen}>
                  <LinearGradient
                    colors={['#2563eb', '#8b5cf6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.supportButtonGradient}
                  >
                    <Text style={styles.supportButtonText}>Начать использовать BabyJoy</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        );

      default:
        return null;
    }
  };

  
  return (
    <View style={{ flex: 1 }}>
      {renderOnboardingScreen()}
      
      
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  onboardingContent: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-start',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Полупрозрачная подложка
  },
  headerLogo: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937', // Темный текст вместо белого
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressContainer: {
    position: 'absolute',
    top: 116, // Ниже хедера с подложкой
    left: 0,
    right: 0,
    zIndex: 40,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Полупрозрачная подложка
    paddingVertical: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressStep: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressTitle: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  screenContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 180, // Больше отступ для хедера и прогресса
  },
  heroImageContainer: {
    marginBottom: 32,
    shadowColor: '#fbcfe8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 8,
  },
  heroImage: {
    width: 320,
    height: 320,
    borderRadius: 24,
  },
  heroText: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  brandText: {
    color: '#ec4899',
  },
  emeraldText: {
    color: '#059669',
  },
  pinkText: {
    color: '#ec4899',
  },
  blueText: {
    color: '#2563eb',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  bottomSection: {
    width: '100%',
    gap: 24,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  featureIcon: {
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  aiFeaturesList: {
    gap: 12,
  },
  aiFeatureItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
  },
  aiFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiFeatureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 12,
  },
  aiFeatureDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  trackingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  trackingCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  trackingIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#fce7f3',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  trackingDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  communityFeatures: {
    gap: 12,
  },
  communityFeatureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#dbeafe',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  communityFeatureText: {
    flex: 1,
  },
  communityFeatureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  communityFeatureSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  startButton: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Registration styles
  registrationContainer: {
    flex: 1,
  },
  registrationContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  registrationHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  registrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  registrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  registrationSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
    position: 'relative',
    zIndex: 1, // Низкий zIndex для обычных полей
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  pregnancyWeekContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  trimesterContainer: {
    width: 120,
    position: 'relative',
    zIndex: 99999, // Максимальный zIndex для контейнера
  },
  trimesterDropdown: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  trimesterText: {
    fontSize: 16,
    color: '#1f2937',
  },
  trimesterOptions: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#ec4899',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
    zIndex: 99999,
  },
  trimesterOption: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#ec4899',
    backgroundColor: '#ffffff',
  },
  trimesterOptionText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '700',
  },
  weekInputSeparate: {
    width: 100,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    minHeight: 52,
  },
  pregnancyOptionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  pregnancyOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  selectedPregnancyOption: {
    borderColor: '#ec4899',
    backgroundColor: '#fef2f2',
  },
  pregnancyOptionIcon: {
    marginBottom: 8,
  },
  pregnancyOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestOption: {
    width: '47%',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  selectedInterestOption: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  interestIcon: {
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  registrationFooter: {
    paddingTop: 32,
    gap: 16,
  },
  completeButton: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completeButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#ec4899',
    textDecorationLine: 'underline',
  },
  // Subscription styles
  subscriptionContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  subscriptionHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  subscriptionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subscriptionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  plansContainer: {
    flex: 1,
    gap: 16,
  },
  freePlan: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  premiumPlan: {
    borderRadius: 24,
    padding: 24,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  premiumPlanName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  premiumPrice: {
    alignItems: 'flex-end',
  },
  premiumPriceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  premiumPricePeriod: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  planFeatures: {
    gap: 8,
    marginBottom: 24,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planFeatureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  freePlanButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  freePlanButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  premiumPlanButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  premiumPlanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  subscriptionDisclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  // Permissions styles
  permissionsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  permissionsHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  permissionsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permissionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  permissionsSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  permissionsContent: {
    flex: 1,
  },
  permissionCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#2563eb',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  permissionsFooter: {
    paddingVertical: 16,
    gap: 16,
  },
  continueButton: {
    width: '100%',
    borderRadius: 16,
  },
  continueButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  skipPermissionsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Tutorial styles
  tutorialContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  tutorialHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  tutorialIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  tutorialSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  tutorialContent: {
    flex: 1,
  },
  tutorialCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  tutorialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tutorialCardIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#fce7f3',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tutorialCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  tutorialCardText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  tutorialExample: {
    backgroundColor: '#fce7f3',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tutorialExampleIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#fbb6ce',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialExampleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  tutorialExampleQuestion: {
    fontSize: 14,
    color: '#6b7280',
  },
  tutorialExampleBot: {
    width: 48,
    height: 48,
    backgroundColor: '#8b5cf6',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmojis: {
    flexDirection: 'row',
    gap: 8,
  },
  moodEmoji: {
    fontSize: 18,
  },
  finishButton: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  finishButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingImageContainer: {
    marginBottom: 32,
  },
  loadingImage: {
    width: 240,
    height: 240,
    borderRadius: 24,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  loadingBars: {
    width: '100%',
    gap: 16,
  },
  loadingBarItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
  },
  loadingBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loadingBarTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  loadingBarPercent: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  loadingBarTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  loadingBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  onboardingCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    marginTop: 48,
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressContainerCard: {
    width: '100%',
    marginBottom: 16,
  },
  heroImageContainerCard: {
    marginBottom: 0,
    width: 220,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fbcfe8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 8,
  },
  heroImageCard: {
    width: 220,
    height: 220,
    borderRadius: 24,
  },
  screenContentContainerCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 32,
    width: '100%',
  },
  floatingHeaderNew: {
    marginTop: 48,
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 50,
  },
  progressContainerNew: {
    marginTop: 8,
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 40,
  },
  htmlHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 8,
  },
  htmlHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  htmlHeaderIconBg: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Можно добавить blur через backdropFilter, если поддерживается
  },
  htmlSkipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  htmlProgressSection: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    zIndex: 40,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 0,
  },
  htmlProgressBarBg: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 16,
    height: 8,
    overflow: 'hidden',
  },
  htmlProgressBarFill: {
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 8,
  },
  htmlProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  htmlProgressStep: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  htmlProgressTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 32,
    marginTop: 32,
    marginHorizontal: 16,
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 12,
  },
  cardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  skipTextCard: {
    color: 'rgba(0,0,0,0.18)',
    fontSize: 14,
    fontWeight: '500',
  },
  cardImageWrapper: {
    width: 320,
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 0,
  },
  cardImage: {
    width: 320,
    height: 320,
    borderRadius: 24,
  },
  cardProgressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  cardProgressBarBg: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    height: 6,
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 6,
  },
  cardProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  cardProgressStep: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.18)',
    fontWeight: '500',
  },
  cardProgressTitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.18)',
    fontWeight: '500',
  },
  heroTitleCard: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#23232B',
    textAlign: 'center',
    marginBottom: 8,
  },
  brandTextCard: {
    color: '#ec4899',
    fontWeight: 'bold',
  },
  heroSubtitleCard: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 0,
    lineHeight: 22,
  },
  featuresRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  featureCardCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#fbcfe8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  featureIconCard: {
    marginBottom: 8,
  },
  featureLabelCard: {
    fontSize: 13,
    fontWeight: '500',
    color: '#23232B',
    textAlign: 'center',
  },
  startButtonCard: {
    width: '100%',
    borderRadius: 20,
    marginTop: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonGradientCard: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  startButtonTextCard: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  visualCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    marginTop: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 12,
    padding: 0,
    // фиксированные целочисленные размеры для чётких краёв при масштабировании
    width: Math.round(Math.min(width - 32, 360)),
    height: Math.round(Math.min(width - 32, 360)),
    alignSelf: 'center',
    overflow: 'hidden', // чтобы картинка не выходила за края
  },
  visualCardImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    margin: 0,
    padding: 0,
  },
  visualCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    margin: 0,
    padding: 0,
  },
  visualOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 24,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  visualHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  visualHeartIcon: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 20,
    width: width >= 380 ? 36 : 32,
    height: width >= 380 ? 36 : 32,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    paddingTop: 8,
  },
  visualSkipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  visualProgressBarBg: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 8,
    height: 6,
    overflow: 'hidden',
    marginTop: 4,
  },
  visualProgressBarFill: {
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 6,
  },
  visualProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  visualProgressStep: {
    fontSize: width >= 380 ? 13 : 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  visualProgressTitle: {
    fontSize: width >= 380 ? 13 : 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  screenContentContainerVisual: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    width: '100%',
  },
  heroTitleVisual: {
    fontSize: width >= 380 ? 30 : 24,
    fontWeight: 'bold',
    color: '#23232B',
    textAlign: 'center',
    marginBottom: 6,
  },
  brandTextVisual: {
    color: '#ec4899',
    fontWeight: 'bold',
  },
  heroSubtitleVisual: {
    fontSize: 18,
    color: '#4b5563',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 0,
    lineHeight: 28,
    fontWeight: '400',
  },
  featuresRowVisual: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    gap: 10,
  },
  featureCardVisual: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#fbcfe8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  featureIconVisual: {
    marginBottom: 8,
  },
  featureLabelVisual: {
    fontSize: width >= 380 ? 14 : 12,
    fontWeight: '400',
    color: '#4b5563',
    textAlign: 'center',
  },
  startButtonVisual: {
    width: '100%',
    borderRadius: 20,
    marginTop: 0,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonGradientVisual: {
    paddingVertical: width >= 380 ? 16 : 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  startButtonTextVisual: {
    fontSize: width >= 380 ? 18 : 16,
    fontWeight: '600',
    color: '#fff',
  },
  trackTitleRow: {
    flexDirection: 'row',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trackTitleBlack: {
    color: '#23232B',
    fontWeight: 'bold',
    fontSize: 26,
  },
  trackTitlePink: {
    color: '#ec4899',
    fontWeight: 'bold',
    fontSize: 26,
  },
  trackDesc: {
    fontSize: 17,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 0,
    lineHeight: 26,
    fontWeight: '400',
  },
  trackGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  trackFeatureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  trackFeatureIcon: {
    marginBottom: 8,
  },
  trackFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#23232B',
    textAlign: 'center',
    marginBottom: 2,
  },
  trackFeatureDesc: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  trackButton: {
    width: '100%',
    borderRadius: 20,
    marginTop: 0,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 8,
  },
  trackButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  trackButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  supportContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    width: '100%',
  },
  supportTitleRow: {
    flexDirection: 'row',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  supportTitleBlack: {
    color: '#23232B',
    fontWeight: 'bold',
    fontSize: 26,
  },
  supportTitleBlue: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 26,
  },
  supportDesc: {
    fontSize: 17,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 0,
    lineHeight: 26,
    fontWeight: '400',
  },
  supportFeatureList: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  supportFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  supportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  supportFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#23232B',
    marginBottom: 2,
  },
  supportFeatureDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  supportButton: {
    width: '100%',
    borderRadius: 20,
    marginTop: 0,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 8,
  },
  supportButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  supportButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  // AI screen styles
  aiContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    width: '100%',
  },
  aiTitleRow: {
    flexDirection: 'row',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aiTitleBlack: {
    color: '#23232B',
    fontWeight: 'bold',
    fontSize: 26,
  },
  aiTitleGreen: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 26,
  },
  aiDesc: {
    fontSize: 17,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 0,
    lineHeight: 26,
    fontWeight: '400',
  },
  aiFeatureList: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  aiFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  aiIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aiFeatureTitleNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#23232B',
    marginBottom: 2,
  },
  aiFeatureDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  aiButton: {
    width: '100%',
    borderRadius: 20,
    marginTop: 0,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  aiButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  // Глобальный dropdown overlay
  globalDropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.5)', // Красный полупрозрачный фон для отладки
  },
  globalDropdownList: {
    width: 200,
    backgroundColor: 'yellow', // Желтый фон для отладки
    borderWidth: 5,
    borderColor: 'blue',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 100,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#3b82f6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  dropdownItemTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  // Стили для выбора даты
  datePickerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: '#374151',
  },
  // Error styles
  errorInput: {
    borderColor: '#ef4444',
  },
  errorOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorGroup: {
    borderColor: '#ef4444',
  },
  // Убраны старые стили для отдельных экранов 5-6
  // Physical data styles for registration screen
  // ПРОСТЫЕ и ЕСТЕСТВЕННЫЕ поля
  compactPhysicalData: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  compactControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactButton: {
    width: 28,
    height: 28,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  compactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 70,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bmiResultText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  // Warning styles
  weightWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  weightWarningText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
    lineHeight: 16,
  },
  // Weight method selection styles
  weightMethodSelection: {
    marginTop: 16,
  },
  weightMethodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  weightMethodOptions: {
    gap: 12,
  },
  weightMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  selectedWeightMethod: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  weightMethodContent: {
    flex: 1,
  },
  weightMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  weightMethodDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  calculationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  calculationText: {
    fontSize: 12,
    color: '#1e40af',
    flex: 1,
    fontWeight: '500',
  },
  // Gain info styles
  gainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  gainText: {
    fontSize: 12,
    color: '#15803d',
    flex: 1,
    fontWeight: '600',
  },
  // Optional value style
  optionalValue: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
});