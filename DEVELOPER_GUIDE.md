# Руководство разработчика - Приложение для беременных

## 🚀 Краткий обзор проекта

Это React Native приложение для ведения беременности с функциями:
- **Календарь беременности** по неделям (1-42)
- **Отслеживание развития малыша** 
- **Мониторинг изменений у мамы**
- **Персональные советы и рекомендации**
- **AI-чат поддержка**
- **Геймификация и дневник**

## 📁 Структура проекта

```
PregnantAI/
├── app/mobile/                          # Основное приложение
│   ├── src/
│   │   ├── features/                    # Основные функции
│   │   │   ├── calendar/screens/        # Календарь (ГЛАВНЫЙ ЭКРАН)
│   │   │   ├── onboarding/screens/      # Онбординг
│   │   │   ├── dashboard/screens/       # Главная панель
│   │   │   ├── journal/screens/         # Дневник
│   │   │   └── ai/screens/             # AI чат
│   │   ├── shared/
│   │   │   ├── components/             # Общие компоненты
│   │   │   ├── store/                  # Redux состояние
│   │   │   ├── i18n/                   # Переводы (ru, en, de, es, fr)
│   │   │   └── ui/                     # UI компоненты
│   │   └── assets/images/
│   │       └── pregnancyData.json      # 🔥 ОСНОВНЫЕ ДАННЫЕ
│   └── app/(tabs)/                     # Навигация табов
├── SourcesForApp/                      # HTML прототипы
└── *.json, *.md                        # Данные и документация
```

## 🔥 Ключевые файлы

### 1. CalendarScreen.tsx (ГЛАВНЫЙ КОМПОНЕНТ)
**Путь:** `src/features/calendar/screens/CalendarScreen.tsx`

**Что делает:**
- Отображает календарь беременности по неделям
- 3 вкладки: Развитие, Мама, Советы
- Слайдер недель с карточками
- Расчет прибавки веса и ИМТ
- Динамические данные из pregnancyData.json

**Основные функции:**
```typescript
getCurrentWeekData() // Получает данные текущей недели
navigateWeek('prev'|'next') // Навигация по неделям
getWeightAnalysis() // Анализ прибавки веса
renderTabContent() // Контент вкладок
```

### 2. pregnancyData.json (ДАННЫЕ)
**Путь:** `assets/images/pregnancyData.json`

**Структура:**
```json
{
  "pregnancyWeeks": [
    {
      "week": 1,
      "babySize": {
        "lengthCm": 0.1,
        "weightGrams": 0.1,
        "fruitComparison": "Маковое зернышко",
        "fruitEmoji": "🫘",
        "iconName": "seedling",
        "cardColor": "#fef3f2"
      },
      "development": {
        "mainFocus": "Имплантация эмбриона",
        "brainSystem": "Формирование нервной трубки",
        "respiratorySystem": "Начальные зачатки",
        "movementSystem": "Клеточное деление",
        "growthSystem": "Микроскопические изменения",
        "weekMilestones": ["Оплодотворение", "Имплантация"]
      },
      "momChanges": {
        "mainBodyChange": "Начало гормональной перестройки",
        "bellyCircumference": "72",
        "specificSymptoms": ["Возможная задержка", "Легкая усталость"],
        "weeklyBodyChanges": ["День 1: Оплодотворение", "..."],
        "dailyTasks": ["Прием фолиевой кислоты", "..."],
        "weeklyChecklist": ["Сделать тест на беременность", "..."]
      }
    }
  ],
  "nutritionByTrimester": { ... },
  "activityByTrimester": { ... }
}
```

## 🎨 Дизайн и стили

### Цветовая схема
```typescript
// Основные цвета
primary: '#ec4899'    // Розовый (основной)
secondary: '#10b981'  // Зеленый
background: '#fef7f0' // Кремовый фон
white: '#ffffff'
text: '#1f2937'
textSecondary: '#6b7280'

// Градиенты карточек
pinkGradient: '#fdf2f8'   // Розовая карточка
mintGradient: '#f0fdfa'   // Мятная карточка  
blueGradient: '#eff6ff'   // Синяя карточка
orangeGradient: '#fff7ed' // Оранжевая карточка
```

### Важные стили
- **elevation**: Тени для Android
- **shadowColor/shadowOffset**: Тени для iOS
- **borderRadius**: 12-20px для карточек
- **gap**: Современное расстояние между элементами
- **flex**: Адаптивная верстка

## 🔧 Основные функции

### Расчет веса и ИМТ
```typescript
getBMICategory() // Категория ИМТ: underweight/normal/overweight/obese
getRealWeightGain() // Реальная прибавка веса
getWeightAnalysis() // Полный анализ с рекомендациями
```

### Навигация по неделям
```typescript
const [currentWeek, setCurrentWeek] = useState(23);
navigateWeek('prev'|'next') // Переключение недель
getSliderWeeksData(currentWeek) // Данные для слайдера ±3 недели
```

### Динамический контент
- **Развитие:** Мозг, дыхание, движения, рост
- **Мама:** Размер живота, симптомы, вес, временная шкала  
- **Советы:** Питание по триместрам, активность, чек-лист

