import argparse
import json
import re
from pdfminer.high_level import extract_text

def parse_pdf_to_json(pdf_path, year, exam_type):
    """
    Parses a PDF file to extract text and attempts to structure it into a JSON format
    suitable for Suneung passages.
    """
    content = extract_text(pdf_path)

    # 1. 연도 기반 교육과정 기 자동 추론
    curriculum_era = ""
    exam_form = ""
    if year <= 2013:
        curriculum_era = "1기"
        exam_form = "단일"
    elif 2014 <= year <= 2016:
        curriculum_era = "2기"
        # For 2기, exam_form (A형/B형) needs user input as it's not inferable from year alone
        print(f"Warning: For year {year}, please manually specify exam_form (A형/B형). Defaulting to '공통'.")
        exam_form = "공통" # Placeholder, should be prompted or passed as argument
    elif 2017 <= year <= 2021:
        curriculum_era = "3기"
        exam_form = "단일"
    elif year >= 2022:
        curriculum_era = "4기"
        exam_form = "공통"

    # 2. source_label 자동 생성 (placeholder, needs refinement based on actual PDF content)
    source_label = f"{year}학년도 {exam_type} 국어영역 [카테고리-영역]" # Category and domain need to be filled manually

    # Basic attempt to split content and questions
    # This is a very naive approach and will likely need significant manual correction
    passage_content = []
    questions_raw = []
    
    lines = content.split('\n')
    in_questions_section = False
    current_question = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Heuristic to detect start of questions (e.g., "1. 다음 글을 읽고 물음에 답하시오.")
        if re.match(r'^\d+\.\s', line) and len(passage_content) > 0 and not in_questions_section:
            in_questions_section = True
            if current_question: # Save any accumulated lines before the first question
                questions_raw.append("\n".join(current_question))
                current_question = []

        if in_questions_section:
            # Detect new question number
            if re.match(r'^\d+\.\s', line) and current_question:
                questions_raw.append("\n".join(current_question))
                current_question = []
            current_question.append(line)
        else:
            passage_content.append(line)
    
    if current_question:
        questions_raw.append("\n".join(current_question))

    # Further process questions_raw into structured questions
    structured_questions = []
    for q_raw in questions_raw:
        match_q_num = re.match(r'^(\d+)\.\s*(.*)', q_raw, re.DOTALL)
        if match_q_num:
            q_number = int(match_q_num.group(1))
            q_text_and_options = match_q_num.group(2).strip()

            # Attempt to split options (assuming 5 options, each starting with a number)
            options_match = re.findall(r'(\d)\.\s*(.*?)(?=\d\.\s*|$)', q_text_and_options, re.DOTALL)
            
            question_text = q_text_and_options
            options = []
            
            if options_match:
                # The actual question text is everything before the first option
                first_option_start = q_text_and_options.find(options_match[0][0] + '.')
                if first_option_start != -1:
                    question_text = q_text_and_options[:first_option_start].strip()
                
                for _, opt_text in options_match:
                    options.append(opt_text.strip())
            
            # Placeholder for answer, needs manual input
            structured_questions.append({
                "id": f"q-{year}-{q_number}",
                "number": q_number,
                "text": question_text,
                "options": options,
                "answer": 0 # Needs manual input (1-5)
            })


    passage_data = {
        "id": f"passage-{year}-{exam_type}",
        "year": year,
        "exam_type": exam_type,
        "exam_form": exam_form,
        "curriculum_era": curriculum_era,
        "category": "미정", # Needs manual input
        "domain": "미정",   # Needs manual input
        "title": "미정",    # Needs manual input
        "source_label": source_label,
        "content": "\n\n".join(passage_content),
        "questions": structured_questions,
    }

    return passage_data

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse Suneung PDF to JSON format.")
    parser.add_argument("--pdf", required=True, help="Path to the PDF file.")
    parser.add_argument("--year", type=int, required=True, help="Year of the exam (e.g., 2024).")
    parser.add_argument("--exam", required=True, help="Type of exam (e.g., 수능, 6월모평, 9월모평).")
    
    args = parser.parse_args()

    output_data = parse_pdf_to_json(args.pdf, args.year, args.exam)
    
    output_filename = f"output_{args.year}_{args.exam}.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully parsed '{args.pdf}' and saved to '{output_filename}'")
    print("Please review the generated JSON file and manually fill in 'category', 'domain', 'title', and 'answer' for questions.")
    print("For 2기 (2014-2016) exams, also verify 'exam_form' (A형/B형).")
