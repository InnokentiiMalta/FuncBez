import { useState, useEffect } from 'react';
import { questions } from './data/questions';

type Screen = 'welcome' | 'quiz' | 'result';

function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [score, setScore] = useState(0);
  const [userName, setUserName] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [totalTime, setTotalTime] = useState(0);

  const QUESTIONS_PER_TEST = 20;
  const TIME_PER_QUESTION = 60; // seconds per question

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
    setScreen('quiz');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers(new Array(questions.length).fill(null));
    setScore(0);
    setTimeLeft(TIME_PER_QUESTION);
    setTotalTime(0);
    setTimerActive(true);
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
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
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
      setScreen('result');
    }
  };

  const restartQuiz = () => {
    setScreen('welcome');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers(new Array(questions.length).fill(null));
    setScore(0);
    setUserName('');
    setTotalTime(0);
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
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🛡️</div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Тест по функциональной безопасности
              </h1>
              <p className="text-blue-200 text-sm sm:text-base leading-relaxed">
                Нормативное обеспечение функциональной безопасности
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
              <h2 className="text-white font-semibold text-sm mb-3">📋 Программа:</h2>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Проектирование, эксплуатация и обслуживание оборудования систем противоаварийной автоматической защиты
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
              <h3 className="text-white font-semibold text-sm mb-2">📌 Информация о тесте:</h3>
              <ul className="text-blue-100 text-xs sm:text-sm space-y-1">
                <li>• Количество вопросов: {QUESTIONS_PER_TEST}</li>
                <li>• Время на вопрос: {TIME_PER_QUESTION} секунд</li>
                <li>• Проходной балл: 60%</li>
                <li>• Темы: МЭК 61508, МЭК 61511, SIL, ПАЗ</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="text-white text-sm font-medium mb-2 block">
                Введите ваше ФИО:
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm"
                onKeyDown={(e) => e.key === 'Enter' && startQuiz()}
              />
            </div>

            <button
              onClick={startQuiz}
              disabled={!userName.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:shadow-none text-sm sm:text-base"
            >
              Начать тестирование
            </button>
          </div>

          <p className="text-center text-blue-300/60 text-xs mt-4">
            Доступно с любого устройства • Мобильная версия
          </p>
        </div>
      </div>
    );
  }

  // Quiz Screen
  if (screen === 'quiz') {
    const question = questions[currentQuestion];
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
              <div className={`flex items-center gap-1 text-xs sm:text-sm font-mono font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-green-300'}`}>
                <span>⏱</span>
                <span>{formatTime(timeLeft)}</span>
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

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{emoji}</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Тест завершён!
              </h1>
              <p className="text-blue-200 text-sm">{userName}</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-5 mb-5 border border-white/10">
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

            <div className="bg-white/5 rounded-2xl p-4 mb-5 border border-white/10">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-white/60 text-xs mb-1">Затрачено времени</div>
                  <div className="text-white font-bold text-sm">{formatTime(totalTime)}</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs mb-1">Среднее на вопрос</div>
                  <div className="text-white font-bold text-sm">{formatTime(Math.round(totalTime / QUESTIONS_PER_TEST))}</div>
                </div>
              </div>
            </div>

            {/* Review answers */}
            <div className="bg-white/5 rounded-2xl p-4 mb-5 border border-white/10 max-h-60 overflow-y-auto">
              <h3 className="text-white font-semibold text-sm mb-3">📋 Обзор ответов:</h3>
              <div className="space-y-2">
                {questions.slice(0, QUESTIONS_PER_TEST).map((q, idx) => {
                  const isCorrect = answers[idx] === q.correctAnswer;
                  return (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span className={`flex-shrink-0 mt-0.5 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="text-white/80 leading-relaxed">
                        <span className="text-white/50">#{idx + 1}</span> {q.question.substring(0, 60)}...
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={restartQuiz}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm sm:text-base"
            >
              Пройти тест заново
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
