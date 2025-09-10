import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing, Image } from 'react-native';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../shared/store';
const pregnancyData = require('../../../../assets/images/pregnancyData.json');

const { width } = Dimensions.get('window');

// Используем данные из JSON файла
const getWeekData = (week: number) => {
  const weekInfo = pregnancyData.pregnancyWeeks.find((w: any) => w.week === week);
  if (!weekInfo) return null;
  
  return {
    week: weekInfo.week,
    fruitName: weekInfo.babySize.fruitComparison,
    length: `${weekInfo.babySize.lengthCm} см`,
    weight: `${weekInfo.babySize.weightGrams} г`,
    iconName: weekInfo.babySize.iconName as keyof typeof FontAwesome5.glyphMap,
    color: weekInfo.babySize.cardColor,
    emoji: weekInfo.babySize.fruitEmoji,
    development: weekInfo.development,
    momChanges: weekInfo.momChanges,
  };
};

// Получаем недели для слайдера (текущая +/- 3)
const getSliderWeeksData = (currentWeek: number) => {
  const start = Math.max(1, currentWeek - 3);
  const end = Math.min(42, currentWeek + 3);
  
  const weeks = [];
  for (let i = start; i <= end; i++) {
    const weekInfo = pregnancyData.pregnancyWeeks.find((w: any) => w.week === i);
    if (weekInfo) {
      weeks.push({
        week: weekInfo.week,
        fruitName: weekInfo.babySize.fruitComparison,
        length: `${weekInfo.babySize.lengthCm} см`,
        weight: `${weekInfo.babySize.weightGrams} г`,
        iconName: weekInfo.babySize.iconName as keyof typeof FontAwesome5.glyphMap,
        color: weekInfo.babySize.cardColor,
        emoji: weekInfo.babySize.fruitEmoji,
      });
    }
  }
  return weeks;
};

type TabType = 'development' | 'mom' | 'tips';

