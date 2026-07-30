import type { Grade, Unit, VocabularyItem, GrammarQuestion, SpeakingItem, ListeningItem, Achievement } from '@/types'

export const grades: Grade[] = [
  { id: 1, name: '一年级', description: '启蒙英语，培养兴趣与基础语感', theme: '#f59e0b', totalUnits: 4 },
  { id: 2, name: '二年级', description: '简单句型与日常对话入门', theme: '#10b981', totalUnits: 4 },
  { id: 3, name: '三年级', description: '词汇扩展与基础语法建立', theme: '#3b82f6', totalUnits: 5 },
  { id: 4, name: '四年级', description: '时态启蒙与阅读理解起步', theme: '#8b5cf6', totalUnits: 5 },
  { id: 5, name: '五年级', description: '综合语法与短篇写作训练', theme: '#ec4899', totalUnits: 6 },
  { id: 6, name: '六年级', description: '小升初衔接与综合能力提升', theme: '#06b6d4', totalUnits: 6 },
  { id: 7, name: '七年级', description: '初中基础语法与听说读写并重', theme: '#6366f1', totalUnits: 6 },
  { id: 8, name: '八年级', description: '复杂句型与阅读理解深化', theme: '#f97316', totalUnits: 7 },
  { id: 9, name: '九年级', description: '中考冲刺与综合语言运用', theme: '#ef4444', totalUnits: 7 },
]

export const generateUnits = (gradeId: number): Unit[] => {
  const grade = grades.find(g => g.id === gradeId)
  const count = grade?.totalUnits || 4
  return Array.from({ length: count }, (_, i) => ({
    id: `g${gradeId}-u${i + 1}`,
    gradeId,
    title: `Unit ${i + 1}`,
    description: unitDescriptions[gradeId]?.[i] || `核心单元 ${i + 1}`,
    order: i + 1,
    lessons: [
      { id: `g${gradeId}-u${i + 1}-vocab`, unitId: `g${gradeId}-u${i + 1}`, title: '单词记忆', type: 'vocabulary', duration: 10, xp: 20 },
      { id: `g${gradeId}-u${i + 1}-grammar`, unitId: `g${gradeId}-u${i + 1}`, title: '语法练习', type: 'grammar', duration: 12, xp: 25 },
      { id: `g${gradeId}-u${i + 1}-speaking`, unitId: `g${gradeId}-u${i + 1}`, title: '口语跟读', type: 'speaking', duration: 8, xp: 20 },
      { id: `g${gradeId}-u${i + 1}-listening`, unitId: `g${gradeId}-u${i + 1}`, title: '听力训练', type: 'listening', duration: 10, xp: 20 },
    ],
  }))
}

const unitDescriptions: Record<number, string[]> = {
  1: ['打招呼与自我介绍', '数字与颜色', '家庭成员', '常见动物'],
  2: ['我的学校', '日常活动', '食物与饮料', '季节与天气'],
  3: ['我的爱好', '购物与价格', '旅行计划', '健康习惯', '节日文化'],
  4: ['过去的故事', '未来的梦想', '自然世界', '规则与安全', '友谊与合作'],
  5: ['难忘的旅行', '科技与改变', '环境保护', '职业规划', '文化传承', '健康生活'],
  6: ['世界大观', '问题解决', '志愿精神', '创意表达', '批判思考', '毕业展望'],
  7: ['新学期新目标', '我的日常生活', '旅行见闻', '学校生活', '兴趣爱好', '健康饮食'],
  8: ['成长故事', '科技创新', '社会责任', '文学艺术', '环境保护', '职业规划', '健康生活'],
  9: ['中考高频词汇', '语法总复习', '阅读理解策略', '听力冲刺', '写作提升', '模拟训练', '考前冲刺'],
}

