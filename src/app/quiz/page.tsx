"use client";

import { useState, useEffect, useCallback } from "react";
import { SparklesIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/20/solid";

interface WordEntry {
  id: string;
  word: string;
  pos: string;
  definition: string;
  examples: string[];
  createdAt: string;
}

interface QuizQuestion {
  word: string;
  definition: string;
  sentence: string;
  options: string[];
  correctAnswer: string;
}

export default function QuizPage() {
  const [allWords, setAllWords] = useState<WordEntry[]>([]);
  const [quizWords, setQuizWords] = useState<WordEntry[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [incorrectWords, setIncorrectWords] = useState<WordEntry[]>([]);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const MIN_WORDS_FOR_QUIZ = 5;

  const fetchAllWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/words");
      if (!response.ok) {
        throw new Error("단어를 불러오는데 실패했습니다.");
      }
      const data: WordEntry[] = await response.json();
      setAllWords(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllWords();
  }, [fetchAllWords]);

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const startQuiz = () => {
    if (allWords.length < MIN_WORDS_FOR_QUIZ) {
      setError(`단어를 ${MIN_WORDS_FOR_QUIZ}개 이상 저장한 뒤 퀴즈를 시작하세요.`);
      return;
    }
    const shuffledWords = shuffleArray([...allWords]);
    setQuizWords(shuffledWords);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIncorrectWords([]);
    setQuizStarted(true);
    setQuizQuestion(null);
    setSelectedOption(null);
    setShowResult(false);
    setError(null);
  };

  const generateQuestion = useCallback(async (wordEntry: WordEntry) => {
    setQuizLoading(true);
    try {
      // 1. Generate example sentence
      const sentenceResponse = await fetch("/api/quiz-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: wordEntry.word, definition: wordEntry.definition }),
      });

      if (!sentenceResponse.ok) {
        const errorData = await sentenceResponse.json();
        throw new Error(errorData.sentence || "예문 생성에 실패했습니다.");
      }
      const { sentence } = await sentenceResponse.json();

      // 2. Create options (correct word + 3 random incorrect words)
      const incorrectOptions = allWords
        .filter((w) => w.word !== wordEntry.word)
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, 3) // Take 3 random
        .map((w) => w.word);

      const options = shuffleArray([wordEntry.word, ...incorrectOptions]);

      setCurrentQuestion({
        word: wordEntry.word,
        definition: wordEntry.definition,
        sentence: sentence.replace(wordEntry.word, "___"),
        options,
        correctAnswer: wordEntry.word,
      });
    } catch (err: any) {
      setError(err.message);
      setCurrentQuestion({
        word: wordEntry.word,
        definition: wordEntry.definition,
        sentence: `${wordEntry.word}을(를) 활용한 문장을 생성하지 못했습니다.`,
        options: shuffleArray([wordEntry.word, ...allWords.filter(w => w.word !== wordEntry.word).sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.word)]),
        correctAnswer: wordEntry.word,
      });
    } finally {
      setQuizLoading(false);
    }
  }, [allWords]);

  useEffect(() => {
    if (quizStarted && quizWords.length > 0 && currentQuestionIndex < quizWords.length) {
      generateQuestion(quizWords[currentQuestionIndex]);
    } else if (quizStarted && currentQuestionIndex >= quizWords.length) {
      // Quiz finished
      setQuizStarted(false);
    }
  }, [quizStarted, quizWords, currentQuestionIndex, generateQuestion]);

  const submitAnswer = () => {
    if (selectedOption === null || !currentQuestion) return;

    setShowResult(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    } else {
      setIncorrectWords((prev) => [...prev, quizWords[currentQuestionIndex]]);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowResult(false);
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizWords([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIncorrectWords([]);
    setQuizQuestion(null);
    setSelectedOption(null);
    setShowResult(false);
    setError(null);
    fetchAllWords(); // Refresh words in case new ones were added
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 pt-20 text-center">
        <p className="text-xl text-gray-700">단어를 불러오는 중...</p>
      </div>
    );
  }

  if (error && !quizStarted) {
    return (
      <div className="container mx-auto p-4 pt-20 text-center">
        <p className="text-red-500 text-xl">{error}</p>
        <button
          onClick={fetchAllWords}
          className="mt-4 bg-primary-blue text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold"
        >
          <ArrowPathIcon className="h-5 w-5 inline-block mr-2" /> 다시 시도
        </button>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="container mx-auto p-4 pt-20 text-center max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-primary-blue">퀴즈</h1>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <p className="text-xl text-gray-700 mb-4">
            단어장에 저장된 단어를 활용하여 퀴즈를 풀어보세요!
          </p>
          <p className="text-lg text-gray-600 mb-6">
            현재 저장된 단어 수: {allWords.length}개 (최소 {MIN_WORDS_FOR_QUIZ}개 필요)
          </p>
          <button
            onClick={startQuiz}
            className="bg-primary-blue text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={allWords.length < MIN_WORDS_FOR_QUIZ}
          >
            <SparklesIcon className="h-5 w-5 inline-block mr-2" /> 퀴즈 시작
          </button>
          {allWords.length < MIN_WORDS_FOR_QUIZ && (
            <p className="text-red-500 mt-4">
              단어를 {MIN_WORDS_FOR_QUIZ}개 이상 저장한 뒤 퀴즈를 시작하세요.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (currentQuestionIndex >= quizWords.length) {
    // Quiz finished screen
    return (
      <div className="container mx-auto p-4 pt-20 text-center max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-primary-blue">퀴즈 결과</h1>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <p className="text-2xl font-semibold mb-4">
            총 {quizWords.length}문제 중 {score}문제 정답!
          </p>
          {incorrectWords.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-red-600 mb-3">틀린 단어</h2>
              <ul className="list-disc list-inside mx-auto max-w-md text-left">
                {incorrectWords.map((wordEntry) => (
                  <li key={wordEntry.id} className="mb-2">
                    <span className="font-semibold">{wordEntry.word}</span> ({wordEntry.pos}): {wordEntry.definition}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={resetQuiz}
            className="mt-8 bg-primary-blue text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold"
          >
            <ArrowPathIcon className="h-5 w-5 inline-block mr-2" /> 다시 퀴즈 풀기
          </button>
        </div>
      </div>
    );
  }

  // Current question display
  return (
    <div className="container mx-auto p-4 pt-20 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-primary-blue">퀴즈</h1>
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-lg text-gray-600 mb-4">
          {currentQuestionIndex + 1} / {quizWords.length} 문제
        </p>
        {quizLoading ? (
          <p className="text-center text-xl text-gray-700">문제 생성 중...</p>
        ) : (
          currentQuestion && (
            <>
              <p className="text-xl font-medium mb-6">
                다음 문장의 빈칸에 들어갈 알맞은 단어는?
              </p>
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <p className="text-2xl font-semibold text-primary-blue text-center">
                  {currentQuestion.sentence}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = currentQuestion.correctAnswer === option;

                  let optionClasses = "block w-full text-left p-3 rounded-md border transition-colors duration-200 ";

                  if (showResult) {
                    if (isCorrect) {
                      optionClasses += "bg-green-100 border-green-500 text-green-800 font-semibold ";
                    } else if (isSelected) {
                      optionClasses += "bg-red-100 border-red-500 text-red-800 ";
                    } else {
                      optionClasses += "bg-gray-50 border-gray-200 text-gray-700 ";
                    }
                  } else {
                    optionClasses += isSelected
                      ? "bg-primary-blue text-white border-primary-blue"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
                  }

                  return (
                    <li key={index}>
                      <button
                        className={optionClasses}
                        onClick={() => setSelectedOption(option)}
                        disabled={showResult}
                      >
                        {index + 1}. {option}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {showResult && (
                <div className="mt-6 p-4 rounded-md bg-blue-50 border border-blue-200">
                  <p className="text-lg font-semibold mb-2">
                    {selectedOption === currentQuestion.correctAnswer ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircleIcon className="h-6 w-6 mr-2" /> 정답입니다!
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <XCircleIcon className="h-6 w-6 mr-2" /> 오답입니다.
                      </span>
                    )}
                  </p>
                  <p className="text-gray-800 mb-2">
                    <span className="font-semibold">정답:</span> {currentQuestion.correctAnswer}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">뜻풀이:</span> {currentQuestion.definition}
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-4 mt-8">
                {!showResult ? (
                  <button
                    onClick={submitAnswer}
                    className="bg-primary-blue text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedOption === null}
                  >
                    정답 확인
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="bg-primary-blue text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold"
                  >
                    {currentQuestionIndex < quizWords.length - 1 ? "다음 문제" : "결과 보기"}
                  </button>
                )}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

