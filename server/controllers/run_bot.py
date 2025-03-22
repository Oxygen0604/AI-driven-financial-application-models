#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import argparse
import subprocess

def main():
    parser = argparse.ArgumentParser(description="LLM适配器")
    parser.add_argument("--api_key", required=True, help="API密钥")
    parser.add_argument("--model", default="deepseek-chat", help="模型名称")
    parser.add_argument("--input", required=True, help="用户输入")
    parser.add_argument("--file", help="文件路径")
    args = parser.parse_args()

    # LLM.py的路径
    llm_path = os.environ.get("PYTHON_SCRIPT_PATH", "C:/Users/liyiz/Desktop/AI-driven-financial-application-models-latest/AI chatbot/LLM.py")

    # 读取文件内容
    file_content = ""
    if args.file and os.path.exists(args.file):
        try:
            with open(args.file, 'r', encoding='utf-8') as f:
                file_content = f.read()
        except UnicodeDecodeError:
            try:
                with open(args.file, 'r', encoding='gbk') as f:
                    file_content = f.read()
            except UnicodeDecodeError:
                with open(args.file, 'r', encoding='latin-1') as f:
                    file_content = f.read()

    # 调用LLM.py
    cmd = [
        sys.executable,  # python解释器
        llm_path,
        "--model", args.model,
        "--embedding_path", os.environ.get("EMBEDDING_PATH", "model")
    ]

    try:
        # 创建LLM.py进程
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # 通过标准输入发送命令和文件内容
        user_input = f"请处理以下文本内容：\n\n{file_content}\n\n{args.input}"
        stdout, stderr = process.communicate(input=user_input)

        # 输出LLM.py的处理结果
        if process.returncode == 0:
            print(stdout)
        else:
            print(f"LLM.py执行失败: {stderr}")
            # 生成备用摘要
            print(f"""**关键词**：文档分析；
**关键词解释**：对文档内容进行分析和处理；
**文章摘要**：这是一份文档内容，包含约{len(file_content)/100:.0f}00字符。由于处理失败，此摘要由系统自动生成；
**文章大纲**：
- 文档部分一
- 文档部分二
- 文档部分三""")
    except Exception as e:
        print(f"执行LLM.py时出错: {str(e)}")
        # 生成备用摘要
        print(f"""**关键词**：文档分析；
**关键词解释**：对文档内容进行分析和处理；
**文章摘要**：这是一份文档内容，包含约{len(file_content)/100:.0f}00字符。由于执行出错，此摘要由系统自动生成；
**文章大纲**：
- 文档部分一
- 文档部分二
- 文档部分三""")

if __name__ == "__main__":
    main()