export const vocabData: Record<string, VocabularyItem[]> = {
  'g1-u1': [
    { word: 'hello', phonetic: '/həˈloʊ/', meaning: '你好', example: 'Hello, I am Tom.', translation: '你好，我是汤姆。' },
    { word: 'hi', phonetic: '/haɪ/', meaning: '嗨', example: 'Hi, Lucy!', translation: '嗨，露西！' },
    { word: 'name', phonetic: '/neɪm/', meaning: '名字', example: 'My name is Lily.', translation: '我的名字是莉莉。' },
    { word: 'I', phonetic: '/aɪ/', meaning: '我', example: 'I am a student.', translation: '我是一名学生。' },
    { word: 'am', phonetic: '/æm/', meaning: '是', example: 'I am happy.', translation: '我很高兴。' },
    { word: 'is', phonetic: '/ɪz/', meaning: '是', example: 'She is my teacher.', translation: '她是我的老师。' },
    { word: 'my', phonetic: '/maɪ/', meaning: '我的', example: 'My book is red.', translation: '我的书是红色的。' },
    { word: 'your', phonetic: '/jʊr/', meaning: '你的', example: 'What is your name?', translation: '你叫什么名字？' },
    { word: 'what', phonetic: '/wʌt/', meaning: '什么', example: 'What is this?', translation: '这是什么？' },
    { word: 'nice', phonetic: '/naɪs/', meaning: '高兴的', example: 'Nice to meet you.', translation: '很高兴见到你。' },
    { word: 'meet', phonetic: '/miːt/', meaning: '遇见', example: 'Nice to meet you too.', translation: '我也很高兴见到你。' },
    { word: 'you', phonetic: '/juː/', meaning: '你', example: 'How are you?', translation: '你好吗？' },
    { word: 'too', phonetic: '/tuː/', meaning: '也', example: 'I am fine, too.', translation: '我也很好。' },
    { word: 'friend', phonetic: '/frend/', meaning: '朋友', example: 'She is my friend.', translation: '她是我的朋友。' },
    { word: 'good', phonetic: '/ɡʊd/', meaning: '好的', example: 'Good morning!', translation: '早上好！' },
    { word: 'morning', phonetic: '/ˈmɔːrnɪŋ/', meaning: '早上', example: 'Good morning, class.', translation: '早上好，同学们。' },
    { word: 'afternoon', phonetic: '/ˌæftərˈnuːn/', meaning: '下午', example: 'Good afternoon, Miss Wang.', translation: '下午好，王老师。' },
    { word: 'evening', phonetic: '/ˈiːvnɪŋ/', meaning: '晚上', example: 'Good evening, Dad.', translation: '晚上好，爸爸。' },
    { word: 'goodbye', phonetic: '/ˌɡʊdˈbaɪ/', meaning: '再见', example: 'Goodbye, see you tomorrow.', translation: '再见，明天见。' },
    { word: 'bye', phonetic: '/baɪ/', meaning: '再见', example: 'Bye, Mom!', translation: '再见，妈妈！' },
  ],
  'g3-u1': [
    { word: 'hobby', phonetic: '/ˈhɑːbi/', meaning: '爱好', example: 'Reading is my hobby.', translation: '阅读是我的爱好。' },
    { word: 'collect', phonetic: '/kəˈlekt/', meaning: '收集', example: 'I collect stamps.', translation: '我收集邮票。' },
    { word: 'painting', phonetic: '/ˈpeɪntɪŋ/', meaning: '绘画', example: 'She likes painting.', translation: '她喜欢绘画。' },
    { word: 'soccer', phonetic: '/ˈsɑːkər/', meaning: '足球', example: 'We play soccer after school.', translation: '我们放学后踢足球。' },
  ],
}

export const defaultVocab: VocabularyItem[] = [
  { word: 'learn', phonetic: '/lɜːrn/', meaning: '学习', example: 'We learn English every day.', translation: '我们每天学英语。' },
  { word: 'practice', phonetic: '/ˈpræktɪs/', meaning: '练习', example: 'Practice makes perfect.', translation: '熟能生巧。' },
  { word: 'improve', phonetic: '/ɪmˈpruːv/', meaning: '提高', example: 'I want to improve my speaking.', translation: '我想提高我的口语。' },
  { word: 'confident', phonetic: '/ˈkɑːnfɪdənt/', meaning: '自信的', example: 'Be confident when you speak.', translation: '说话时要自信。' },
]

