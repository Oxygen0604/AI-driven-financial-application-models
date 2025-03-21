import os
import sys
from paddleocr import PaddleOCR, draw_ocr
import fitz
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np

os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

# 设置OCR参数
PAGE_NUM = 10

def process_pdf(pdf_path, ocr):
    # 使用fitz渲染PDF
    imgs = []
    all_text = []  # 存储所有文本
    
    with fitz.open(pdf_path) as pdf:
        total_pages = pdf.page_count  # 获取PDF总页数
        print(f"[DEBUG] Total pages in PDF: {total_pages}")
        for pg in range(min(PAGE_NUM, total_pages)):  # 避免超出实际页数
            page = pdf[pg]
            mat = fitz.Matrix(2, 2)
            pm = page.get_pixmap(matrix=mat, alpha=False)
            
            # 限制图像大小
            if pm.width > 2000 or pm.height > 2000:
                pm = page.get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
            
            img = Image.frombytes("RGB", [pm.width, pm.height], pm.samples)
            img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            imgs.append(img)
    
    # OCR识别
    result = ocr.ocr(imgs, cls=True)
    
    # 提取文本并保存
    for idx, res in enumerate(result):
        if res is None:
            continue
        
        # 添加页码信息
        page_text = [f"==== 第 {idx + 1} 页 ===="]
        
        # 提取文本
        for line in res:
            page_text.append(line[1][0])  # 添加识别的文本
        
        # 将页面文本添加到总文本
        all_text.append("\n".join(page_text))
    
    return "\n\n".join(all_text)

def process_image(image_path, ocr):
    # 处理图像的OCR识别
    result = ocr.ocr(image_path, cls=True)
    text_lines = []
    
    for idx, res in enumerate(result):
        if res is None:  # 跳过空页
            print(f"[DEBUG] Empty result detected, skip it.")
            continue
        
        for line in res:
            text_lines.append(line[1][0])  # 只保存文本内容
    
    return "\n".join(text_lines)

def process_file(file_path, ocr):
    # 获取文件扩展名并处理不同类型的文件
    file_name, file_extension = os.path.splitext(file_path)
    output_txt_path = file_name + ".txt"
    
    try:
        if file_extension.lower() == '.pdf':
            print(f"[DEBUG] Detected PDF file: {file_path}")
            text_content = process_pdf(file_path, ocr)
        elif file_extension.lower() in ['.jpg', '.jpeg', '.png', '.bmp', '.gif']:
            print(f"[DEBUG] Detected image file: {file_path}")
            text_content = process_image(file_path, ocr)
        else:
            print(f"[ERROR] Unsupported file type: {file_extension}")
            text_content = f"Unsupported file type: {file_extension}"
        
        # 保存文本内容到txt文件
        with open(output_txt_path, 'w', encoding='utf-8') as f:
            f.write(text_content)
        
        print(f"[INFO] OCR results saved to: {output_txt_path}")
        return output_txt_path
    except Exception as e:
        error_message = f"Error processing file: {str(e)}"
        print(f"[ERROR] {error_message}")
        
        # 即使出错也创建txt文件，包含错误信息
        with open(output_txt_path, 'w', encoding='utf-8') as f:
            f.write(error_message)
        
        return output_txt_path

def main():
    # 如果有命令行参数，使用第一个参数作为文件路径
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        # 默认文件路径
        file_path = r'C:\Users\Tony\Desktop\b496b899797046dc8597f9b187c748db.png'
    
    # 初始化OCR引擎
    ocr = PaddleOCR(use_angle_cls=True, lang="ch", page_num=PAGE_NUM)
    
    # 处理文件并获取生成的txt文件路径
    output_txt_path = process_file(file_path, ocr)
    
    # 打印结果路径用于调试
    print(f"[DEBUG] Text file generated: {output_txt_path}")

if __name__ == "__main__":
    main()