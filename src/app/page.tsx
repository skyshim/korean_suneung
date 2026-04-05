import Link from "next/link";

const categories = [
  { name: "독서론", href: "/study/" + encodeURIComponent("독서론"), domain: "독서" },
  { name: "인문/예술", href: "/study/" + encodeURIComponent("인문/예술"), domain: "독서" },
  { name: "사회/문화", href: "/study/" + encodeURIComponent("사회/문화"), domain: "독서" },
  { name: "과학/기술", href: "/study/" + encodeURIComponent("과학/기술"), domain: "독서" },
  { name: "고전운문", href: "/study/" + encodeURIComponent("고전운문"), domain: "문학" },
  { name: "고전산문", href: "/study/" + encodeURIComponent("고전산문"), domain: "문학" },
  { name: "현대시", href: "/study/" + encodeURIComponent("현대시"), domain: "문학" },
  { name: "현대소설", href: "/study/" + encodeURIComponent("현대소설"), domain: "문학" },
];

export default function Home() {
  return (
    <div className="container mx-auto p-4 pt-20">
      <h1 className="text-3xl font-bold text-center mb-8 text-primary-blue">수능 국어 학습 시작하기</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-primary-blue">독서 영역</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories
            .filter((cat) => cat.domain === "독서")
            .map((category) => (
              <Link key={category.name} href={category.href} className="block">
                <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
                  <h3 className="text-xl font-semibold text-primary-blue">{category.name}</h3>
                  <p className="text-gray-600 mt-2">독서 지문 학습</p>
                </div>
              </Link>
            ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-primary-blue">문학 영역</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories
            .filter((cat) => cat.domain === "문학")
            .map((category) => (
              <Link key={category.name} href={category.href} className="block">
                <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
                  <h3 className="text-xl font-semibold text-primary-blue">{category.name}</h3>
                  <p className="text-gray-600 mt-2">문학 지문 학습</p>
                </div>
              </Link>
            ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
        <Link href="/vocabulary">
          <button className="bg-primary-blue text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold w-full sm:w-auto">
            단어장 바로가기
          </button>
        </Link>
        <Link href="/quiz">
          <button className="bg-primary-blue text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold w-full sm:w-auto">
            퀴즈 바로가기
          </button>
        </Link>
      </div>
    </div>
  );
}