export const grammarData: Record<string, GrammarQuestion[]> = {
  'g1-u1': [
    { id: 'g1u1-q1', question: 'I _______ Tom.', options: ['am', 'is', 'are', 'be'], correctIndex: 0, explanation: 'I 后面用 am。' },
    { id: 'g1u1-q2', question: 'She _______ Lucy.', options: ['am', 'is', 'are', 'be'], correctIndex: 1, explanation: 'She 后面用 is。' },
    { id: 'g1u1-q3', question: 'You _______ a good friend.', options: ['am', 'is', 'are', 'be'], correctIndex: 2, explanation: 'You 后面用 are。' },
    { id: 'g1u1-q4', question: 'My name _______ Peter.', options: ['am', 'is', 'are', 'be'], correctIndex: 1, explanation: 'My name 是单数，后面用 is。' },
    { id: 'g1u1-q5', question: 'I _______ fine, thank you.', options: ['am', 'is', 'are', 'be'], correctIndex: 0, explanation: 'I 后面用 am。' },
    { id: 'g1u1-q6', question: '______ you Lily?', options: ['Am', 'Is', 'Are', 'Be'], correctIndex: 2, explanation: 'You 前面用 Are。' },
    { id: 'g1u1-q7', question: '______ he your friend?', options: ['Am', 'Is', 'Are', 'Be'], correctIndex: 1, explanation: 'He 前面用 Is。' },
    { id: 'g1u1-q8', question: 'What _______ your name?', options: ['am', 'is', 'are', 'be'], correctIndex: 1, explanation: 'your name 是单数，用 is。' },
    { id: 'g1u1-q9', question: 'Good _______, Miss Wang!', options: ['name', 'morning', 'friend', 'meet'], correctIndex: 1, explanation: 'Good morning 是早上好。' },
    { id: 'g1u1-q10', question: 'Good _______, classmates.', options: ['hello', 'morning', 'name', 'I'], correctIndex: 1, explanation: 'Good morning 表示早上好。' },
    { id: 'g1u1-q11', question: 'Nice to _______ you.', options: ['meet', 'am', 'is', 'name'], correctIndex: 0, explanation: 'Nice to meet you 表示很高兴见到你。' },
    { id: 'g1u1-q12', question: 'Nice to meet you, _______.', options: ['to', 'too', 'two', 'am'], correctIndex: 1, explanation: 'too 表示也。' },
    { id: 'g1u1-q13', question: '______ name is Amy.', options: ['My', 'I', 'Am', 'You'], correctIndex: 0, explanation: 'My name 表示我的名字。' },
    { id: 'g1u1-q14', question: '______ is your name?', options: ['Who', 'What', 'How', 'Where'], correctIndex: 1, explanation: 'What is your name 用于询问名字。' },
    { id: 'g1u1-q15', question: 'I am Tom. _______ you Bob?', options: ['Am', 'Is', 'Are', 'Be'], correctIndex: 2, explanation: 'You 前面用 Are。' },
    { id: 'g1u1-q16', question: '— Goodbye, Lily. — _______, Tom.', options: ['Hello', 'Goodbye', 'Morning', 'Name'], correctIndex: 1, explanation: 'Goodbye 回应 Goodbye。' },
    { id: 'g1u1-q17', question: 'She _______ my friend.', options: ['am', 'is', 'are', 'be'], correctIndex: 1, explanation: 'She 后面用 is。' },
    { id: 'g1u1-q18', question: 'We _______ good friends.', options: ['am', 'is', 'are', 'be'], correctIndex: 2, explanation: 'We 后面用 are。' },
    { id: 'g1u1-q19', question: '______ to meet you.', options: ['Nice', 'Good', 'Hello', 'What'], correctIndex: 0, explanation: 'Nice to meet you 是固定表达。' },
    { id: 'g1u1-q20', question: '— Hi, I am Mike. — Hi, Mike. I _______ John.', options: ['am', 'is', 'are', 'be'], correctIndex: 0, explanation: 'I 后面用 am。' },
  ],
  'g3-u1': [
    { id: 'q1', question: 'I like _______ stamps.', options: ['collect', 'collecting', 'collected', 'collects'], correctIndex: 1, explanation: 'like 后接动词 -ing 形式表示爱好。' },
    { id: 'q2', question: 'She _______ painting every weekend.', options: ['go', 'goes', 'going', 'went'], correctIndex: 1, explanation: '主语 she 是第三人称单数，一般现在时动词加 -es。' },
    { id: 'q3', question: 'What is your hobby? — My hobby is _______.', options: ['swim', 'swimming', 'swims', 'swam'], correctIndex: 1, explanation: 'be 动词后接名词或动名词作表语。' },
  ],
}

export const defaultGrammar: GrammarQuestion[] = [
  { id: 'd1', question: 'English _______ widely used around the world.', options: ['is', 'are', 'was', 'were'], correctIndex: 0, explanation: 'English 是不可数名词，用单数 is。' },
  { id: 'd2', question: 'If you work hard, you _______ success.', options: ['achieve', 'will achieve', 'achieved', 'achieving'], correctIndex: 1, explanation: 'if 引导的条件状语从句，主句用一般将来时。' },
]

