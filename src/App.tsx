import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { questions, Question } from './data/questions';

type Screen = 'welcome' | 'share' | 'quiz' | 'result';

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomQuestions(count: number): Question[] {
  return shuffleArray(questions).slice(0, count);
}

function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [score, setScore] = useState(0);
  const [userName, setUserName] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionCode] = useState(generateSessionCode());
  const [copied, setCopied] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [groupNumber, setGroupNumber] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const QUESTIONS_PER_TEST = 20;
  const TIME_PER_QUESTION = 60;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setTotalTime((prev) => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive && screen === 'quiz') {
      handleNextQuestion();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, screen]);

  const startQuiz = () => {
    if (!userName.trim()) return;
    const randomQs = getRandomQuestions(QUESTIONS_PER_TEST);
    setTestQuestions(randomQs);
    setAnswers(new Array(QUESTIONS_PER_TEST).fill(null));
    setScreen('quiz');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setTimeLeft(TIME_PER_QUESTION);
    setTotalTime(0);
    setTimerActive(true);
    setStartTime(new Date());
    setEndTime(null);
  };

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null) return;
    setShowExplanation(true);
    setTimerActive(false);
    if (selectedAnswer === testQuestions[currentQuestion].correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < QUESTIONS_PER_TEST - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(TIME_PER_QUESTION);
      setTimerActive(true);
    } else {
      setTimerActive(false);
      setEndTime(new Date());
      setScreen('result');
    }
  };

  const restartQuiz = () => {
    setScreen('welcome');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers([]);
    setScore(0);
    setUserName('');
    setTotalTime(0);
    setGroupNumber('');
    setStartTime(null);
    setEndTime(null);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const generateReportText = () => {
    const { grade } = getGrade();
    const percentage = Math.round((score / QUESTIONS_PER_TEST) * 100);
    const startStr = startTime ? startTime.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }) : '—';
    const endStr = endTime ? endTime.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }) : '—';

    let text = `════════════════════════════════════════════════\n`;
    text += `     ОТЧЁТ О РЕЗУЛЬТАТАХ ТЕСТИРОВАНИЯ\n`;
    text += `════════════════════════════════════════════════\n\n`;
    text += `ТЕМА:\n`;
    text += `  Нормативное обеспечение функциональной\n`;
    text += `  безопасности\n\n`;
    text += `ПРОГРАММА:\n`;
    text += `  Проектирование, эксплуатация и обслуживание\n`;
    text += `  оборудования систем противоаварийной\n`;
    text += `  автоматической защиты (ПАЗ)\n\n`;
    text += `────────────────────────────────────────────────\n`;
    text += `ИНФОРМАЦИЯ ОБ УЧАСТНИКЕ:\n`;
    text += `────────────────────────────────────────────────\n`;
    text += `  ФИО:          ${userName}\n`;
    text += `  Группа:       ${groupNumber || 'не указана'}\n`;
    text += `  Код сессии:   ${sessionCode}\n`;
    text += `  Всего вопросов в базе: ${questions.length}\n`;
    text += `  Вопросов в тесте: ${QUESTIONS_PER_TEST} (выбраны случайно)\n\n`;
    text += `────────────────────────────────────────────────\n`;
    text += `АСТРОНОМИЧЕСКОЕ ВРЕМЯ:\n`;
    text += `────────────────────────────────────────────────\n`;
    text += `  Начало теста:   ${startStr}\n`;
    text += `  Окончание:      ${endStr}\n`;
    text += `  Затрачено:      ${formatTime(totalTime)}\n`;
    text += `  Ср. на вопрос:  ${formatTime(Math.round(totalTime / QUESTIONS_PER_TEST))}\n\n`;
    text += `────────────────────────────────────────────────\n`;
    text += `РЕЗУЛЬТАТ:\n`;
    text += `────────────────────────────────────────────────\n`;
    text += `  Правильных ответов: ${score} из ${QUESTIONS_PER_TEST}\n`;
    text += `  Процент:            ${percentage}%\n`;
    text += `  Оценка:             ${grade}\n`;
    text += `  Статус:             ${percentage >= 60 ? 'ТЕСТ ПРОЙДЕН ✓' : 'ТЕСТ НЕ ПРОЙДЕН ✗'}\n\n`;
    text += `────────────────────────────────────────────────\n`;
    text += `ДЕТАЛИЗАЦИЯ ОТВЕТОВ:\n`;
    text += `────────────────────────────────────────────────\n\n`;

    testQuestions.forEach((q, idx) => {
      const isCorrect = answers[idx] === q.correctAnswer;
      text += `Вопрос ${idx + 1}. ${isCorrect ? '[✓]' : '[✗]'}\n`;
      text += `${q.question}\n\n`;
      q.options.forEach((opt, optIdx) => {
        const marker = optIdx === q.correctAnswer ? '>>>' : '   ';
        const userMarker = optIdx === answers[idx] ? ' (ваш ответ)' : '';
        text += `${marker} ${String.fromCharCode(65 + optIdx)}) ${opt}${userMarker}\n`;
      });
      if (!isCorrect) {
        text += `\n  Правильный ответ: ${String.fromCharCode(65 + q.correctAnswer)}) ${q.options[q.correctAnswer]}\n`;
      }
      text += `\n  Пояснение: ${q.explanation}\n`;
      text += `\n${'─'.repeat(48)}\n\n`;
    });

    text += `════════════════════════════════════════════════\n`;
    text += `  Отчёт сформирован: ${new Date().toLocaleString('ru-RU')}\n`;
    text += `════════════════════════════════════════════════\n`;
    return text;
  };

  const createReportFile = (): File => {
    const text = generateReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const fileName = `Отчет_тест_${sessionCode}_${userName.replace(/\s+/g, '_')}.txt`;
    return new File([blob], fileName, { type: 'text/plain' });
  };

  const shareReportFile = async () => {
    const file = createReportFile();

    // Try Web Share API with files first
    if ('canShare' in navigator && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Отчёт о результатах тестирования',
          text: `Результат теста: ${userName} — ${score}/${QUESTIONS_PER_TEST} (${getGrade().grade})`,
          files: [file]
        });
        return;
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: download the file
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportResults = () => {
    const file = createReportFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getGrade = () => {
    const percentage = (score / QUESTIONS_PER_TEST) * 100;
    if (percentage >= 90) return { grade: 'Отлично', color: 'text-green-500', emoji: '🏆' };
    if (percentage >= 75) return { grade: 'Хорошо', color: 'text-blue-500', emoji: '👍' };
    if (percentage >= 60) return { grade: 'Удовлетворительно', color: 'text-yellow-500', emoji: '📝' };
    return { grade: 'Неудовлетворительно', color: 'text-red-500', emoji: '📚' };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Welcome Screen
  if (screen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-5 sm:p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">🛡️</div>
              <h1 className="text-lg sm:text-2xl font-bold text-white mb-2">
                Тест по функциональной безопасности
              </h1>
              <p className="text-blue-200 text-xs sm:text-base leading-relaxed">
                Нормативное обеспечение функциональной безопасности
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 sm:p-4 mb-4 border border-white/10">
              <h2 className="text-white font-semibold text-xs sm:text-sm mb-2">📋 Программа:</h2>
              <p className="text-blue-100 text-xs leading-relaxed">
                Проектирование, эксплуатация и обслуживание оборудования систем противоаварийной автоматической защиты
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 sm:p-4 mb-4 border border-white/10">
              <h3 className="text-white font-semibold text-xs sm:text-sm mb-2">📌 Информация о тесте:</h3>
              <ul className="text-blue-100 text-xs space-y-1">
                <li>• База вопросов: {questions.length} вопросов</li>
                <li>• В тесте: {QUESTIONS_PER_TEST} вопросов (случайный выбор)</li>
                <li>• Время на вопрос: {TIME_PER_QUESTION} секунд</li>
                <li>• Проходной балл: 60%</li>
                <li>• Темы: МЭК 61508, МЭК 61511, SIL, ПАЗ</li>
              </ul>
            </div>

            {/* Session code */}
            <div className="bg-indigo-500/20 rounded-2xl p-3 mb-4 border border-indigo-400/30 text-center">
              <p className="text-indigo-200 text-xs mb-1">Код сессии:</p>
              <p className="text-white font-mono font-bold text-xl tracking-widest">{sessionCode}</p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-white text-xs font-medium mb-1.5 block">
                  ФИО участника:
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm"
                />
              </div>
              <div>
                <label className="text-white text-xs font-medium mb-1.5 block">
                  Номер группы (необязательно):
                </label>
                <input
                  type="text"
                  value={groupNumber}
                  onChange={(e) => setGroupNumber(e.target.value)}
                  placeholder="ПАЗ-2024-01"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            <button
              onClick={startQuiz}
              disabled={!userName.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:shadow-none text-sm sm:text-base mb-3"
            >
              Начать тестирование
            </button>

            <button
              onClick={() => setScreen('share')}
              className="w-full py-2.5 px-6 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              <span>🔗</span>
              <span>Поделиться ссылкой на тест</span>
            </button>
          </div>

          <p className="text-center text-blue-300/60 text-xs mt-4">
            Доступно с любого устройства • Мобильная версия
          </p>
        </div>
      </div>
    );
  }

  // Share Screen
  if (screen === 'share') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-5 sm:p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">📱</div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Доступ к тесту
              </h1>
              <p className="text-blue-200 text-xs sm:text-sm">
                Отсканируйте QR-код или перейдите по ссылке
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-5">
              <div className="bg-white rounded-2xl p-4 shadow-xl">
                <QRCodeSVG
                  value={currentUrl}
                  size={200}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#1e293b"
                />
              </div>
            </div>

            {/* URL */}
            <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
              <p className="text-blue-200 text-xs mb-1.5 text-center">Ссылка для доступа:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-mono truncate"
                />
                <button
                  onClick={copyLink}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg font-medium text-xs transition-all ${
                    copied 
                      ? 'bg-green-500/30 text-green-300 border border-green-400/30' 
                      : 'bg-blue-500/30 text-blue-200 border border-blue-400/30 hover:bg-blue-500/40'
                  }`}
                >
                  {copied ? '✓ Скопировано' : '📋 Копировать'}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-4 mb-5 border border-white/10">
              <h3 className="text-white font-semibold text-sm mb-2">📌 Как подключить телефон:</h3>
              <ol className="text-blue-100 text-xs space-y-2">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-200">1</span>
                  <span>Откройте камеру телефона или приложение для сканирования QR-кодов</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-200">2</span>
                  <span>Наведите камеру на QR-код выше</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-200">3</span>
                  <span>Нажмите на появившуюся ссылку для открытия теста</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-200">4</span>
                  <span>Введите ФИО и пройдите тестирование</span>
                </li>
              </ol>
            </div>

            {/* Share buttons */}
            <div className="space-y-2">
              {'share' in navigator && (
                <button
                  onClick={() => {
                    navigator.share({
                      title: 'Тест по функциональной безопасности',
                      text: 'Приглашаю пройти тест по нормативному обеспечению функциональной безопасности',
                      url: currentUrl
                    }).catch(() => {});
                  }}
                  className="w-full py-2.5 px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
                >
                  <span>📤</span>
                  <span>Отправить ссылку</span>
                </button>
              )}
              
              <button
                onClick={copyLink}
                className={`w-full py-2.5 px-6 font-medium rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 ${
                  copied 
                    ? 'bg-green-500/30 text-green-200 border border-green-400/30' 
                    : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white'
                }`}
              >
                <span>{copied ? '✓' : '📋'}</span>
                <span>{copied ? 'Ссылка скопирована!' : 'Копировать ссылку'}</span>
              </button>
            </div>

            <button
              onClick={() => setScreen('welcome')}
              className="w-full py-2.5 px-6 mt-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium rounded-xl transition-all duration-200 text-sm"
            >
              ← Вернуться к тесту
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Screen
  if (screen === 'quiz') {
    const question = testQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / QUESTIONS_PER_TEST) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-3 sm:p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-200 text-xs sm:text-sm font-medium">
                Вопрос {currentQuestion + 1}/{QUESTIONS_PER_TEST}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-indigo-300 text-xs font-mono hidden sm:block">
                  {sessionCode}
                </span>
                <div className={`flex items-center gap-1 text-xs sm:text-sm font-mono font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-green-300'}`}>
                  <span>⏱</span>
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-400 to-indigo-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-5 sm:p-8 border border-white/20 shadow-2xl">
              <h2 className="text-white text-sm sm:text-lg font-semibold mb-5 sm:mb-6 leading-relaxed">
                {question.question}
              </h2>

              <div className="space-y-3">
                {question.options.map((option, index) => {
                  let optionStyle = 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-blue-400/50';
                  
                  if (selectedAnswer === index && !showExplanation) {
                    optionStyle = 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-400/50';
                  }
                  
                  if (showExplanation) {
                    if (index === question.correctAnswer) {
                      optionStyle = 'bg-green-500/20 border-green-400 ring-2 ring-green-400/50';
                    } else if (index === selectedAnswer && index !== question.correctAnswer) {
                      optionStyle = 'bg-red-500/20 border-red-400 ring-2 ring-red-400/50';
                    } else {
                      optionStyle = 'bg-white/5 border-white/10 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showExplanation}
                      className={`w-full text-left p-3 sm:p-4 rounded-xl border transition-all duration-200 ${optionStyle}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 flex items-center justify-center text-xs sm:text-sm font-bold text-white">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-white text-xs sm:text-sm leading-relaxed">
                          {option}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div className="mt-5 sm:mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-400/30">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-5 sm:mt-6 flex gap-3">
                {!showExplanation ? (
                  <button
                    onClick={handleConfirmAnswer}
                    disabled={selectedAnswer === null}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm sm:text-base"
                  >
                    Подтвердить ответ
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm sm:text-base"
                  >
                    {currentQuestion < QUESTIONS_PER_TEST - 1 ? 'Следующий вопрос →' : 'Завершить тест ✓'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result Screen
  if (screen === 'result') {
    const { grade, color, emoji } = getGrade();
    const percentage = Math.round((score / QUESTIONS_PER_TEST) * 100);
    const startStr = startTime ? startTime.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }) : '—';
    const endStr = endTime ? endTime.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }) : '—';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full" ref={resultRef}>
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-5 sm:p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">{emoji}</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Тест завершён!
              </h1>
              <p className="text-blue-200 text-sm">{userName}</p>
              {groupNumber && (
                <p className="text-blue-300/70 text-xs">Группа: {groupNumber}</p>
              )}
              <p className="text-indigo-300/70 text-xs font-mono mt-1">Код: {sessionCode}</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-5 mb-4 border border-white/10">
              <div className="text-center">
                <div className={`text-4xl sm:text-5xl font-bold ${color} mb-2`}>
                  {score}/{QUESTIONS_PER_TEST}
                </div>
                <div className="text-white/70 text-sm mb-3">
                  правильных ответов
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      percentage >= 90 ? 'bg-green-400' :
                      percentage >= 75 ? 'bg-blue-400' :
                      percentage >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className={`text-xl font-bold ${color}`}>
                  {grade} ({percentage}%)
                </div>
              </div>
            </div>

            {/* Time info */}
            <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/10">
              <h3 className="text-white/80 text-xs font-semibold mb-2">🕐 Астрономическое время:</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-white/50 text-[10px]">Начало</div>
                  <div className="text-white font-mono text-[11px]">{startStr}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-white/50 text-[10px]">Окончание</div>
                  <div className="text-white font-mono text-[11px]">{endStr}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center mt-2">
                <div>
                  <div className="text-white/60 text-[10px] mb-0.5">Затрачено</div>
                  <div className="text-white font-bold text-xs">{formatTime(totalTime)}</div>
                </div>
                <div>
                  <div className="text-white/60 text-[10px] mb-0.5">Ср. на вопрос</div>
                  <div className="text-white font-bold text-xs">{formatTime(Math.round(totalTime / QUESTIONS_PER_TEST))}</div>
                </div>
              </div>
            </div>

            {/* Review answers */}
            <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/10 max-h-40 overflow-y-auto">
              <h3 className="text-white font-semibold text-xs sm:text-sm mb-2">📋 Обзор ответов:</h3>
              <div className="space-y-1.5">
                {testQuestions.map((q, idx) => {
                  const isCorrect = answers[idx] === q.correctAnswer;
                  return (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span className={`flex-shrink-0 mt-0.5 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80 leading-relaxed">
                        <span className="text-white/50">#{idx + 1}</span> {q.question.substring(0, 50)}...
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={exportResults}
                  className="py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all duration-200 text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <span>📄</span>
                  <span>Скачать отчёт</span>
                </button>
                <button
                  onClick={shareReportFile}
                  className="py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <span>📤</span>
                  <span>Отправить файл</span>
                </button>
              </div>

              <button
                onClick={() => setShowExport(!showExport)}
                className="w-full py-2 px-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white/80 font-medium rounded-xl transition-all duration-200 text-xs sm:text-sm"
              >
                {showExport ? 'Скрыть результат ▼' : 'Показать полный результат ▶'}
              </button>

              {showExport && (
                <div className="bg-black/30 rounded-xl p-3 border border-white/10 max-h-60 overflow-y-auto">
                  <pre className="text-white/80 text-[10px] sm:text-xs whitespace-pre-wrap font-mono leading-relaxed">
                    {generateReportText()}
                  </pre>
                </div>
              )}

              <button
                onClick={restartQuiz}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm sm:text-base"
              >
                Пройти тест заново
              </button>
            </div>
          </div>

          <p className="text-center text-blue-300/60 text-xs mt-3">
            {copied && '✓ Скопировано в буфер обмена!'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