export const CalendarScreen: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(23);
  const [activeTab, setActiveTab] = useState<TabType>('development');
  const [checklistItems, setChecklistItems] = useState<{[key: string]: boolean}>({});
  
  // Получаем данные пользователя из Redux store
  const pregnancy = useSelector((state: RootState) => state.pregnancy.pregnancy);
  
  // Данные пользователя для расчета ИМТ
  const prePregnancyWeight = pregnancy?.prePregnancyWeight || 68.5; // кг - вес ДО беременности  
  const [currentWeight, setCurrentWeight] = useState(70.2); // кг - текущий вес (будет из дневника)
  const userHeight = pregnancy?.height || 165; // см - рост из онбординга

  // Определяем текущий триместр
  const getCurrentTrimester = () => {
    if (currentWeek <= 12) return 't1';
    if (currentWeek <= 27) return 't2';
    return 't3';
  };

  // Расчет дат для любой недели беременности (динамический)
  const getWeekDates = (week: number = currentWeek) => {
    // Примерная дата начала беременности (можно будет настраивать)
    const startDate = new Date('2024-01-01'); // Начало последней менструации
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (week - 1) * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const day = date.getDate();
      const month = date.toLocaleDateString('ru', { month: 'long' });
      return `${day} ${month}`;
    };
    
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  // Расчет ИМТ и категории веса (на основе веса ДО беременности)
  const getBMICategory = () => {
    const heightInMeters = userHeight / 100;
    const bmi = prePregnancyWeight / (heightInMeters * heightInMeters);
    
    console.log(`🔍 ИМТ расчет: ${prePregnancyWeight}кг / (${userHeight}см)² = ${Math.round(bmi * 100) / 100}`);
    
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';  
    if (bmi < 30) return 'overweight';
    return 'obese';
  };

  // Рассчитываем РЕАЛЬНУЮ прибавку веса
  const getRealWeightGain = () => {
    return Math.round((currentWeight - prePregnancyWeight) * 10) / 10;
  };

  // Получаем полную информацию о весе: реальная vs рекомендуемая
  const getWeightAnalysis = () => {
    const category = getBMICategory();
    const bmi = Math.round((prePregnancyWeight / Math.pow(userHeight/100, 2)) * 10) / 10;
    const realGain = getRealWeightGain();
    
    console.log(`📊 Анализ веса на ${currentWeek} неделе:`);
    console.log(`Начальный: ${prePregnancyWeight} кг | Текущий: ${currentWeight} кг | Прибавка: ${realGain} кг`);
    console.log(`ИМТ: ${bmi} | Категория: ${category}`);
    
    // Медицинские рекомендации по ИМТ
    const recommendations = {
      underweight: { total: '12.5-18 кг', weeklyRate: 0.5, maxTotal: 18 },
      normal: { total: '11.5-16 кг', weeklyRate: 0.4, maxTotal: 16 },
      overweight: { total: '7-11.5 кг', weeklyRate: 0.3, maxTotal: 11.5 },
      obese: { total: '5-9 кг', weeklyRate: 0.25, maxTotal: 9 }
    };
    
    const categoryData = recommendations[category as keyof typeof recommendations];
    
    // ОЖИДАЕМАЯ прибавка для данной недели
    let expectedGain = 0;
    if (currentWeek <= 12) {
      expectedGain = currentWeek * categoryData.weeklyRate * 0.3;
    } else if (currentWeek <= 27) {
      const firstTrimesterGain = 12 * categoryData.weeklyRate * 0.3;
      const secondTrimesterWeeks = currentWeek - 12;
      expectedGain = firstTrimesterGain + (secondTrimesterWeeks * categoryData.weeklyRate);
    } else {
      const firstTrimesterGain = 12 * categoryData.weeklyRate * 0.3;
      const secondTrimesterGain = 15 * categoryData.weeklyRate;
      const thirdTrimesterWeeks = currentWeek - 27;
      expectedGain = firstTrimesterGain + secondTrimesterGain + (thirdTrimesterWeeks * categoryData.weeklyRate * 0.8);
    }
    expectedGain = Math.round(expectedGain * 10) / 10;
    
    // Сравнение реальной и ожидаемой прибавки
    const difference = realGain - expectedGain;
    const percentProgress = (realGain / categoryData.maxTotal) * 100;
    
    let status = '';
    let statusColor = '';
    
    if (Math.abs(difference) <= 0.5) {
      status = '✅ Идеально в норме';
      statusColor = '#10b981';
    } else if (realGain < expectedGain - 0.5) {
      status = '⚠️ Недостаточная прибавка';
      statusColor = '#f59e0b';
    } else if (realGain > expectedGain + 1) {
      status = '🚨 Превышение нормы';
      statusColor = '#ef4444';
    } else {
      status = '✅ В норме';
      statusColor = '#10b981';
    }
    
    return {
      realGain,
      expectedGain,
      difference: Math.round(difference * 10) / 10,
      recommended: categoryData.total,
      maxTotal: categoryData.maxTotal,
      category,
      bmi,
      status,
      statusColor,
      percentProgress: Math.round(percentProgress),
      categoryName: category === 'normal' ? 'норма' : 
                   category === 'underweight' ? 'недовес' : 
                   category === 'overweight' ? 'избыток' : 'ожирение'
    };
  };

  // Animation for baby image
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation for baby image
    const animate = () => {
      Animated.sequence([
        Animated.spring(floatAnim, {
          toValue: -6,
          useNativeDriver: true,
          tension: 10,
          friction: 8,
        }),
        Animated.spring(floatAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 10,
          friction: 8,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [floatAnim]);

  const getCurrentWeekData = () => {
    const info = getWeekData(currentWeek);
    // Если данных нет - показываем ошибку вместо fallback
    if (!info) {
      console.error(`No data found for week ${currentWeek}`);
      return null;
    }
    return info;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentWeek > 1) {
      setCurrentWeek(currentWeek - 1);
    } else if (direction === 'next' && currentWeek < 42) {
      setCurrentWeek(currentWeek + 1);
    }
  };

  const toggleChecklistItem = (item: string) => {
    setChecklistItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const renderTabContent = () => {
    const weekInfo = getCurrentWeekData();
    
    // Если нет данных для недели - показываем ошибку
    if (!weekInfo) {
      return (
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-triangle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Данные для {currentWeek} недели не найдены</Text>
          <Text style={styles.errorSubtext}>Попробуйте выбрать другую неделю</Text>
        </View>
      );
    }
    
    switch (activeTab) {
      case 'development':
        return (
          <ScrollView 
            style={styles.tabContent} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.developmentCard}>
              <View style={styles.babyImageContainer}>
                <Animated.View 
                  style={[
                    styles.babyImage, 
                    { backgroundColor: weekInfo.color },
                    { transform: [{ translateY: floatAnim }] }
                  ]}
                >
                  <FontAwesome5 name={weekInfo.iconName} size={32} color="#1f2937" />
                </Animated.View>
                <View style={styles.weekBadge}>
                  <Text style={styles.weekBadgeText}>{currentWeek} неделя</Text>
                </View>
              </View>
              
              <Text style={styles.developmentTitle}>Развитие на {currentWeek} неделе</Text>
              <Text style={styles.developmentSubtitle}>{weekInfo.development.mainFocus}</Text>
              
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{weekInfo.length}</Text>
                  <Text style={styles.statLabel}>длина</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{weekInfo.weight}</Text>
                  <Text style={styles.statLabel}>вес</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>Как {weekInfo.fruitName.toLowerCase()}</Text>
                  <Text style={styles.statLabel}>размер</Text>
                </View>
              </View>
            </View>

            <View style={styles.developmentDetails}>
              <View style={[styles.detailCard, styles.pinkGradientCard]}>
                <View style={styles.detailIcon}>
                  <FontAwesome5 name="brain" size={28} color="#ec4899" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailTitle}>Мозг и нервная система</Text>
                  <Text style={styles.detailText}>{weekInfo.development.brainSystem}</Text>
                  {weekInfo.development.weekMilestones.length >= 2 && (
                  <View style={styles.detailFeatures}>
                    <View style={styles.featureItem}>
                      <View style={styles.featureDot} />
                        <Text style={styles.featureText}>{(weekInfo.development.weekMilestones || [])[0]}</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <View style={styles.featureDot} />
                        <Text style={styles.featureText}>{(weekInfo.development.weekMilestones || [])[1]}</Text>
                    </View>
                  </View>
                  )}
                </View>
              </View>

              <View style={[styles.detailCard, styles.mintGradientCard]}>
                <View style={[styles.detailIcon, { backgroundColor: '#ecfdf5' }]}>
                  <FontAwesome5 name="lungs" size={28} color="#10b981" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailTitle}>Дыхательная система</Text>
                  <Text style={styles.detailText}>{weekInfo.development.respiratorySystem}</Text>
                  {(weekInfo.development.weekMilestones || []).length > 2 && (
                  <View style={styles.importantNote}>
                    <Text style={styles.noteTitle}>Важно знать:</Text>
                      <Text style={styles.noteText}>{(weekInfo.development.weekMilestones || [])[2]}</Text>
                  </View>
                  )}
                </View>
              </View>

              <View style={[styles.detailCard, styles.blueGradientCard]}>
                <View style={[styles.detailIcon, { backgroundColor: '#eff6ff' }]}>
                  <FontAwesome5 name="hand-rock" size={24} color="#3b82f6" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailTitle}>Движения и рефлексы</Text>
                  <Text style={styles.detailText}>{weekInfo.development.movementSystem}</Text>
                  {weekInfo.development.weekMilestones.length >= 2 && (
                  <View style={styles.movementTypes}>
                    <View style={styles.movementItem}>
                        <Text style={styles.movementEmoji}>{weekInfo.emoji}</Text>
                        <Text style={styles.movementText}>{(weekInfo.development.weekMilestones || [])[0]}</Text>
                    </View>
                    <View style={styles.movementItem}>
                      <Text style={styles.movementEmoji}>🤱</Text>
                        <Text style={styles.movementText}>{(weekInfo.development.weekMilestones || [])[1]}</Text>
                    </View>
                  </View>
                  )}
                </View>
              </View>

              <View style={[styles.detailCard, styles.orangeGradientCard]}>
                <View style={[styles.detailIcon, { backgroundColor: '#fff7ed' }]}>
                  <FontAwesome5 name="weight" size={24} color="#f59e0b" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailTitle}>Рост и вес</Text>
                  <Text style={styles.detailText}>{weekInfo.development.growthSystem}</Text>
                  <View style={styles.growthStats}>
                    <View style={styles.growthItem}>
                      <Text style={styles.growthValue}>{weekInfo.length.replace(' см', '')}</Text>
                      <Text style={styles.growthLabel}>см длина</Text>
                    </View>
                    <View style={styles.growthItem}>
                      <Text style={styles.growthValue}>{weekInfo.weight.replace(' г', '')}</Text>
                      <Text style={styles.growthLabel}>г вес</Text>
                    </View>
                    <View style={styles.growthItem}>
                      <Text style={styles.growthValue}>+15%</Text>
                      <Text style={styles.growthLabel}>рост/неделя</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Key Milestones */}
            <View style={styles.milestonesCard}>
              <View style={styles.milestonesHeader}>
                <FontAwesome5 name="star" size={18} color="#a855f7" solid />
                <Text style={styles.milestonesTitle}>Ключевые достижения недели</Text>
              </View>
              <View style={styles.milestonesList}>
                {(weekInfo.development.weekMilestones || []).map((milestone: string, index: number) => (
                  <View key={index} style={styles.milestoneItem}>
                  <View style={styles.milestoneCheck}>
                    <FontAwesome5 name="check" size={10} color="#a855f7" />
                  </View>
                    <Text style={styles.milestoneText}>{milestone}</Text>
                </View>
                ))}
              </View>
            </View>
          </ScrollView>
        );

      case 'mom':
        return (
          <ScrollView 
            style={styles.tabContent} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.momCard}>
              <View style={styles.momHeader}>
                <View style={styles.momImageContainer}>
                  <Image 
                    source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/574722a7ee-4c854c44329414afeccc.png' }}
                    style={styles.momImage}
                    resizeMode="cover"
                  />
                </View>
              <Text style={styles.momTitle}>Изменения в организме мамы</Text>
                <Text style={styles.momSubtitle}>{weekInfo.momChanges.mainBodyChange}</Text>
              </View>
              
              <View style={styles.momDetails}>
                <View style={[styles.momDetailCard, styles.pinkGradientCard]}>
                  <View style={styles.momIcon}>
                    <FontAwesome5 name="baby" size={24} color="#ec4899" />
                  </View>
                  <View style={styles.momContent}>
                    <Text style={styles.momDetailTitle}>Размер живота</Text>
                    <Text style={styles.momDetailText}>{weekInfo.momChanges.mainBodyChange}</Text>
                  </View>
                </View>

                <View style={[styles.momDetailCard, styles.mintGradientCard]}>
                  <View style={[styles.momIcon, { backgroundColor: '#ecfdf5' }]}>
                    <FontAwesome5 name="heartbeat" size={24} color="#10b981" />
                  </View>
                  <View style={styles.momContent}>
                    <Text style={styles.momDetailTitle}>Симптомы недели</Text>
                    <View style={styles.momSymptomsList}>
                      {(weekInfo.momChanges.specificSymptoms || []).map((symptom: string, index: number) => (
                        <Text key={index} style={styles.momSymptomItem}>• {symptom}</Text>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={[styles.momDetailCard, styles.blueGradientCard]}>
                  <View style={[styles.momIcon, { backgroundColor: '#eff6ff' }]}>
                    <FontAwesome5 name="bed" size={24} color="#3b82f6" />
                  </View>
                  <View style={styles.momContent}>
                    <Text style={styles.momDetailTitle}>Размер живота</Text>
                    <Text style={styles.momDetailText}>Обхват: {weekInfo.momChanges.bellyCircumference} см</Text>
                  </View>
                </View>

                <View style={[styles.momDetailCard, styles.orangeGradientCard]}>
                  <View style={[styles.momIcon, { backgroundColor: '#fff7ed' }]}>
                    <FontAwesome5 name="weight" size={24} color="#f59e0b" />
                  </View>
                  <View style={styles.momContent}>
                    <Text style={styles.momDetailTitle}>Прибавка веса</Text>
                    <Text style={styles.momDetailText}>
                      {(() => {
                        const analysis = getWeightAnalysis();
                        return `Факт: +${analysis.realGain} кг | Норма: +${analysis.expectedGain} кг | ИМТ: ${analysis.bmi} (${analysis.categoryName})`;
                      })()}
                    </Text>
                    <View style={styles.weightProgress}>
                      <View style={styles.weightInfo}>
                        <Text style={styles.weightLabel}>Анализ прибавки веса:</Text>
                        <Text style={[styles.weightStatus, { color: getWeightAnalysis().statusColor }]}>
                          {getWeightAnalysis().status}
                        </Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { 
                            width: `${Math.min(getWeightAnalysis().percentProgress, 100)}%`,
                            backgroundColor: getWeightAnalysis().statusColor
                          }]} />
                        </View>
                        <Text style={styles.progressText}>
                          Факт: {getWeightAnalysis().realGain} кг | Ожидается: {getWeightAnalysis().expectedGain} кг
                        </Text>
                        <Text style={styles.progressWeeklyText}>
                          {getWeightAnalysis().difference > 0 
                            ? `↗️ На ${Math.abs(getWeightAnalysis().difference)} кг больше нормы` 
                            : getWeightAnalysis().difference < 0 
                            ? `↙️ На ${Math.abs(getWeightAnalysis().difference)} кг меньше нормы`
                            : '✅ Точно по норме'}
                        </Text>
                        
                        {/* Убрана вся отладочная информация */}
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.symptomsCard}>
                  <View style={styles.symptomsHeader}>
                    <FontAwesome5 name="exclamation-circle" size={18} color="#a855f7" />
                    <Text style={styles.symptomsTitle}>Частые симптомы на {currentWeek} неделе</Text>
                  </View>
                  <View style={styles.symptomsList}>
                    {(weekInfo.momChanges.specificSymptoms || []).slice(0, 4).map((symptom: string, index: number) => {
                      const icons = ['fire', 'tired', 'shoe-prints', 'dizzy'];
                      const colors = ['#ef4444', '#3b82f6', '#3b82f6', '#f59e0b'];
                      return (
                        <View key={index} style={styles.symptomItem}>
                          <FontAwesome5 name={icons[index] as any} size={24} color={colors[index]} />
                          <Text style={styles.symptomText}>{symptom}</Text>
                    </View>
                      );
                    })}
                  </View>
                </View>

                {/* Changes Timeline */}
                <View style={styles.timelineCard}>
                  <Text style={styles.timelineTitle}>Изменения по дням недели</Text>
                  <View style={styles.timelineList}>
                    {(weekInfo.momChanges.weeklyBodyChanges || []).slice(0, 7).map((change: string, index: number) => {
                      const colors = ['#fef3f2', '#fff7ed', '#fffbeb', '#ecfdf5', '#f0fdfa', '#eff6ff', '#faf5ff'];
                      return (
                        <View key={index} style={styles.timelineItem}>
                          <View style={[styles.timelineDay, { backgroundColor: colors[index] }]}>
                            <Text style={styles.timelineDayNumber}>{index + 1}</Text>
                      </View>
                          <View style={[styles.timelineContent, { backgroundColor: colors[index] }]}>
                            <Text style={styles.timelineDescription}>{change}</Text>
                      </View>
                    </View>
                      );
                    })}
                      </View>
                </View>
              </View>
            </View>
          </ScrollView>
        );

      case 'tips':
        const trimester = getCurrentTrimester();
        const nutritionData = pregnancyData.nutritionByTrimester[trimester];
        const activityData = pregnancyData.activityByTrimester[trimester];
        const weeklyTasks = weekInfo.momChanges.dailyTasks || [];
        
        return (
          <ScrollView 
            style={styles.tabContent} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.tipsHeaderCard}>
              <View style={styles.tipsIconContainer}>
                <FontAwesome5 name="lightbulb" size={32} color="#ffffff" />
              </View>
              <Text style={styles.tipsMainTitle}>Рекомендации на {currentWeek} неделю</Text>
              <Text style={styles.tipsMainSubtitle}>
                {(() => {
                  if (currentWeek <= 8) return 'Формирование органов малыша';
                  if (currentWeek <= 12) return 'Завершение первого триместра';
                  if (currentWeek <= 16) return 'Начало золотого периода';
                  if (currentWeek <= 20) return 'Экватор беременности';
                  if (currentWeek <= 24) return 'Активный рост и УЗИ';
                  if (currentWeek <= 28) return 'Тест на диабет';
                  if (currentWeek <= 32) return 'Начало третьего триместра';
                  if (currentWeek <= 36) return 'Подготовка к родам';
                  return 'Готовность к рождению';
                })()}
              </Text>
            </View>

            <View style={styles.tipsCard}>
              <View style={styles.nutritionSection}>
                <View style={styles.nutritionSectionHeader}>
                  <FontAwesome5 name="apple-alt" size={18} color="#10b981" />
                  <Text style={styles.nutritionSectionTitle}>Питание ({(() => {
                    if (currentWeek <= 12) return 'норма калорий';
                    if (currentWeek <= 24) return '+300 ккал/день';
                    if (currentWeek <= 32) return '+350 ккал/день';
                    return '+400 ккал/день';
                  })()})</Text>
                </View>
                
                <View style={styles.ironProductsCard}>
                  <Text style={styles.ironProductsTitle}>Ежедневные рекомендации</Text>
                  <Text style={styles.ironProductsSubtitle}>Специально для {currentWeek} недели:</Text>
                  
                  <View style={styles.dailyTasksList}>
                    {weeklyTasks.map((task: string, index: number) => {
                      const icons = ['pills', 'dumbbell', 'comments'];
                      const colors = ['#ef4444', '#10b981', '#3b82f6'];
                      return (
                        <View key={index} style={styles.dailyTaskItem}>
                          <FontAwesome5 name={icons[index] as any || 'check'} size={16} color={colors[index] || '#6b7280'} />
                          <Text style={styles.dailyTaskText}>{task}</Text>
                </View>
                      );
                    })}
                </View>
              </View>

                <View style={styles.calciumCard}>
                  <Text style={styles.calciumTitle}>Ключевые питательные вещества</Text>
                  <Text style={styles.calciumSubtitle}>
                    {(() => {
                      if (currentWeek <= 8) return 'Критический период формирования органов';
                      if (currentWeek <= 12) return 'Основа здорового развития';
                      if (currentWeek <= 16) return 'Активное усвоение питательных веществ';
                      if (currentWeek <= 20) return 'Для активного роста малыша';
                      if (currentWeek <= 24) return 'Период быстрого набора веса';
                      if (currentWeek <= 28) return 'Контроль уровня сахара в крови';
                      if (currentWeek <= 32) return 'Формирование костей и мозга';
                      if (currentWeek <= 36) return 'Подготовка к родам и лактации';
                      return 'Финальная подготовка организма';
                    })()}
                  </Text>
                  
                  <View style={styles.calciumInfo}>
                    <View style={styles.nutritionNutrients}>
                      {(nutritionData?.keyNutrients || []).map((nutrient: string, index: number) => (
                        <Text key={index} style={styles.nutrientItem}>• {nutrient}</Text>
                      ))}
                      <Text style={styles.nutrientItem}>• Калорийность: {(() => {
                        if (currentWeek <= 12) return nutritionData?.calories || 'норма';
                        if (currentWeek <= 24) return '+300 ккал/день';
                        if (currentWeek <= 32) return '+350 ккал/день';
                        return '+400 ккал/день';
                      })()}</Text>
                </View>
                </View>
              </View>

                <View style={styles.nutritionModeCard}>
                  <Text style={styles.nutritionModeTitle}>Специально для {currentWeek} недели</Text>
                  
                  <View style={styles.nutritionModeList}>
                    {(() => {
                      if (currentWeek <= 8) return [
                        { icon: 'pills', text: 'Фолиевая кислота 800мкг обязательно', color: '#ef4444' },
                        { icon: 'apple-alt', text: 'Малые порции против тошноты', color: '#f59e0b' },
                        { icon: 'bed', text: 'Больше отдыха при токсикозе', color: '#3b82f6' }
                      ];
                      if (currentWeek <= 16) return [
                        { icon: 'dumbbell', text: 'Железо + витамины для энергии', color: '#ef4444' },
                        { icon: 'utensils', text: 'Увеличить белок в рационе', color: '#f59e0b' },
                        { icon: 'walking', text: 'Начать активные прогулки', color: '#10b981' }
                      ];
                      if (currentWeek <= 24) return [
                        { icon: 'fish', text: 'Омега-3 для мозга малыша', color: '#3b82f6' },
                        { icon: 'swimmer', text: 'Плавание или йога активно', color: '#10b981' },
                        { icon: 'comments', text: 'Общение с малышом', color: '#a855f7' }
                      ];
                      if (currentWeek <= 32) return [
                        { icon: 'heartbeat', text: 'КТГ - контроль сердцебиения', color: '#ef4444' },
                        { icon: 'spa', text: 'Дыхательная гимнастика', color: '#10b981' },
                        { icon: 'eye', text: 'Контроль отеков и давления', color: '#f59e0b' }
                      ];
                      return [
                        { icon: 'baby', text: 'Подготовка к родам', color: '#ec4899' },
                        { icon: 'briefcase-medical', text: 'Сборы в роддом', color: '#ef4444' },
                        { icon: 'heart', text: 'Массаж промежности', color: '#f59e0b' }
                      ];
                    })().map((item, index) => (
                      <View key={index} style={styles.nutritionModeItem}>
                        <FontAwesome5 name={item.icon as any} size={16} color={item.color} />
                        <Text style={styles.nutritionModeText}>{item.text}</Text>
                </View>
                    ))}
                </View>
                </View>
              </View>

              <View style={styles.activitySection}>
                <View style={styles.activitySectionHeader}>
                  <FontAwesome5 name="dumbbell" size={18} color="#a855f7" />
                  <Text style={styles.activitySectionTitle}>Физическая активность</Text>
              </View>

                <View style={styles.yogaCard}>
                  <Text style={styles.yogaTitle}>Физическая активность</Text>
                  <Text style={styles.yogaSubtitle}>
                    {(() => {
                      if (currentWeek <= 8) return 'Легкие упражнения при плохом самочувствии';
                      if (currentWeek <= 12) return 'Подготовка к активному периоду';
                      if (currentWeek <= 16) return 'Начало интенсивных тренировок';
                      if (currentWeek <= 20) return 'Пик физической активности';
                      if (currentWeek <= 24) return 'Контроль веса и формы';
                      if (currentWeek <= 28) return 'Адаптация к растущему животу';
                      if (currentWeek <= 32) return 'Упражнения для подготовки к родам';
                      if (currentWeek <= 36) return 'Дыхательные практики';
                      return 'Поддержание активности до родов';
                    })()}
                  </Text>
                  
                  <View style={styles.activityList}>
                    {(activityData?.optimal || activityData?.allowed || activityData?.recommended || []).slice(0, 3).map((activity: string, index: number) => (
                      <View key={index} style={styles.activityItem}>
                        <Text style={styles.activityEmoji}>✓</Text>
                        <Text style={styles.activityText}>{activity}</Text>
                </View>
                    ))}
                  </View>
                </View>
              </View>
                
                {/* Убраны все статичные блоки */}

              {/* Weekly Checklist */}
              <View style={styles.checklistCard}>
                <View style={styles.checklistHeader}>
                  <FontAwesome5 name="clipboard-check" size={18} color="#10b981" />
                  <Text style={styles.checklistTitle}>Чек-лист на {currentWeek} неделю</Text>
                </View>
                <View style={styles.checklistList}>
                  {(weekInfo.momChanges.weeklyChecklist || []).map((item: string, index: number) => (
                  <TouchableOpacity 
                      key={index}
                    style={styles.checklistItem}
                      onPress={() => toggleChecklistItem(`week${currentWeek}_${index}`)}
                    >
                      <View style={styles.customCheckbox}>
                        {checklistItems[`week${currentWeek}_${index}`] ? (
                          <FontAwesome5 name="check-square" size={20} color="#10b981" solid />
                        ) : (
                          <FontAwesome5 name="square" size={20} color="#d1d5db" />
                        )}
                      </View>
                      <Text style={styles.checklistItemText}>{item}</Text>
                  </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const weekInfo = getCurrentWeekData();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Календарь</Text>
          <Text style={styles.headerSubtitle}>{currentWeek} неделя беременности</Text>
        </View>
        
        <TouchableOpacity style={styles.addButton}>
          <FontAwesome5 name="calendar-plus" size={16} color="#ec4899" />
        </TouchableOpacity>
      </View>

      {/* Week Navigation Section */}
      <View style={styles.weekNavigationSection}>
        <View style={styles.weekNavigation}>
          <TouchableOpacity 
            style={styles.weekNavButton}
            onPress={() => navigateWeek('prev')}
            disabled={currentWeek <= 1}
          >
            <FontAwesome5 name="chevron-left" size={16} color={currentWeek <= 1 ? "#d1d5db" : "#6b7280"} />
          </TouchableOpacity>
          
          <View style={styles.weekInfo}>
            <Text style={styles.weekTitle}>{currentWeek} неделя</Text>
            <Text style={styles.weekDates}>{getWeekDates()}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.weekNavButton}
            onPress={() => navigateWeek('next')}
            disabled={currentWeek >= 42}
          >
            <FontAwesome5 name="chevron-right" size={16} color={currentWeek >= 42 ? "#d1d5db" : "#6b7280"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Cards Slider */}
      <View style={styles.weekScrollView}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekSlider}
          snapToInterval={width * 0.42}
          decelerationRate="fast"
        >
        {getSliderWeeksData(currentWeek).map((week) => (
          <TouchableOpacity
            key={week.week}
            style={[
              styles.weekCard,
              { backgroundColor: week.color },
              currentWeek === week.week ? styles.activeWeekCard : styles.inactiveWeekCard
            ]}
            onPress={() => setCurrentWeek(week.week)}
          >
            <View style={styles.weekCardHeader}>
              <Text style={[
                styles.weekCardNumber,
                currentWeek === week.week && styles.activeWeekCardNumber
              ]}>
                {week.week} неделя
              </Text>
              <Text style={styles.weekCardDates}>{getWeekDates(week.week)}</Text>
            </View>
            
            <View style={[
              styles.weekCardIconContainer,
              currentWeek === week.week && styles.activeIconContainer
            ]}>
              <FontAwesome5 name={week.iconName} size={32} color="#1f2937" />
              <Text style={[
                styles.weekCardSizeText,
                currentWeek === week.week && styles.activeWeekCardSizeText
              ]}>
                {week.length} • {week.weight}
              </Text>
            </View>
            
            <View style={styles.weekCardInfo}>
              <Text style={styles.weekCardFruit}>Как {week.fruitName.toLowerCase()}</Text>
            </View>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Week Indicators */}
      <View style={styles.weekIndicators}>
        {getSliderWeeksData(currentWeek).map((week, index) => (
          <View
            key={week.week}
            style={[
              styles.indicator,
              week.week === currentWeek ? styles.activeIndicator : styles.inactiveIndicator
            ]}
          />
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'development' && styles.activeTab]}
          onPress={() => setActiveTab('development')}
        >
          <Text style={[styles.tabText, activeTab === 'development' && styles.activeTabText]}>
            Развитие
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mom' && styles.activeTab]}
          onPress={() => setActiveTab('mom')}
        >
          <Text style={[styles.tabText, activeTab === 'mom' && styles.activeTabText]}>
            Мама
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tips' && styles.activeTab]}
          onPress={() => setActiveTab('tips')}
        >
          <Text style={[styles.tabText, activeTab === 'tips' && styles.activeTabText]}>
            Советы
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Floating AI Button */}
      <TouchableOpacity style={styles.floatingAiButton}>
        <FontAwesome5 name="robot" size={20} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0fdfa',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fdf2f8',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  weekNavigationSection: {
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    marginTop: 0,
    paddingVertical: 8,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekNavButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  weekInfo: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  weekInfoCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  weekDates: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  weekScrollView: {
    backgroundColor: 'transparent',
    height: 160,
    marginTop: 16,
    marginBottom: 4,
    overflow: 'hidden',
  },
  weekSlider: {
    paddingHorizontal: 16,
    height: 160,
  },
  weekCard: {
    width: width * 0.40,
    height: 140,
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    minWidth: 140,
    maxWidth: 160,
  },
  activeWeekCard: {
    borderWidth: 2,
    borderColor: '#ec4899',
    transform: [{ scale: 1 }],
    elevation: 8,
    shadowColor: '#fbcfe8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  inactiveWeekCard: {
    transform: [{ scale: 0.95 }],
    opacity: 0.7,
  },
  weekCardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  weekCardDates: {
    fontSize: 12,
    color: '#6b7280',
  },
  weekCardIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  activeIconContainer: {
    // Could add animation here
  },
  weekCardInfo: {
    alignItems: 'center',
  },
  weekCardNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeWeekCardNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  weekCardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  weekCardFruit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  weekCardStats: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeWeekCardStats: {
    color: '#ec4899',
    fontWeight: '600',
  },
  weekCardSizeText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  activeWeekCardSizeText: {
    color: '#ec4899',
    fontWeight: '600',
  },
  // New Mom styles
  momHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
  momMainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  momMainSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  momAvatarContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  momAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  momCardsContainer: {
    gap: 16,
  },
  momColoredCard: {
    borderRadius: 16,
    elevation: 2,
  },
  momColoredCardInner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
  },
  momPinkCard: {
    backgroundColor: '#fdf2f8',
  },
  momGreenCard: {
    backgroundColor: '#ecfdf5',
  },
  momBlueCard: {
    backgroundColor: '#eff6ff',
  },
  momCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 1,
  },
  momCardContent: {
    flex: 1,
  },
  momCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  momCardText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  momCardAdvice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
    marginTop: 4,
  },
  momCardAdviceText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  momCardStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  momCardStat: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    minWidth: 70,
  },
  momCardStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 2,
  },
  momCardStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Tips Tab Styles
  tipsHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
  tipsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tipsMainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  tipsMainSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  nutritionSection: {
    marginBottom: 16,
  },
  nutritionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  nutritionSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  ironProductsCard: {
    backgroundColor: '#f0fdfa',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  ironProductsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  ironProductsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '47%',
    gap: 6,
  },
  productEmoji: {
    fontSize: 20,
  },
  productName: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
    textAlign: 'center',
  },
  calciumCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  calciumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  calciumSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  calciumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  calciumAmountContainer: {
    alignItems: 'center',
  },
  calciumAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  calciumLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  calciumProducts: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  nutritionModeCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  nutritionModeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  nutritionModeList: {
    gap: 12,
  },
  nutritionModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nutritionModeText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  // Activity section
  activitySection: {
    marginTop: 24,
  },
  activitySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  activitySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  yogaCard: {
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f9a8d4',
  },
  yogaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  yogaSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  yogaStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  yogaStatItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    gap: 6,
  },
  yogaStatEmoji: {
    fontSize: 18,
  },
  yogaStatText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
    textAlign: 'center',
  },
  swimmingCard: {
    backgroundColor: '#f0fdfa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  swimmingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  swimmingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  swimmingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  swimmingStatItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    gap: 6,
  },
  swimmingStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  swimmingStatLabel: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
    textAlign: 'center',
  },
  swimmingStatEmoji: {
    fontSize: 18,
  },
  breathingCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  breathingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  breathingExercises: {
    gap: 16,
  },
  breathingExerciseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f1f7fe',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  breathingNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  breathingExerciseContent: {
    flex: 1,
  },
  breathingExerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  breathingExerciseText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  // Wellness section
  wellnessSection: {
    marginTop: 24,
  },
  wellnessSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  wellnessSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  skinCareCard: {
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f9a8d4',
  },
  skinCareTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  skinCareList: {
    gap: 12,
  },
  skinCareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skinCareText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  sleepQualityCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  sleepQualityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  weekIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 16,
    gap: 8,
    backgroundColor: 'transparent',
    marginTop: 0,
    marginBottom: 8,
  },
  indicator: {
    borderRadius: 8,
  },
  activeIndicator: {
    width: 32,
    height: 8,
    backgroundColor: '#ec4899',
  },
  inactiveIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#d1d5db',
    borderRadius: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginTop: 0,
    marginBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ec4899',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  developmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
  },
  babyImageContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  babyImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  babyEmoji: {
    fontSize: 48,
  },
  weekBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#ec4899',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  weekBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  developmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  developmentSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ec4899',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  developmentDetails: {
    gap: 16,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    elevation: 2,
  },
  detailIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#fef3f2',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailEmoji: {
    fontSize: 24,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  momCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    elevation: 3,
  },
  momHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  momImageContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#fbcfe8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  momImage: {
    width: 96,
    height: 96,
  },
  momTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  momSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  momDetails: {
    gap: 16,
  },
  momDetailCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3f2',
    borderRadius: 16,
    padding: 16,
  },
  momIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  momEmoji: {
    fontSize: 24,
  },
  momContent: {
    flex: 1,
  },
  momDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  momDetailText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  symptomsCard: {
    backgroundColor: '#f3e8ff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#d8b4fe',
  },
  symptomsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  symptomsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomItem: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    width: '47%',
    gap: 8,
  },
  symptomEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  symptomText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  tipSection: {
    marginBottom: 24,
  },
  tipSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tipItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tipItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  tipItemText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  warningCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  warningText: {
    fontSize: 12,
    color: '#7f1d1d',
    marginBottom: 4,
  },
  floatingAiButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: '#ec4899',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 1000,
  },
  // Gradient cards for development content
  pinkGradientCard: {
    backgroundColor: '#fdf2f8',
    borderColor: '#f9a8d4',
    borderWidth: 1,
  },
  mintGradientCard: {
    backgroundColor: '#f0fdfa',
    borderColor: '#a7f3d0',
    borderWidth: 1,
  },
  blueGradientCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
    borderWidth: 1,
  },
  orangeGradientCard: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
    borderWidth: 1,
  },
  // Detail features
  detailFeatures: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: '45%',
  },
  featureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ec4899',
  },
  featureText: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Important note
  importantNote: {
    marginTop: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    padding: 12,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
  },
  noteText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  // Movement types
  movementTypes: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  movementItem: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    flex: 1,
  },
  movementEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  movementText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Growth stats
  growthStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  growthItem: {
    alignItems: 'center',
    flex: 1,
  },
  growthValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f59e0b',
    marginBottom: 4,
  },
  growthLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Milestones card
  milestonesCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  milestonesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  milestonesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  milestonesList: {
    gap: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  milestoneCheck: {
    width: 20,
    height: 20,
    backgroundColor: '#e9d5ff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneText: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  // Mom content styles
  momStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  momStatItem: {
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    flex: 1,
  },
  momStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  momStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  sleepTips: {
    marginTop: 12,
    gap: 8,
  },
  sleepTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sleepTipText: {
    fontSize: 12,
    color: '#6b7280',
  },
  weightProgress: {
    marginTop: 12,
  },
  weightInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weightLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  weightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  progressWeeklyText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  // Timeline styles
  timelineCard: {
    marginTop: 24,
    backgroundColor: 'transparent',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  timelineList: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  timelineDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timelineDayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  timelineContent: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  timelineDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  // Sleep quality grid
  sleepQualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  sleepQualityItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    gap: 8,
  },
  sleepQualityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  emotionalHealthCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  emotionalHealthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  emotionalHealthList: {
    gap: 12,
  },
  emotionalHealthItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  emotionalHealthContent: {
    flex: 1,
  },
  emotionalHealthItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  emotionalHealthText: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Warning card improvements
  warningSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 12,
  },
  warningList: {
    gap: 12,
  },
  warningItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  warningItemContent: {
    flex: 1,
  },
  warningItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  warningItemText: {
    fontSize: 12,
    color: '#7f1d1d',
  },
  // Checklist
  checklistCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  checklistList: {
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  checklistItemText: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,


  },
  customCheckbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Medical section styles
  medicalSection: {
    marginTop: 24,
  },
  medicalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  medicalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  medicalWarningCard: {
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f9a8d4',
  },
  medicalWarningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  medicalWarningList: {
    gap: 12,
  },
  medicalWarningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  medicalWarningContent: {
    flex: 1,
  },
  medicalWarningItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  medicalWarningItemText: {
    fontSize: 12,
    color: '#6b7280',
  },
  // New styles for dynamic content
  activityList: {
    gap: 8,
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  activityEmoji: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: 'bold',
  },
  activityText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  nutritionNutrients: {
    gap: 4,
    marginTop: 8,
  },
  nutrientItem: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  // Daily tasks styles
  dailyTasksList: {
    gap: 8,
    marginTop: 8,
  },
  dailyTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
  },
  dailyTaskText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  // Weekly advice styles
  weeklyAdviceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weeklyAdviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  weeklyAdviceList: {
    gap: 8,
  },
  weeklyAdviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  importantAdviceItem: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  weeklyAdviceText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  importantAdviceText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  // Mom symptoms styles
  momSymptomsList: {
    gap: 4,
    marginTop: 8,
  },
  momSymptomItem: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  // Weight analysis styles
  weightStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  updateWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  updateWeightText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Debug info styles
  weightDebugInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  testButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  testButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  testButtonMinus: {
    backgroundColor: '#fecaca',
  },
  testButtonPlus: {
    backgroundColor: '#bbf7d0',
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  currentWeightDisplay: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 80,
    alignItems: 'center',
  },
  currentWeightText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  // User data section styles
  userDataSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bae6fd',
  },
  userDataTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  parameterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  parameterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    minWidth: 60,
  },
  parameterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  parameterValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    minWidth: 60,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  currentWeightHighlight: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  // Data source info styles
  dataSourceInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  dataSourceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  dataSourceText: {
    fontSize: 11,
    color: '#0369a1',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  dataSourceWarning: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  currentWeightTest: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    alignItems: 'center',
  },
  testLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  weightTestControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