export const speakingData: Record<string, SpeakingItem[]> = {
  'g1-u1': [
    { sentence: 'Hello, nice to meet you.', phonetic: '/həˈloʊ naɪs tuː miːt juː/', meaning: '你好，很高兴见到你。' },
    { sentence: 'My name is Amy.', phonetic: '/maɪ neɪm ɪz ˈeɪmi/', meaning: '我的名字是艾米。' },
    { sentence: 'Hi, I am Tom.', phonetic: '/haɪ aɪ æm tɑːm/', meaning: '嗨，我是汤姆。' },
    { sentence: 'Good morning, Miss Wang.', phonetic: '/ɡʊd ˈmɔːrnɪŋ mɪs wɑːŋ/', meaning: '早上好，王老师。' },
    { sentence: 'Good afternoon, class.', phonetic: '/ɡʊd ˌæftərˈnuːn klæs/', meaning: '下午好，同学们。' },
    { sentence: 'Good evening, Dad.', phonetic: '/ɡʊd ˈiːvnɪŋ dæd/', meaning: '晚上好，爸爸。' },
    { sentence: 'Goodbye, see you tomorrow.', phonetic: '/ˌɡʊdˈbaɪ siː juː təˈmɑːroʊ/', meaning: '再见，明天见。' },
    { sentence: 'Nice to meet you too.', phonetic: '/naɪs tuː miːt juː tuː/', meaning: '我也很高兴见到你。' },
    { sentence: 'What is your name?', phonetic: '/wʌt ɪz jʊr neɪm/', meaning: '你叫什么名字？' },
    { sentence: 'My name is Lily.', phonetic: '/maɪ neɪm ɪz ˈlɪli/', meaning: '我的名字是莉莉。' },
    { sentence: 'How are you?', phonetic: '/haʊ ɑːr juː/', meaning: '你好吗？' },
    { sentence: 'I am fine, thank you.', phonetic: '/aɪ æm faɪn θæŋk juː/', meaning: '我很好，谢谢你。' },
    { sentence: 'I am happy today.', phonetic: '/aɪ æm ˈhæpi təˈdeɪ/', meaning: '我今天很高兴。' },
    { sentence: 'She is my friend.', phonetic: '/ʃiː ɪz maɪ frend/', meaning: '她是我的朋友。' },
    { sentence: 'He is my brother.', phonetic: '/hiː ɪz maɪ ˈbrʌðər/', meaning: '他是我的兄弟。' },
    { sentence: 'This is my teacher.', phonetic: '/ðɪs ɪz maɪ ˈtiːtʃər/', meaning: '这是我的老师。' },
    { sentence: 'Bye, Mom.', phonetic: '/baɪ mɑːm/', meaning: '再见，妈妈。' },
    { sentence: 'See you later.', phonetic: '/siː juː ˈleɪtər/', meaning: '回头见。' },
    { sentence: 'I am a student.', phonetic: '/aɪ æm ə ˈstuːdənt/', meaning: '我是一名学生。' },
    { sentence: 'We are good friends.', phonetic: '/wiː ɑːr ɡʊd frendz/', meaning: '我们是好朋友。' },
  ],
}

export const defaultSpeaking: SpeakingItem[] = [
  { sentence: 'Practice makes perfect.', phonetic: '/ˈpræktɪs meɪks ˈpɜːrfɪkt/', meaning: '熟能生巧。' },
  { sentence: 'I enjoy learning English.', phonetic: '/aɪ ɪnˈdʒɔɪ ˈlɜːrnɪŋ ˈɪŋɡlɪʃ/', meaning: '我喜欢学英语。' },
]

