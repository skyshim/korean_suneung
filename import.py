import pdfplumber
import re
import os

# ==========================================
# 1. AI 전달용 표준 프롬프트 (파일 생성 시 자동 삽입)
# ==========================================
PROMPT_TEMPLATE = """--- 명령: 아래 텍스트를 분석하여 기출문제 JSON 객체로 변환해줘 ---
[제한사항 및 규격]
원문을 최대한 그대로 유지하면서 다음 규격에 맞는 JSON 객체를 생성할 것.
1. 형식: 반드시 아래 구조를 가진 JSON 객체 1개만 생성할 것. (배열로 감싸지 말 것)
2. subCategory: (독서론, 인문예술, 사회문화, 과학기술, 고전산문, 고전시가, 현대시, 현대소설) 중 선택.
3. hasView: 문제에 <보기>가 포함되어 있다면 true, 아니면 false.
4. viewContent: <보기> 안의 텍스트. 원문 그대로 복원할 것.
5. answer: 정답 번호 (0~4 인덱스). 1번이 정답이면 0, 5번이 정답이면 4.
6. explanation: 정답인 이유를 지문에 근거하여 1~2문장으로 설명.

[JSON 구조 예시]
{
  "id": 1,
  "year": "2025학년도 수능",
  "category": "국어",
  "subCategory": "독서론",
  "title": "지문의 핵심 소재 제목",
  "content": "지문 전체 텍스트...",
  "questions": [
    {
      "id": "q1",
      "text": "문제 질문...",
      "hasView": false,
      "viewContent": "",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4", "선택지5"],
      "answer": 2,
      "explanation": "..."
    }
  ]
}

--- 추출된 텍스트 시작 ---
"""

def clean_text(text):
    """추출된 텍스트에서 문제지 특유의 노이즈를 제거합니다."""
    if not text: return ""
    noise_patterns = [
        r"이 문제지에 관한 저작권은 한국교육과정평가원에 있습니다\.",
        r"한국교육과정평가원",
        r"\d{4}학년도 대학수학능력시험 문제지",
        r"대학\s?수학\s?능력\s?시험\s?문제지",
        r"학능력시험",
        r"제\s?\d\s?교시",
        r"국어\s?영역",
        r"홀수형|짝수형",
        r"(\n\s*)\d+(\s*\n)", # 페이지 번호
    ]
    for pattern in noise_patterns:
        text = re.sub(pattern, "", text)
    
    # 가독성 및 구조 개선
    text = re.sub(r"(\n\d+\.)", r"\n\n\1", text) # 문제 번호 앞 줄바꿈
    text = re.sub(r"‘\s*’", "‘[내용 확인 필요]’", text)
    text = re.sub(r"\'\s*\'", "\'[내용 확인 필요]\'", text)
    text = re.sub(r" +", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text

def extract_kichul_text(pdf_path):
    """PDF를 읽어 지문 세트별로 리스트를 반환합니다."""
    if not os.path.exists(pdf_path):
        print(f"❌ 오류: '{pdf_path}' 파일을 찾을 수 없습니다.")
        return None

    full_text = ""
    print(f"[{pdf_path}] 분석 시작 (1~12페이지)...")
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # 공통 과목 범위인 12페이지까지 우선 처리
            pages_to_read = pdf.pages[:12]
            for i, page in enumerate(pages_to_read):
                width = page.width
                height = page.height
                
                # 수능 문제지 특유의 2단 구성을 고려하여 좌우 분할 추출
                left_bbox = (0, 0, width / 2, height)
                left_text = page.within_bbox(left_bbox).extract_text(x_tolerance=3, y_tolerance=3)
                
                right_bbox = (width / 2, 0, width, height)
                right_text = page.within_bbox(right_bbox).extract_text(x_tolerance=3, y_tolerance=3)
                
                if left_text: full_text += left_text + "\n"
                if right_text: full_text += right_text + "\n"
                print(f"{i+1}페이지 추출 완료...")
    except Exception as e:
        print(f"❌ PDF 읽기 중 오류 발생: {e}")
        return None

    full_text = clean_text(full_text)
    
    # 지문 범위를 나타내는 [1~3], [4~9] 패턴으로 텍스트 분할
    passage_pattern = r"(\[\s?\d+\s?[~～]\s?\d+\s?\])"
    parts = re.split(passage_pattern, full_text)
    
    passages = []
    if len(parts) <= 1:
        passages.append({"range": "전체", "raw_text": full_text})
    else:
        # 분할된 파트에서 [범위]와 내용을 매칭
        for i in range(1, len(parts), 2):
            range_label = parts[i].strip()
            content = parts[i+1] if i+1 < len(parts) else ""
            passages.append({"range": range_label, "raw_text": content.strip()})
            
    return passages

def save_to_work_files(passages, output_dir="work_files"):
    """추출된 지문들을 개별 파일로 저장하며 프롬프트를 삽입합니다."""
    if not passages: return
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    file_count = 0
    for item in passages:
        # 정규식으로 시작 번호 추출하여 파일명 정렬 용이하게 구성
        nums = re.findall(r"\d+", item['range'])
        start_num = int(nums[0]) if nums else 99
        
        # 34번 이후(선택과목)는 일단 제외하거나 필요에 따라 수정 가능
        if start_num > 34: continue

        safe_range = re.sub(r"[^\d~-]", "", item['range'].replace("～", "~"))
        filename = f"{output_dir}/work_{file_count+1:02d}_{safe_range}.txt"
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write(PROMPT_TEMPLATE)
            f.write(f"지문 범위: {item['range']}\n\n")
            f.write(item['raw_text'])
        
        print(f"✅ 파일 생성 완료: {filename}")
        file_count += 1

if __name__ == "__main__":
    # PDF 파일명이 실제 파일과 일치하는지 확인하세요.
    target_pdf = "2025대비 수능 - 국어 문제.pdf"
    data = extract_kichul_text(target_pdf)
    if data:
        save_to_work_files(data)
        print(f"\n총 {len(data)}개의 지문 세트가 발견되었습니다.")
        print(f"작업 완료! 'work_files' 폴더 내의 txt 파일을 하나씩 AI에게 전달하여 JSON으로 변환하세요.")