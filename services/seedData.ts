import { Lesson, Vocabulary } from './types';

export const SEED_LESSONS: Lesson[] = [
  // GREETINGS
  {
    id: 'lesson_001', title: 'Basic Greetings', description: 'Learn everyday greetings and farewells',
    category: 'GREETINGS', difficulty: 'BEGINNER', xpReward: 15, orderIndex: 1,
    requiredLessonId: null, totalWords: 8,
  },
  {
    id: 'lesson_002', title: 'Introducing Yourself', description: 'Tell others about yourself',
    category: 'GREETINGS', difficulty: 'BEGINNER', xpReward: 15, orderIndex: 2,
    requiredLessonId: 'lesson_001', totalWords: 8,
  },
  {
    id: 'lesson_003', title: 'Meeting People', description: 'Start conversations with new friends',
    category: 'GREETINGS', difficulty: 'BEGINNER', xpReward: 20, orderIndex: 3,
    requiredLessonId: 'lesson_002', totalWords: 8,
  },
  // DAILY LIFE
  {
    id: 'lesson_004', title: 'Food & Drinks', description: 'Order food and talk about preferences',
    category: 'DAILY_LIFE', difficulty: 'BEGINNER', xpReward: 20, orderIndex: 4,
    requiredLessonId: 'lesson_003', totalWords: 10,
  },
  {
    id: 'lesson_005', title: 'Shopping', description: 'Navigate stores, prices, and sizes',
    category: 'DAILY_LIFE', difficulty: 'BEGINNER', xpReward: 20, orderIndex: 5,
    requiredLessonId: 'lesson_004', totalWords: 10,
  },
  {
    id: 'lesson_006', title: 'Transportation', description: 'Get around using public transport',
    category: 'DAILY_LIFE', difficulty: 'INTERMEDIATE', xpReward: 25, orderIndex: 6,
    requiredLessonId: 'lesson_005', totalWords: 10,
  },
  // FAMILY
  {
    id: 'lesson_007', title: 'Family Members', description: 'Talk about your family',
    category: 'FAMILY', difficulty: 'BEGINNER', xpReward: 20, orderIndex: 7,
    requiredLessonId: 'lesson_006', totalWords: 10,
  },
  {
    id: 'lesson_008', title: 'Describing People', description: 'Describe appearance and personality',
    category: 'FAMILY', difficulty: 'INTERMEDIATE', xpReward: 25, orderIndex: 8,
    requiredLessonId: 'lesson_007', totalWords: 10,
  },
  {
    id: 'lesson_009', title: 'Feelings & Emotions', description: 'Express how you feel',
    category: 'FAMILY', difficulty: 'INTERMEDIATE', xpReward: 25, orderIndex: 9,
    requiredLessonId: 'lesson_008', totalWords: 10,
  },
  // WORK
  {
    id: 'lesson_010', title: 'Office Vocabulary', description: 'Essential workplace English',
    category: 'WORK', difficulty: 'INTERMEDIATE', xpReward: 30, orderIndex: 10,
    requiredLessonId: 'lesson_009', totalWords: 10,
  },
  {
    id: 'lesson_011', title: 'Job Interviews', description: 'Ace your English job interview',
    category: 'WORK', difficulty: 'ADVANCED', xpReward: 35, orderIndex: 11,
    requiredLessonId: 'lesson_010', totalWords: 10,
  },
  // TRAVEL
  {
    id: 'lesson_012', title: 'Airport & Hotel', description: 'Navigate airports and check in',
    category: 'TRAVEL', difficulty: 'INTERMEDIATE', xpReward: 30, orderIndex: 12,
    requiredLessonId: 'lesson_011', totalWords: 10,
  },
  {
    id: 'lesson_013', title: 'Tourist Phrases', description: 'Essential phrases for sightseeing',
    category: 'TRAVEL', difficulty: 'INTERMEDIATE', xpReward: 30, orderIndex: 13,
    requiredLessonId: 'lesson_012', totalWords: 10,
  },
  {
    id: 'lesson_014', title: 'Emergency Situations', description: 'Stay safe with emergency English',
    category: 'TRAVEL', difficulty: 'ADVANCED', xpReward: 35, orderIndex: 14,
    requiredLessonId: 'lesson_013', totalWords: 8,
  },
];