export const listeningData: Record<string, ListeningItem[]> = {
  'g1-u1': [
    { audioText: 'Hello, I am Tom.', options: ['Hello, I am Tom.', 'Goodbye, I am Tom.', 'Hello, you are Tom.', 'Hi, my name is Lucy.'], correctIndex: 0 },
    { audioText: 'My name is Amy.', options: ['My name is Amy.', 'Your name is Amy.', 'Her name is Amy.', 'My name is Tom.'], correctIndex: 0 },
    { audioText: 'Good morning, Miss Wang.', options: ['Good morning, Miss Wang.', 'Good afternoon, Miss Wang.', 'Good evening, Miss Wang.', 'Goodbye, Miss Wang.'], correctIndex: 0 },
    { audioText: 'Nice to meet you.', options: ['Nice to meet you.', 'Nice to see you.', 'See you later.', 'Goodbye.'], correctIndex: 0 },
    { audioText: 'Goodbye, see you tomorrow.', options: ['Goodbye, see you tomorrow.', 'Hello, see you tomorrow.', 'Good morning, see you tomorrow.', 'Goodbye, see you today.'], correctIndex: 0 },
    { audioText: 'How are you?', options: ['How are you?', 'What is your name?', 'Who are you?', 'Where are you?'], correctIndex: 0 },
    { audioText: 'I am fine, thank you.', options: ['I am fine, thank you.', 'I am five, thank you.', 'I am fine, goodbye.', 'I am Tom, thank you.'], correctIndex: 0 },
    { audioText: 'She is my friend.', options: ['She is my friend.', 'He is my friend.', 'She is my teacher.', 'She is my mom.'], correctIndex: 0 },
    { audioText: 'Good afternoon, class.', options: ['Good afternoon, class.', 'Good morning, class.', 'Good evening, class.', 'Goodbye, class.'], correctIndex: 0 },
    { audioText: 'What is your name?', options: ['What is your name?', 'What is my name?', 'Who is your name?', 'Where is your name?'], correctIndex: 0 },
    { audioText: 'Hi, I am Lucy.', options: ['Hi, I am Lucy.', 'Hello, you are Lucy.', 'Hi, my name is Tom.', 'Goodbye, I am Lucy.'], correctIndex: 0 },
    { audioText: 'Nice to meet you too.', options: ['Nice to meet you too.', 'Nice to meet you.', 'See you too.', 'Goodbye too.'], correctIndex: 0 },
    { audioText: 'He is my brother.', options: ['He is my brother.', 'She is my brother.', 'He is my father.', 'He is my friend.'], correctIndex: 0 },
    { audioText: 'Good evening, Dad.', options: ['Good evening, Dad.', 'Good morning, Dad.', 'Good afternoon, Dad.', 'Goodbye, Dad.'], correctIndex: 0 },
    { audioText: 'This is my teacher.', options: ['This is my teacher.', 'That is my teacher.', 'This is my friend.', 'This is my student.'], correctIndex: 0 },
    { audioText: 'Bye, Mom.', options: ['Bye, Mom.', 'Hi, Mom.', 'Good morning, Mom.', 'See you, Mom.'], correctIndex: 0 },
    { audioText: 'See you later.', options: ['See you later.', 'See you tomorrow.', 'Goodbye later.', 'Meet you later.'], correctIndex: 0 },
    { audioText: 'I am a student.', options: ['I am a student.', 'You are a student.', 'I am a teacher.', 'I am a friend.'], correctIndex: 0 },
    { audioText: 'We are good friends.', options: ['We are good friends.', 'They are good friends.', 'We are good teachers.', 'We are students.'], correctIndex: 0 },
    { audioText: 'Good morning, boys and girls.', options: ['Good morning, boys and girls.', 'Good afternoon, boys and girls.', 'Good evening, boys and girls.', 'Goodbye, boys and girls.'], correctIndex: 0 },
  ],
  'g3-u1': [
    { audioText: 'Tom often plays basketball after school.', options: ['Tom plays basketball after school.', 'Tom plays soccer after school.', 'Tom watches TV after school.', 'Tom reads books after school.'], correctIndex: 0 },
    { audioText: 'Lily likes painting and dancing.', options: ['Lily likes singing.', 'Lily likes painting and dancing.', 'Lily likes swimming.', 'Lily likes running.'], correctIndex: 1 },
  ],
}

export const defaultListening: ListeningItem[] = [
  { audioText: 'English learning requires consistent practice.', options: ['English learning is easy.', 'English learning requires consistent practice.', 'English learning needs no practice.', 'English learning is boring.'], correctIndex: 1 },
]

export const achievements: Achievement[] = [
  { id: 'first-step', title: '初次启程', description: '完成第一堂课程', icon: 'Rocket' },
  { id: 'streak-3', title: '三日连胜', description: '连续学习 3 天', icon: 'Flame' },
  { id: 'streak-7', title: '一周坚持', description: '连续学习 7 天', icon: 'Flame' },
  { id: 'vocab-master', title: '单词达人', description: '累计记忆 100 个单词', icon: 'BookOpen' },
  { id: 'grammar-guru', title: '语法高手', description: '语法练习正确率达到 90%', icon: 'Brain' },
  { id: 'social-butterfly', title: '社区活跃者', description: '在社区发布第一条动态', icon: 'MessageCircle' },
  { id: 'xp-1000', title: '千分里程碑', description: '累计获得 1000 经验值', icon: 'Trophy' },
]