## 🚨 Частые проблемы и решения

### 1. "Съехавший" текст и элементы
**Проблема:** Отсутствуют стили для кнопок навигации
**Решение:** Добавить стили:
```typescript
headerSpacer: { width: 40 },
weekNavigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
weekNavButton: { width: 32, height: 32, backgroundColor: '#f9fafb', borderRadius: 16, ... },
weekInfo: { alignItems: 'center', flex: 1, marginHorizontal: 16 }
```

### 2. Данные недели не найдены
**Проблема:** `weekInfo` возвращает null
**Решение:** Проверить pregnancyData.json на наличие данных для недели

### 3. Анимации не работают
**Проблема:** Отсутствует `useNativeDriver: true`
**Решение:** Добавить в Animated.spring/timing

### 4. Стили не применяются
**Проблема:** Опечатки в StyleSheet или неправильная вложенность
**Решение:** Проверить структуру стилей и названия

## 📱 Вкладки и навигация

### Структура табов
```typescript
(tabs)/
├── index.tsx        // Главная (Dashboard)
├── calendar.tsx     // Календарь ⭐ ГЛАВНЫЙ
├── journal.tsx      // Дневник
├── gamification.tsx // Геймификация
└── profile.tsx      // Профиль
```

### Навигация между экранами
```typescript
// Из любого экрана можно перейти на:
router.push('/calendar')     // Календарь
router.push('/journal')      // Дневник  
router.push('/gamification') // Игры
router.push('/profile')      // Профиль
```

## 🗂️ Redux Store

### Состояние приложения
```typescript
// store/index.ts
RootState = {
  auth: AuthState,      // Авторизация
  pregnancy: {          // Данные беременности
    currentWeek: number,
    startDate: Date,
    prePregnancyWeight: number,
    height: number,
    // ...
  },
  user: UserState       // Профиль пользователя
}
```

## 🌍 Интернационализация

### Поддерживаемые языки
- **ru.json** - Русский (основной) 🇷🇺
- **en.json** - Английский 🇺🇸
- **de.json** - Немецкий 🇩🇪
- **es.json** - Испанский 🇪🇸  
- **fr.json** - Французский 🇫🇷

### Использование переводов
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();

<Text>{t('calendar.weekTitle', { week: currentWeek })}</Text>
```

## 🔄 Типовые задачи

### Добавить новую неделю беременности
1. Открыть `pregnancyData.json`
2. Добавить объект в `pregnancyWeeks` массив
3. Заполнить все поля по образцу
4. Перезапустить приложение

### Изменить стиль карточки
1. Найти соответствующий стиль в `CalendarScreen.tsx`
2. Изменить цвета, размеры, отступы
3. Проверить на разных экранах

### Добавить новый симптом/совет
1. Найти соответствующий массив в `pregnancyData.json`
2. Добавить новую строку
3. При необходимости добавить иконку FontAwesome5

### Исправить баг с отображением
1. Проверить наличие всех стилей StyleSheet
2. Убедиться что данные загружаются из JSON
3. Проверить условные рендеры (if/else)
4. Использовать `console.log` для отладки

## 💡 Советы по разработке

### 1. Работа с данными
- **pregnancyData.json** - единый источник данных
- Используйте `find()` для поиска недели
- Проверяйте на `null/undefined` перед рендером

### 2. Стили
- Используйте семантические имена стилей
- Группируйте связанные стили
- Добавляйте комментарии для сложных стилей

### 3. Производительность  
- `ScrollView` с `showsVerticalScrollIndicator={false}`
- `snapToInterval` для плавной прокрутки
- `useCallback` для тяжелых функций

### 4. Тестирование
- Проверяйте все недели (1-42)
- Тестируйте на разных размерах экранов
- Проверяйте граничные случаи (неделя 1, 42)

## 🆘 Экстренная помощь

### Если приложение крашится:
1. Проверить консоль на ошибки
2. Убедиться что `pregnancyData.json` валидный
3. Проверить все импорты компонентов
4. Перезапустить Metro bundler

### Если стили сломались:
1. Проверить StyleSheet на опечатки
2. Убедиться что все стили определены
3. Проверить условные стили
4. Очистить кэш: `npm start -- --reset-cache`

### Если данные не загружаются:
1. Проверить путь к `pregnancyData.json`
2. Убедиться что JSON синтаксически корректен
3. Проверить структуру данных
4. Добавить отладочные `console.log`

---

## 📞 Контакты и ресурсы

**Основные технологии:**
- React Native + Expo
- TypeScript  
- Redux Toolkit
- React Navigation
- FontAwesome5 icons
- NativeWind (Tailwind)

**Полезные команды:**
```bash
npm start                    # Запуск разработки
npm run android             # Android билд
npm run ios                 # iOS билд  
npm start -- --reset-cache  # Очистка кэша
```

**Структура файла для обновления:**
- Сначала читай весь файл целиком
- Находи нужный участок кода  
- Вноси изменения точечно
- Проверяй синтаксис и логику
- Тестируй результат

**Помни:** Это медицинское приложение, точность и безопасность критически важны! 🏥👶