export const SEED_VOCABULARY: Vocabulary[] = [
  // Lesson 1 - Basic Greetings
  { id: 'v001', lessonId: 'lesson_001', word: 'Hello', phonetic: '/həˈloʊ/', meaning: 'Xin chào', exampleSentence: 'Hello, how are you?', exampleTranslation: 'Xin chào, bạn khỏe không?' },
  { id: 'v002', lessonId: 'lesson_001', word: 'Goodbye', phonetic: '/ˌɡʊdˈbaɪ/', meaning: 'Tạm biệt', exampleSentence: 'Goodbye, see you tomorrow!', exampleTranslation: 'Tạm biệt, hẹn gặp lại ngày mai!' },
  { id: 'v003', lessonId: 'lesson_001', word: 'Thank you', phonetic: '/ˈθæŋk juː/', meaning: 'Cảm ơn', exampleSentence: 'Thank you for your help.', exampleTranslation: 'Cảm ơn vì đã giúp đỡ tôi.' },
  { id: 'v004', lessonId: 'lesson_001', word: 'Please', phonetic: '/pliːz/', meaning: 'Làm ơn', exampleSentence: 'Please help me.', exampleTranslation: 'Làm ơn giúp tôi.' },
  { id: 'v005', lessonId: 'lesson_001', word: 'Sorry', phonetic: '/ˈsɒri/', meaning: 'Xin lỗi', exampleSentence: 'I am sorry for being late.', exampleTranslation: 'Tôi xin lỗi vì đến muộn.' },
  { id: 'v006', lessonId: 'lesson_001', word: 'Good morning', phonetic: '/ɡʊd ˈmɔːrnɪŋ/', meaning: 'Chào buổi sáng', exampleSentence: 'Good morning, everyone!', exampleTranslation: 'Chào buổi sáng mọi người!' },
  { id: 'v007', lessonId: 'lesson_001', word: 'Good night', phonetic: '/ɡʊd naɪt/', meaning: 'Chúc ngủ ngon', exampleSentence: 'Good night, sleep well.', exampleTranslation: 'Chúc ngủ ngon nhé.' },
  { id: 'v008', lessonId: 'lesson_001', word: 'Welcome', phonetic: '/ˈwelkəm/', meaning: 'Chào mừng', exampleSentence: 'Welcome to our school!', exampleTranslation: 'Chào mừng đến trường của chúng tôi!' },

  // Lesson 2 - Introducing Yourself
  { id: 'v009', lessonId: 'lesson_002', word: 'My name is', phonetic: '/maɪ neɪm ɪz/', meaning: 'Tên tôi là', exampleSentence: 'My name is Anna.', exampleTranslation: 'Tên tôi là Anna.' },
  { id: 'v010', lessonId: 'lesson_002', word: 'I am from', phonetic: '/aɪ æm frɒm/', meaning: 'Tôi đến từ', exampleSentence: 'I am from Vietnam.', exampleTranslation: 'Tôi đến từ Việt Nam.' },
  { id: 'v011', lessonId: 'lesson_002', word: 'I am years old', phonetic: '/aɪ æm jɪərz oʊld/', meaning: 'Tôi ... tuổi', exampleSentence: 'I am twenty years old.', exampleTranslation: 'Tôi hai mươi tuổi.' },
  { id: 'v012', lessonId: 'lesson_002', word: 'Nice to meet you', phonetic: '/naɪs tə miːt juː/', meaning: 'Rất vui được gặp bạn', exampleSentence: 'Nice to meet you, John!', exampleTranslation: 'Rất vui được gặp bạn, John!' },
  { id: 'v013', lessonId: 'lesson_002', word: 'I am a student', phonetic: '/aɪ æm ə ˈstjuːdnt/', meaning: 'Tôi là học sinh', exampleSentence: 'I am a student at university.', exampleTranslation: 'Tôi là sinh viên đại học.' },
  { id: 'v014', lessonId: 'lesson_002', word: 'I speak English', phonetic: '/aɪ spiːk ˈɪŋɡlɪʃ/', meaning: 'Tôi nói tiếng Anh', exampleSentence: 'I speak English and Vietnamese.', exampleTranslation: 'Tôi nói tiếng Anh và tiếng Việt.' },
  { id: 'v015', lessonId: 'lesson_002', word: 'What is your name', phonetic: '/wɒt ɪz jɔːr neɪm/', meaning: 'Bạn tên gì', exampleSentence: 'What is your name, please?', exampleTranslation: 'Làm ơn cho biết tên bạn?' },
  { id: 'v016', lessonId: 'lesson_002', word: 'How old are you', phonetic: '/haʊ oʊld ɑːr juː/', meaning: 'Bạn bao nhiêu tuổi', exampleSentence: 'How old are you this year?', exampleTranslation: 'Bạn bao nhiêu tuổi năm nay?' },

  // Lesson 3 - Meeting People
  { id: 'v017', lessonId: 'lesson_003', word: 'How are you', phonetic: '/haʊ ɑːr juː/', meaning: 'Bạn khỏe không', exampleSentence: 'How are you today?', exampleTranslation: 'Hôm nay bạn khỏe không?' },
  { id: 'v018', lessonId: 'lesson_003', word: 'I am fine', phonetic: '/aɪ æm faɪn/', meaning: 'Tôi khỏe', exampleSentence: 'I am fine, thank you!', exampleTranslation: 'Tôi khỏe, cảm ơn bạn!' },
  { id: 'v019', lessonId: 'lesson_003', word: 'Pleased to meet you', phonetic: '/pliːzd tə miːt juː/', meaning: 'Hân hạnh được gặp', exampleSentence: 'Pleased to meet you all.', exampleTranslation: 'Hân hạnh được gặp tất cả các bạn.' },
  { id: 'v020', lessonId: 'lesson_003', word: 'See you later', phonetic: '/siː juː ˈleɪtər/', meaning: 'Hẹn gặp lại', exampleSentence: 'See you later, bye!', exampleTranslation: 'Hẹn gặp lại, tạm biệt!' },
  { id: 'v021', lessonId: 'lesson_003', word: 'Have a good day', phonetic: '/hæv ə ɡʊd deɪ/', meaning: 'Chúc một ngày tốt lành', exampleSentence: 'Have a good day at work!', exampleTranslation: 'Chúc một ngày làm việc tốt lành!' },
  { id: 'v022', lessonId: 'lesson_003', word: 'What do you do', phonetic: '/wɒt duː juː duː/', meaning: 'Bạn làm gì', exampleSentence: 'What do you do for work?', exampleTranslation: 'Bạn làm công việc gì?' },
  { id: 'v023', lessonId: 'lesson_003', word: 'Where are you from', phonetic: '/weər ɑːr juː frɒm/', meaning: 'Bạn từ đâu đến', exampleSentence: 'Where are you from originally?', exampleTranslation: 'Bạn đến từ đâu vậy?' },
  { id: 'v024', lessonId: 'lesson_003', word: 'Nice weather', phonetic: '/naɪs ˈweðər/', meaning: 'Thời tiết đẹp', exampleSentence: 'Nice weather today, is it not?', exampleTranslation: 'Hôm nay thời tiết đẹp nhỉ?' },

  // Lesson 4 - Food & Drinks
  { id: 'v025', lessonId: 'lesson_004', word: 'Restaurant', phonetic: '/ˈrestərɒnt/', meaning: 'Nhà hàng', exampleSentence: 'This restaurant has great food.', exampleTranslation: 'Nhà hàng này có đồ ăn ngon.' },
  { id: 'v026', lessonId: 'lesson_004', word: 'Menu', phonetic: '/ˈmenjuː/', meaning: 'Thực đơn', exampleSentence: 'Can I see the menu please?', exampleTranslation: 'Làm ơn cho tôi xem thực đơn?' },
  { id: 'v027', lessonId: 'lesson_004', word: 'Delicious', phonetic: '/dɪˈlɪʃəs/', meaning: 'Ngon tuyệt', exampleSentence: 'This food is delicious!', exampleTranslation: 'Đồ ăn này ngon tuyệt!' },
  { id: 'v028', lessonId: 'lesson_004', word: 'I would like', phonetic: '/aɪ wʊd laɪk/', meaning: 'Tôi muốn', exampleSentence: 'I would like a coffee please.', exampleTranslation: 'Làm ơn cho tôi một cà phê.' },
  { id: 'v029', lessonId: 'lesson_004', word: 'Breakfast', phonetic: '/ˈbrekfəst/', meaning: 'Bữa sáng', exampleSentence: 'I eat breakfast every morning.', exampleTranslation: 'Tôi ăn sáng mỗi buổi sáng.' },
  { id: 'v030', lessonId: 'lesson_004', word: 'Vegetarian', phonetic: '/ˌvedʒɪˈteəriən/', meaning: 'Ăn chay', exampleSentence: 'Do you have vegetarian options?', exampleTranslation: 'Bạn có món ăn chay không?' },
  { id: 'v031', lessonId: 'lesson_004', word: 'Bill', phonetic: '/bɪl/', meaning: 'Hóa đơn', exampleSentence: 'Can I have the bill please?', exampleTranslation: 'Làm ơn cho tôi hóa đơn?' },
  { id: 'v032', lessonId: 'lesson_004', word: 'Spicy', phonetic: '/ˈspaɪsi/', meaning: 'Cay', exampleSentence: 'Is this dish very spicy?', exampleTranslation: 'Món này có cay nhiều không?' },
  { id: 'v033', lessonId: 'lesson_004', word: 'Water', phonetic: '/ˈwɔːtər/', meaning: 'Nước', exampleSentence: 'A glass of water please.', exampleTranslation: 'Làm ơn cho một ly nước.' },
  { id: 'v034', lessonId: 'lesson_004', word: 'Dessert', phonetic: '/dɪˈzɜːrt/', meaning: 'Tráng miệng', exampleSentence: 'I want dessert after dinner.', exampleTranslation: 'Tôi muốn ăn tráng miệng sau bữa tối.' },

  // Lesson 5 - Shopping
  { id: 'v035', lessonId: 'lesson_005', word: 'How much', phonetic: '/haʊ mʌtʃ/', meaning: 'Bao nhiêu tiền', exampleSentence: 'How much does this cost?', exampleTranslation: 'Cái này giá bao nhiêu?' },
  { id: 'v036', lessonId: 'lesson_005', word: 'Expensive', phonetic: '/ɪkˈspensɪv/', meaning: 'Đắt tiền', exampleSentence: 'This bag is too expensive.', exampleTranslation: 'Cái túi này quá đắt.' },
  { id: 'v037', lessonId: 'lesson_005', word: 'Cheap', phonetic: '/tʃiːp/', meaning: 'Rẻ', exampleSentence: 'I found a cheap jacket here.', exampleTranslation: 'Tôi tìm thấy một chiếc áo rẻ ở đây.' },
  { id: 'v038', lessonId: 'lesson_005', word: 'Sale', phonetic: '/seɪl/', meaning: 'Giảm giá', exampleSentence: 'Everything is on sale today.', exampleTranslation: 'Hôm nay mọi thứ đều giảm giá.' },
  { id: 'v039', lessonId: 'lesson_005', word: 'Size', phonetic: '/saɪz/', meaning: 'Kích cỡ', exampleSentence: 'What size do you wear?', exampleTranslation: 'Bạn mặc cỡ nào?' },
  { id: 'v040', lessonId: 'lesson_005', word: 'Receipt', phonetic: '/rɪˈsiːt/', meaning: 'Biên lai', exampleSentence: 'Can I have a receipt please?', exampleTranslation: 'Làm ơn cho tôi biên lai?' },
  { id: 'v041', lessonId: 'lesson_005', word: 'Discount', phonetic: '/ˈdɪskaʊnt/', meaning: 'Chiết khấu', exampleSentence: 'Is there a student discount?', exampleTranslation: 'Có giảm giá cho sinh viên không?' },
  { id: 'v042', lessonId: 'lesson_005', word: 'Try on', phonetic: '/traɪ ɒn/', meaning: 'Thử mặc', exampleSentence: 'May I try this on?', exampleTranslation: 'Tôi có thể thử cái này không?' },
  { id: 'v043', lessonId: 'lesson_005', word: 'Cash', phonetic: '/kæʃ/', meaning: 'Tiền mặt', exampleSentence: 'Do you pay by cash?', exampleTranslation: 'Bạn trả bằng tiền mặt không?' },
  { id: 'v044', lessonId: 'lesson_005', word: 'Fitting room', phonetic: '/ˈfɪtɪŋ ruːm/', meaning: 'Phòng thử đồ', exampleSentence: 'Where is the fitting room?', exampleTranslation: 'Phòng thử đồ ở đâu vậy?' },
];

