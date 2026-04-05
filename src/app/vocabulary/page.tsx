"use client";

import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";

interface WordEntry {
  id: string;
  word: string;
  pos: string;
  definition: string;
  examples: string[];
  createdAt: string;
}

interface DictSearchResult {
  word: string;
  pos: string;
  definition: string;
  examples: string[];
}

export default function VocabularyPage() {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResult, setSearchResult] = useState<DictSearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchWords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/words");
      if (!response.ok) throw new Error("단어 목록을 불러오지 못했습니다.");
      const data: WordEntry[] = await response.json();
      setWords(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const handleSearchWord = async () => {
    if (!searchTerm.trim()) {
      setSearchError("검색할 단어를 입력해주세요.");
      setSearchResult(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const response = await fetch(`/api/dict?word=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "사전 검색에 실패했습니다.");
      }
      const data: DictSearchResult = await response.json();
      setSearchResult(data);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSaveWord = async () => {
    if (!searchResult) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchResult),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "단어 저장에 실패했습니다.");
      }
      setSearchTerm("");
      setSearchResult(null);
      fetchWords();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm("정말로 이 단어를 삭제하시겠습니까?")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/words/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("단어 삭제에 실패했습니다.");
      fetchWords();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 pt-20 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-primary-blue">단어장</h1>

      {/* 단어 검색 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-primary-blue">단어 검색</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검색할 단어를 입력하세요 (예: 고유어)"
            className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            onKeyPress={(e) => { if (e.key === "Enter") handleSearchWord(); }}
            disabled={searchLoading}
          />
          <button
            onClick={handleSearchWord}
            className="bg-primary-blue text-white px-5 py-3 rounded-md shadow-sm hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={searchLoading}
          >
            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
            {searchLoading ? "검색 중..." : "검색"}
          </button>
        </div>

        {searchError && <p className="text-red-500 mt-2">{searchError}</p>}

        {searchResult && (
          <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
            <h3 className="text-xl font-semibold text-primary-blue mb-2">
              {searchResult.word}{" "}
              <span className="text-gray-600 text-base font-normal">({searchResult.pos})</span>
            </h3>
            <p className="text-gray-800 mb-3">
              <span className="font-medium">뜻풀이:</span> {searchResult.definition}
            </p>
            {searchResult.examples && searchResult.examples.length > 0 && (
              <div className="mb-3">
                <p className="font-medium text-gray-800 mb-1">용례:</p>
                <ul className="list-disc list-inside ml-4 text-gray-700 space-y-1">
                  {searchResult.examples.map((example, idx) => (
                    <li key={idx}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={handleSaveWord}
              className="mt-2 bg-green-600 text-white px-5 py-2 rounded-md shadow-sm hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <PlusIcon className="h-5 w-5 mr-2" /> 단어장에 저장
            </button>
          </div>
        )}
      </div>

      {/* 저장된 단어 목록 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-primary-blue">내 단어 목록</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading && <p className="text-center text-gray-600">단어를 불러오는 중...</p>}
        {!loading && words.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            아직 저장된 단어가 없습니다. 위에서 단어를 검색하여 추가해보세요!
          </p>
        )}
        {!loading && words.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {words.map((wordEntry) => (
              <div
                key={wordEntry.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-primary-blue">
                    {wordEntry.word}{" "}
                    <span className="text-gray-500 text-base font-normal">({wordEntry.pos})</span>
                  </h3>
                  <button
                    onClick={() => handleDeleteWord(wordEntry.id)}
                    className="text-red-500 hover:text-red-700 transition-colors ml-2 flex-shrink-0"
                    title="삭제"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-gray-700 text-sm mb-2">
                  <span className="font-medium">뜻풀이:</span> {wordEntry.definition}
                </p>
                {wordEntry.examples && wordEntry.examples.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-gray-700 text-sm mb-1">용례:</p>
                    <ul className="list-disc list-inside ml-4 text-gray-600 text-sm space-y-1">
                      {wordEntry.examples.map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3 text-right">
                  추가일: {new Date(wordEntry.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}