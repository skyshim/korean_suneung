import streamlit as st
import pdfplumber
import re
import io

# --- 페이지 설정 ---
st.set_page_config(page_title="국어 기출 PDF 추출기", layout="wide")

# --- 텍스트 정제 로직 ---
def clean_text(text):
    if not text: return ""
    noise_patterns = [
        r"이 문제지에 관한 저작권은 한국교육과정평가원에 있습니다\.",
        r"한국교육과정평가원",
        r"\d{4}학년도 대학수학능력시험 문제지",
        r"대학\s?수학\s?능력\s?시험\s?문제지",
        r"제\s?\d\s?교시",
        r"국어\s?영역",
        r"홀수형|짝수형",
        r"(\n\s*)\d+(\s*\n)", 
    ]
    for pattern in noise_patterns:
        text = re.sub(pattern, "", text)
    text = re.sub(r"(\n\d+\.)", r"\n\n\1", text)
    text = re.sub(r" +", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text

# --- AI 프롬프트 템플릿 ---
PROMPT_TEMPLATE = """--- 명령: 아래 텍스트를 분석하여 기출문제 JSON 객체로 변환해줘 ---

[제한사항 및 규격]
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

# --- 웹 UI 구성 ---
st.title("📄 국어 기출 PDF 텍스트 추출기")
st.info("PDF를 업로드하면 지문별로 쪼개어 AI용 프롬프트를 생성합니다.")

uploaded_file = st.file_uploader("수능/모평 기출 PDF를 업로드하세요", type="pdf")

if uploaded_file is not None:
    passages = []
    
    with st.spinner('PDF 분석 중... (2단 구성을 읽고 있습니다)'):
        with pdfplumber.open(io.BytesIO(uploaded_file.read())) as pdf:
            full_text = ""
            # 공통 과목 범위만 추출 (보통 1~12p)
            pages = pdf.pages[:12]
            for page in pages:
                width = page.width
                # 2단 구성 처리
                left = page.within_bbox((0, 0, width/2, page.height)).extract_text()
                right = page.within_bbox((width/2, 0, width, page.height)).extract_text()
                if left: full_text += left + "\n"
                if right: full_text += right + "\n"
            
            cleaned = clean_text(full_text)
            
            # 지문 분할 (정규식 사용)
            parts = re.split(r"(\[\s?\d+\s?[~～]\s?\d+\s?\])", cleaned)
            for i in range(1, len(parts), 2):
                range_label = parts[i].strip()
                content = parts[i+1].strip() if i+1 < len(parts) else ""
                
                # 34번 이후 선택과목 제외
                nums = re.findall(r"\d+", range_label)
                if nums and int(nums[0]) <= 34:
                    passages.append({"range": range_label, "text": content})

    st.success(f"총 {len(passages)}개의 지문 세트를 찾았습니다.")
    
    # --- 결과 표시 부분 (st.code 활용) ---
    for idx, item in enumerate(passages):
        with st.expander(f"세트 {idx+1}: {item['range']}"):
            final_output = f"{PROMPT_TEMPLATE}\n지문 범위: {item['range']}\n\n{item['text']}"
            
            st.markdown("##### 📋 AI 프롬프트 (우측 상단 아이콘 클릭 시 복사)")
            
            # st.code는 내장 복사 버튼을 제공하므로 오류 없이 가장 확실합니다.
            st.code(final_output, language="text")
            
            # 다운로드 버튼은 하단에 배치
            st.download_button(
                label="💾 텍스트 파일로 별도 저장",
                data=final_output,
                file_name=f"work_{idx+1}_{item['range']}.txt",
                mime="text/plain",
                key=f"dl_btn_{idx}"
            )