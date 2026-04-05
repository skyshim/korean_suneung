"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, notFound } from "next/navigation";
import passagesData from "@/data/passages.json";
import clsx from "clsx";

interface Question {
  id: string;
  number: number;
  text: string;
  options: string[];
  answer: number; // 1-5
}

interface Passage {
  id: string;
  year: number;
  exam_type: "수능" | "6월모평" | "9월모평" | "3월" | "4월" | "7월" | "10월";
  exam_form: "단일" | "A형" | "B형" | "공통";
  curriculum_era: "1기" | "2기" | "3기" | "4기";
  category:
    | "독서론"
    | "인문/예술"
    | "사회/문화"
    | "과학/기술"
    | "고전운문"
    | "고전산문"
    | "현대시"
    | "현대소설";
  domain: "독서" | "문학";
  title: string;
  source_label: string;
  content: string;
  questions: Question[];
}

type CurriculumEraFilter = "전체" | "1기" | "2기" | "3기" | "4기";

const curriculumEras: { label: string; value: CurriculumEraFilter; years: number[] }[] = [
  { label: "전체", value: "전체", years: [] },
  { label: "1기 (2011~13)", value: "1기", years: [2011, 2012, 2013] },
  { label: "2기 (2014~16)", value: "2기", years: [2014, 2015, 2016] },
  { label: "3기 (2017~21)", value: "3기", years: [2017, 2018, 2019, 2020, 2021] },
  { label: "4기 (2022~27)", value: "4기", years: [2022, 2023, 2024, 2025, 2026, 2027] },
];

export default function StudyCategoryPage() {
  const params = useParams();
  const categoryParam = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const decodedCategory = decodeURIComponent(categoryParam || "");

  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [selectedEraFilter, setSelectedEraFilter] = useState<CurriculumEraFilter>("전체");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | null>>({});
  const [showAnswers, setShowAnswers] = useState<boolean>(false);

  const filteredPassages = useMemo(() => {
    return passagesData.filter((passage) => {
      const categoryMatch = passage.category === decodedCategory;

      const eraMatch =
        selectedEraFilter === "전체" ||
        curriculumEras.find((era) => era.value === selectedEraFilter)?.years.includes(passage.year);
      
      return categoryMatch && eraMatch;
    });
  }, [decodedCategory, selectedEraFilter]);

  const pickRandomPassage = () => {
    if (filteredPassages.length === 0) {
      setSelectedPassage(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredPassages.length);
    setSelectedPassage(filteredPassages[randomIndex]);
    setSelectedAnswers({});
    setShowAnswers(false);
  };

  useEffect(() => {
    pickRandomPassage();
  }, [filteredPassages]); // Re-pick when filters change

  if (!decodedCategory) {
    notFound(); // Or handle as an error
  }

  if (!selectedPassage && filteredPassages.length === 0) {
    notFound(); // No passages found for this category and filter
  }

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    if (!showAnswers) { // Prevent changing answers after checking
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: optionIndex,
      }));
    }
  };

  const checkAnswers = () => {
    setShowAnswers(true);
  };

  return (
    <div className="container mx-auto p-4 pt-20 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-primary-blue">
        {decodedCategory} 학습
      </h1>

      <div className="mb-6 flex justify-between items-center">
        <label htmlFor="era-filter" className="text-lg font-medium text-gray-700">
          교육과정 기별 필터:
        </label>
        <select
          id="era-filter"
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
          value={selectedEraFilter}
          onChange={(e) => setSelectedEraFilter(e.target.value as CurriculumEraFilter)}
        >
          {curriculumEras.map((era) => (
            <option key={era.value} value={era.value}>
              {era.label}
            </option>
          ))}
        </select>
      </div>

      {selectedPassage ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <div className="mb-4">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-primary-blue ring-1 ring-inset ring-blue-700/10">
              {selectedPassage.year} {selectedPassage.exam_type}
            </span>
            <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              {selectedPassage.category}
            </span>
            <span className="ml-2 inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
              {selectedPassage.curriculum_era}기 · {selectedPassage.exam_form}
            </span>
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            {selectedPassage.title}
          </h2>
          <p className="text-gray-800 whitespace-pre-wrap mb-6 text-lg leading-relaxed max-w-prose mx-auto">
            {selectedPassage.content}
          </p>

          <h3 className="text-xl font-semibold mb-4 text-primary-blue">문제</h3>
          {selectedPassage.questions.map((question) => (
            <div key={question.id} className="mb-6 p-4 border border-gray-200 rounded-md">
              <p className="font-medium text-lg mb-3">
                {question.number}. {question.text}
              </p>
              <ul className="space-y-2">
                {question.options.map((option, index) => {
                  const optionNumber = index + 1;
                  const isSelected = selectedAnswers[question.id] === optionNumber;
                  const isCorrect = question.answer === optionNumber;
                  const showFeedback = showAnswers;

                  let optionClasses = "block w-full text-left px-4 py-2 rounded-md border transition-colors duration-200 ";

                  if (showFeedback) {
                    if (isCorrect) {
                      optionClasses += "bg-green-100 border-green-500 text-green-800 font-semibold ";
                    } else if (isSelected) {
                      optionClasses += "bg-red-100 border-red-500 text-red-800 ";
                    } else {
                      optionClasses += "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 ";
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
                        onClick={() => handleAnswerSelect(question.id, optionNumber)}
                        disabled={showFeedback}
                      >
                        {optionNumber}. {option}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {showAnswers && (
                <p className="mt-3 text-lg font-semibold">
                  정답: <span className="text-green-600">{question.answer}번</span>
                </p>
              )}
            </div>
          ))}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={checkAnswers}
              className="bg-primary-blue text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold"
              disabled={showAnswers}
            >
              정답 확인
            </button>
            <button
              onClick={pickRandomPassage}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-200 text-lg font-semibold"
            >
              다른 지문 보기
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-xl text-gray-600">
          선택된 카테고리와 필터에 해당하는 지문이 없습니다.
        </p>
      )}
    </div>
  );
}