export const MOCK_LEADERBOARD = [
  { id: '1', username: 'LinguaMaster', totalXp: 4820, streak: 45, avatar: '🦁', weeklyXp: 350 },
  { id: '2', username: 'EnglishPro', totalXp: 4200, streak: 30, avatar: '🦊', weeklyXp: 290 },
  { id: '3', username: 'WordWizard', totalXp: 3850, streak: 22, avatar: '🐯', weeklyXp: 245 },
  { id: '4', username: 'SpeakEasy', totalXp: 3100, streak: 18, avatar: '🐸', weeklyXp: 210 },
  { id: '5', username: 'VocabKing', totalXp: 2750, streak: 15, avatar: '🦋', weeklyXp: 185 },
  { id: '6', username: 'GrammarGuru', totalXp: 2300, streak: 12, avatar: '🐙', weeklyXp: 160 },
  { id: '7', username: 'TalkTime', totalXp: 1950, streak: 9, avatar: '🦜', weeklyXp: 140 },
  { id: '8', username: 'FluentFox', totalXp: 1600, streak: 7, avatar: '🐺', weeklyXp: 115 },
  { id: '9', username: 'ChatChamp', totalXp: 1200, streak: 5, avatar: '🐻', weeklyXp: 85 },
  { id: '10', username: 'LexiLion', totalXp: 900, streak: 3, avatar: '🦅', weeklyXp: 60 },
];
