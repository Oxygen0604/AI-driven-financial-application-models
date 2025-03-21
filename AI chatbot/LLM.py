from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from typing import Optional, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
import os
import datetime
import argparse
import requests
import json
import logging
from langchain.prompts import ChatPromptTemplate
from langchain_community.document_loaders import TextLoader, PyPDFLoader, DirectoryLoader
from langchain_community.vectorstores import FAISS
from transformers import AutoModel, AutoTokenizer
import torch

class LangChainChatBot:
    def __init__(self, 
                 api_key: str,
                 model_name: str = "deepseek-reasoner",
                 model_configs: Optional[Dict[str, Any]] = None,
                 memory_type: str = "buffer",
                 base_url: str = "https://api.deepseek.com",
                 db_url: Optional[str] = None,
                 db_token: Optional[str] = None,
                 use_async_db: bool = False,
                 embedding_model_path: str = r"model"):
        
        # 保留原有的初始化代码
        self.api_key = api_key
        self.model_name = model_name
        self.model_configs = model_configs or {}
        self.base_url = base_url
        
        # 初始化各组件
        self._initialize_llm()
        self._initialize_prompt()
        self._initialize_memory(memory_type)
        self._initialize_conversation_chain()
        
        # RAG相关属性
        self.embedding_model = None
        self.tokenizer = None
        self.vector_store = None
        self.retriever = None
        self.qa_chain = None
        self.documents = []
        
        # 数据库相关属性
        self.db_url = db_url
        self.db_token = db_token
        self.use_async_db = use_async_db
        
        # Embedding模型保存路径
        self.embedding_model_path = embedding_model_path
        # 确保embedding模型目录存在
        os.makedirs(self.embedding_model_path, exist_ok=True)
        
        print(f"Using Deepseek API with model: {self.model_name}")
        print(f"Embedding模型保存路径: {self.embedding_model_path}")
        
    def _initialize_embeddings(self, model_path="paraphrase-multilingual-MiniLM-L12-v2"):
        """初始化嵌入模型 - 使用 transformers 库从 Hugging Face 加载模型"""
        try:
            # 使用 Hugging Face 上的模型
            self.embedding_model = AutoModel.from_pretrained(model_path, trust_remote_code=True)  # 加载模型
            self.tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)  # 加载对应的 tokenizer

            print(f"嵌入模型从 Hugging Face 加载成功: {model_path}")
        except Exception as e:
            print(f"嵌入模型加载失败: {str(e)}")
            self.embedding_model = None
            self.tokenizer = None
          
    def _initialize_llm(self):
        """初始化使用OpenAI客户端接口的DeepSeek LLM"""
        # 设置默认参数
        llm_kwargs = {
            "max_tokens": 1024,
            "temperature": 0.7,
            "top_p": 0.95,
            "presence_penalty": 0.1,
            **self.model_configs.get("llm_kwargs", {})
        }
        
        self.llm = ChatOpenAI(
            api_key=self.api_key,
            model_name=self.model_name,
            base_url=self.base_url,
            **llm_kwargs
        )
    
    def _initialize_prompt(self):
        """初始化提示词模板"""
        self.default_template = """
        你是一个文本处理器，我会上传给你文本，你需要:
        1. 始终保持礼貌和专业的态度
        2. 给出清晰、准确的回答
        3. 在不确定的情况下诚实承认
        4. 避免有害或不当的内容
        5. 使用用户的语言进行回复
        6. 提取出文本关键词并对文本关键词做出解释
        7. 使用清晰明了的语言总结文本内容
        8. 对文本进行分块划分
        9. 仔细阅读文本内容，当我向你提问时，你可以迅速找到问题在文本中的具体位置
    
        当前对话历史：
        {history}

        Human: {input}
        Assistant:"""
    
        self.prompt = PromptTemplate(
            input_variables=["history", "input"],
            template=self.default_template
        )
    
    def _initialize_memory(self, memory_type: str):
        """
        初始化对话记忆
        :param memory_type: 记忆类型
        """
        if memory_type == "summary":
            self.memory = ConversationSummaryMemory(
                llm=self.llm,
                return_messages=True,
                memory_key="history"
            )
        else:  # default to buffer
            self.memory = ConversationBufferMemory(
                return_messages=True,
                memory_key="history"
            )
            
    def _initialize_conversation_chain(self):
        """初始化对话链"""
        self.conversation = ConversationChain(
            llm=self.llm,
            memory=self.memory,
            prompt=self.prompt,
            verbose=False
        )

    def generate_embeddings(self, texts):
        """生成嵌入向量"""
        try:
            # 对输入文本进行编码
            inputs = self.tokenizer(texts, padding=True, truncation=True, return_tensors="pt")
            with torch.no_grad():  # 禁用梯度计算
                # 获取模型的输出
                embeddings = self.embedding_model(**inputs).last_hidden_state.mean(dim=1)  # 获取嵌入向量
            return embeddings
        except Exception as e:
            print(f"生成嵌入向量失败: {str(e)}")
            return None
    
    def update_model_config(self, config_updates: Dict[str, Any]):
        """
        更新模型配置
        :param config_updates: 要更新的配置参数
        """
        self.model_configs.update(config_updates)
        self._initialize_llm()
        self._initialize_conversation_chain()
    
    def update_pipeline_config(self, 
                             temperature: Optional[float] = None,
                             max_tokens: Optional[int] = None,
                             top_p: Optional[float] = None,
                             presence_penalty: Optional[float] = None):
        """
        更新pipeline配置
        :param temperature: 温度参数
        :param max_tokens: 最大生成token数
        :param top_p: top-p采样参数
        :param presence_penalty: 重复惩罚参数 (OpenAI接口中的等效参数)
        """
        llm_kwargs = self.model_configs.get("llm_kwargs", {})
        
        if temperature is not None:
            llm_kwargs["temperature"] = temperature
        if max_tokens is not None:
            llm_kwargs["max_tokens"] = max_tokens
        if top_p is not None:
            llm_kwargs["top_p"] = top_p
        if presence_penalty is not None:
            llm_kwargs["presence_penalty"] = presence_penalty
            
        self.model_configs["llm_kwargs"] = llm_kwargs
        self._initialize_llm()
        self._initialize_conversation_chain()
    
    def set_memory_type(self, memory_type: str):
        """
        设置记忆类型
        :param memory_type: "buffer" 或 "summary"
        """
        self._initialize_memory(memory_type)
        self._initialize_conversation_chain()
    
    def customize_prompt(self, new_template: str):
        """
        自定义提示模板
        :param new_template: 新的提示模板
        """
        self.prompt = PromptTemplate(
            input_variables=["history", "input"],
            template=new_template
        )
        self._initialize_conversation_chain()
    
    def generate_response(self, user_input: str) -> str:
        """
        生成回复
        :param user_input: 用户输入的文本
        :return: AI的回复
        """
        try:
            # 如果已启用RAG且QA链已初始化，则使用RAG进行回答
            if self.qa_chain is not None:
                # 获取检索到的文档内容
                docs = self.retriever.get_relevant_documents(user_input)
                context = "\n\n".join([doc.page_content for doc in docs])
                
                # 使用QA链回答问题
                result = self.qa_chain({"query": user_input})
                response = result["result"].strip()
                
                metadata = {
                    "rag_enabled": True,
                    "document_sources": [doc.metadata for doc in docs],
                    "context_used": context[:500] + "..." if len(context) > 500 else context
                }
            else:
                # 使用普通对话链
                response = self.conversation.predict(input=user_input)
                metadata = {"rag_enabled": False}
                
            # 将对话添加到记忆中，以便普通对话仍能访问上下文
            self.memory.chat_memory.add_user_message(user_input)
            self.memory.chat_memory.add_ai_message(response)
            
            # 如果设置了数据库URL，则将响应发送到数据库
            if hasattr(self, 'db_url') and self.db_url:
                try:
                    # 发送响应到数据库
                    self._send_to_database(
                        response=response,
                        user_input=user_input,
                        metadata=metadata
                    )
                except Exception as e:
                    print(f"发送响应到数据库时出错: {str(e)}")
            
            return response
        except Exception as e:
            import traceback
            error_msg = f"发生错误: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            return f"发生错误: {str(e)}"
    
    def _send_to_database(self, response: str, user_input: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        将AI响应通过HTTP发送到数据库后端
        
        参数:
            response: AI生成的响应内容
            user_input: 用户的输入
            metadata: 附加的元数据（可选）
        
        返回:
            bool: 发送成功返回True，失败返回False
        """
        try:
            # 设置请求URL
            url = f"{self.db_url}/api/chat_responses"
            
            # 准备请求数据
            payload = {
                "user_input": user_input,
                "ai_response": response,
                "timestamp": datetime.datetime.now().isoformat(),
            }
            
            # 添加元数据（如果有）
            if metadata:
                payload["metadata"] = metadata
                
            # 设置请求头
            headers = {"Content-Type": "application/json"}
            if self.db_token:
                headers["Authorization"] = f"Bearer {self.db_token}"
            
            # 发送POST请求
            resp = requests.post(
                url=url,
                data=json.dumps(payload),
                headers=headers,
                timeout=10  # 设置超时时间（秒）
            )
            
            # 检查响应状态
            if resp.status_code in (200, 201):
                print(f"响应成功发送到数据库后端")
                return True
            else:
                print(f"发送到数据库后端失败，状态码: {resp.status_code}")
                return False
        
        except Exception as e:
            print(f"发送响应时发生错误: {str(e)}")
            return False
    
    def process_file(self, file_path: str) -> str:
        """
        处理文件内容
        :param file_path: 文件路径
        :return: AI的回复
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                file_content = file.read()
            
            # 构建提示词，将文件内容作为用户输入
            user_input = f"请处理以下文本内容：\n\n{file_content}"
        
            # 使用现有的generate_response方法处理
            response = self.generate_response(user_input)
            return response
        except Exception as e:
            return f"处理文件时发生错误: {str(e)}"
        
    def load_documents(self, file_paths, chunk_size=1000, chunk_overlap=200):
        """
    加载并处理文档
    :param file_paths: 文件路径列表或单个文件路径
    :param chunk_size: 分块大小
    :param chunk_overlap: 分块重叠大小
    :return: 文本块数量
    """
        if not isinstance(file_paths, list):
            file_paths = [file_paths]
    
        # 定义可能的编码列表，按优先级排序
        encodings = ["utf-8", "gb2312", "gbk", "gb18030", "utf-16", "big5", "latin-1"]
    
        documents = []
        for file_path in file_paths:
            try:
                print(f"开始加载文档: {file_path}")
            
                if file_path.endswith('.txt'):
                    print(f"检测到txt文件，使用TextLoader...")
                
                # 尝试自动检测编码
                    detected_encoding = None
                    for encoding in encodings:
                        try:
                            with open(file_path, 'r', encoding=encoding) as f:
                                # 尝试读取一小部分来验证编码是否正确
                                f.read(1024)
                                detected_encoding = encoding
                                break
                        except UnicodeDecodeError:
                            continue
                
                    if detected_encoding:
                        print(f"检测到文件编码: {detected_encoding}")
                        loader = TextLoader(file_path, encoding=detected_encoding)
                    else:
                    # 如果所有编码都失败，尝试使用最宽容的latin-1编码
                        print("无法检测到正确的编码，使用latin-1编码")
                        loader = TextLoader(file_path, encoding="latin-1")
                    
                elif file_path.endswith('.pdf'):
                    print(f"检测到pdf文件，使用PyPDFLoader...")
                    loader = PyPDFLoader(file_path)
                
                elif os.path.isdir(file_path):
                    print(f"检测到目录，使用DirectoryLoader...")
                    # 处理整个目录，尝试使用多种编码
                    try:
                        # 首先尝试UTF-8
                        loader = DirectoryLoader(
                            file_path,
                            glob="**/*.txt",
                            loader_cls=TextLoader,
                            loader_kwargs={"encoding": "utf-8"}
                        )
                    # 测试加载
                        test_docs = loader.load()
                        print(f"成功使用UTF-8编码加载目录")
                    except Exception as e:
                        print(f"使用UTF-8加载失败，尝试GBK: {str(e)}")
                        try:
                            # 然后尝试GBK
                            loader = DirectoryLoader(
                                file_path,
                                glob="**/*.txt",
                                loader_cls=TextLoader,
                                loader_kwargs={"encoding": "gbk"}
                            )
                        # 测试加载
                            test_docs = loader.load()
                            print(f"成功使用GBK编码加载目录")
                        except Exception as e:
                            print(f"使用GBK加载失败，尝试GB18030: {str(e)}")
                            # 最后尝试GB18030
                            loader = DirectoryLoader(
                                file_path,
                                glob="**/*.txt",
                                loader_cls=TextLoader,
                                loader_kwargs={"encoding": "gb18030"}
                            )
                else:
                    print(f"不支持的文件类型: {file_path}, 支持的类型: .txt, .pdf, 或目录")
                    continue
            
                try:
                    print(f"正在读取文档内容...")
                    loaded_docs = loader.load()
                    print(f"文档内容读取成功，检查文档语言...")
                
                # 打印前几个文档的内容片段，检查语言
                    if loaded_docs:
                        sample = loaded_docs[0].page_content[:100] + "..."
                        print(f"文档示例：{sample}")
                
                    documents.extend(loaded_docs)
                    print(f"成功加载文档: {file_path}, 文档数: {len(loaded_docs)}")
                except Exception as e:
                    import traceback
                    print(f"读取文档内容失败: {str(e)}")
                    print(f"详细错误信息:\n{traceback.format_exc()}")
                
                # 如果指定编码失败，尝试使用别的编码
                    if file_path.endswith('.txt'):
                        for encoding in [enc for enc in encodings if enc != detected_encoding]:
                            try:
                                print(f"尝试使用 {encoding} 编码重新加载...")
                                loader = TextLoader(file_path, encoding=encoding)
                                loaded_docs = loader.load()
                                print(f"使用 {encoding} 编码加载成功！")

                                if loaded_docs:
                                    sample = loaded_docs[0].page_content[:100] + "..."
                                    print(f"文档示例：{sample}")
                            
                                documents.extend(loaded_docs)
                                print(f"成功加载文档: {file_path}, 文档数: {len(loaded_docs)}")
                                break
                            except Exception as e2:
                                print(f"使用 {encoding} 编码加载失败: {str(e2)}")
                                continue
                    
            except Exception as e:
                import traceback
                print(f"加载文档失败 {file_path}: {str(e)}")
                print(f"详细错误信息:\n{traceback.format_exc()}")
    
    # 分割文档
        if documents:
            try:
                print(f"开始分割文档，共 {len(documents)} 个文档，参数: chunk_size={chunk_size}, chunk_overlap={chunk_overlap}")
                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap,
                    length_function=len
                )
                self.documents = text_splitter.split_documents(documents)
                print(f"文档分割完成，共有 {len(self.documents)} 个文本块")
            
            # 打印几个文本块的示例
                if self.documents:
                    print(f"文本块示例:")
                    for i in range(min(2, len(self.documents))):
                        print(f"文本块 {i+1}:")
                        print(self.documents[i].page_content[:100] + "...")
            
                # 创建向量存储
                result = self._create_vector_store()
                if not result:
                    print("向量存储创建失败，文档加载过程中断")
                    return 0
            except Exception as e:
                import traceback
                print(f"分割文档过程失败: {str(e)}")
                print(f"详细错误信息:\n{traceback.format_exc()}")
                return 0
        else:
            print("没有成功加载任何文档，无法继续处理")
            return 0
    
        return len(self.documents)
    
    def _create_vector_store(self, embedding_model_path=None):
        """
        从文档创建向量存储
        
        参数:
            embedding_model_path: 嵌入模型的保存路径，如果提供，将保存嵌入模型到指定位置
        """
        if not self.documents:
            print("无法创建向量存储：缺少文档")
            return False
        
        try:
            print("开始创建向量存储...")
            print(f"使用 HuggingFaceEmbeddings 模型: paraphrase-multilingual-MiniLM-L12-v2")
            # 使用HuggingFaceEmbeddings简化嵌入过程
            embeddings = HuggingFaceEmbeddings(model_name="paraphrase-multilingual-MiniLM-L12-v2")
            
            # 如果没有提供保存路径，使用实例的默认路径
            if embedding_model_path is None:
                embedding_model_path = self.embedding_model_path
                
            # 保存嵌入模型信息
            try:
                # 记录当前使用的嵌入模型路径
                self.embedding_model_info = {
                    "model_name": "paraphrase-multilingual-MiniLM-L12-v2",
                    "saved_path": embedding_model_path
                }
                
                # 如果目录不存在，创建目录
                if not os.path.exists(embedding_model_path):
                    os.makedirs(embedding_model_path, exist_ok=True)
                    print(f"创建嵌入模型保存目录: {embedding_model_path}")
                
                # 保存嵌入模型的相关信息到文件中
                import json
                with open(os.path.join(embedding_model_path, "embedding_info.json"), "w") as f:
                    json.dump(self.embedding_model_info, f)
                
                print(f"嵌入模型信息已保存到: {embedding_model_path}")
            except Exception as e:
                print(f"保存嵌入模型信息时出错: {str(e)}")
            
            # 确保RAG目录存在
            rag_dir = "RAG"
            if not os.path.exists(rag_dir):
                os.makedirs(rag_dir, exist_ok=True)
                print(f"创建RAG向量存储目录: {rag_dir}")
            
            print("开始将文档转换为向量...")
            self.vector_store = FAISS.from_documents(
                self.documents, 
                embeddings
            )
            print("向量转换完成，创建检索器...")
            self.retriever = self.vector_store.as_retriever(
                search_kwargs={"k": 4}  # 默认检索4个最相关的文档
            )
            print("向量存储创建成功")
            print("检索器创建成功")
            
            # 自动保存向量存储
            self.save_vector_store()
            
            # 创建QA链
            print("开始创建QA链...")
            self._create_qa_chain()
            return True
        except Exception as e:
            import traceback
            print(f"创建向量存储失败: {str(e)}")
            print(f"详细错误信息:\n{traceback.format_exc()}")
            return False
    
    def save_vector_store(self, path="RAG", save_embedding_model=True):
        """
        保存向量数据库到本地
        
        参数:
            path: 保存路径
            save_embedding_model: 是否同时保存嵌入模型信息
        
        返回:
            操作结果信息
        """
        if self.vector_store is None:
            return "向量存储为空，无法保存"
        
        try:
            # 确保目录存在
            os.makedirs(path, exist_ok=True)
            
            # 保存向量存储
            self.vector_store.save_local(path)
            
            # 如果设置了保存嵌入模型且有嵌入模型信息
            if save_embedding_model and hasattr(self, 'embedding_model_info'):
                import json
                # 保存嵌入模型信息到向量存储目录
                embedding_info_path = os.path.join(path, "embedding_info.json")
                with open(embedding_info_path, "w") as f:
                    json.dump(self.embedding_model_info, f)
                return f"向量存储已保存到 {path}，嵌入模型信息已保存到 {embedding_info_path}"
            
            return f"向量存储已保存到 {path}"
        except Exception as e:
            return f"保存向量存储失败: {str(e)}"
    
    def load_vector_store(self, path="RAG", custom_embedding_model=None):
        """
        从本地加载向量数据库
        
        参数:
            path: 加载路径
            custom_embedding_model: 自定义的嵌入模型名称或路径，如果为None则尝试使用保存时的模型
        
        返回:
            操作结果信息
        """
        try:
            # 检查是否有嵌入模型信息文件
            embedding_info_path = os.path.join(path, "embedding_info.json")
            embedding_model_name = None
            
            if os.path.exists(embedding_info_path) and not custom_embedding_model:
                try:
                    import json
                    with open(embedding_info_path, "r") as f:
                        embedding_info = json.load(f)
                    embedding_model_name = embedding_info.get("model_name")
                    print(f"从保存的信息中加载嵌入模型: {embedding_model_name}")
                except Exception as e:
                    print(f"读取嵌入模型信息失败: {str(e)}")
            
            # 使用指定的嵌入模型或默认模型
            if custom_embedding_model:
                print(f"使用自定义嵌入模型: {custom_embedding_model}")
                embeddings = HuggingFaceEmbeddings(model_name=custom_embedding_model)
            elif embedding_model_name:
                print(f"使用保存时的嵌入模型: {embedding_model_name}")
                embeddings = HuggingFaceEmbeddings(model_name=embedding_model_name)
            else:
                print("未找到保存的嵌入模型信息，使用默认模型: paraphrase-multilingual-MiniLM-L12-v2")
                embeddings = HuggingFaceEmbeddings(model_name="paraphrase-multilingual-MiniLM-L12-v2")
            
            # 加载向量存储
            self.vector_store = FAISS.load_local(
                path, 
                embeddings,
                allow_dangerous_deserialization=True  # 添加这个参数以允许反序列化
            )
            self.retriever = self.vector_store.as_retriever(
                search_kwargs={"k": 4}
            )
            
            # 创建QA链
            self._create_qa_chain()
            
            return f"向量存储已从 {path} 加载"
        except Exception as e:
            import traceback
            error_msg = f"加载向量存储失败: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            return f"加载向量存储失败: {str(e)}"
    
    def save_embedding_model(self, path=None):
        """
        保存当前使用的嵌入模型信息到指定路径
        
        参数:
            path: 保存路径，如果为None则使用实例的默认路径
        
        返回:
            操作结果信息
        """
        try:
            # 如果没有提供路径，使用实例的默认路径
            if path is None:
                path = self.embedding_model_path
                
            # 确保目录存在
            os.makedirs(path, exist_ok=True)
            
            # 记录当前使用的嵌入模型信息
            embedding_info = {
                "model_name": "paraphrase-multilingual-MiniLM-L12-v2",  # 默认使用的模型
                "saved_path": path
            }
            
            # 保存信息到文件
            import json
            with open(os.path.join(path, "embedding_info.json"), "w") as f:
                json.dump(embedding_info, f)
            
            # 将信息保存到类属性中
            self.embedding_model_info = embedding_info
            
            return f"嵌入模型信息已保存到: {path}"
        except Exception as e:
            return f"保存嵌入模型信息失败: {str(e)}"
    
    def clear_history(self):
        """清除对话历史"""
        self.memory.clear()
        
    def _create_qa_chain(self):
        """创建问答链"""
        if self.retriever is None:
            print("无法创建QA链：缺少检索器")
            return
        try:
            print("开始创建QA链...")
        # 创建QA提示模板
            template = """使用以下检索到的上下文信息来回答最后的问题。如果你不知道答案，就说你不知道，不要试图编造答案。
            你是一个文本处理器，我会上传给你文本，你需要:
            1. 始终保持礼貌和专业的态度
            2. 给出清晰、准确的回答
            3. 在不确定的情况下诚实承认
            4. 避免有害或不当的内容
            5. 使用用户的语言进行回复
            6. 提取出文本关键词并对文本关键词做出解释
            7. 使用清晰明了的语言总结文本内容
            8. 对文本进行分块划分
            9. 仔细阅读文本内容，当我向你提问时，你可以迅速找到问题在文本中的具体位置
            10. 在我让你总结我上传的文章时，按照**关键词**：“ ”；
                    **关键词解释**：“ ”；
                    **文章摘要**：“ ”；
                    **文章大纲**：“ ”；
                    的格式回答
            11. 当我让你总结文章时，优先总结我最近上传的文章，而不是向量库中的文章
            12. 只有当我说“总结”的时候才按照我给出的格式回复，我没有说“总结”则按正常格式回复
         
            上下文信息:
            {context}
        
            问题: {question}
            """
            print("使用QA提示模板初始化...")
            qa_prompt = ChatPromptTemplate.from_template(template)
            print("创建RetrievalQA链...")
            # 创建QA链
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.retriever,
                chain_type_kwargs={"prompt": qa_prompt},
                return_source_documents=True
            )
            print("QA链创建成功")
        except Exception as e:
            import traceback
            print(f"创建QA链失败: {str(e)}")
            print(f"详细错误信息:\n{traceback.format_exc()}")

# 添加一个直接使用OpenAI客户端接口的方法
def direct_deepseek_call(api_key: str, user_input: str, 
                         model_name: str = "deepseek-chat", 
                         base_url: str = "https://api.deepseek.com",
                         system_prompt: str = "You are a helpful assistant"):
    """
    直接使用OpenAI客户端接口调用DeepSeek API
    
    :param api_key: DeepSeek API密钥
    :param user_input: 用户输入
    :param model_name: 模型名称
    :param base_url: DeepSeek API的基础URL
    :param system_prompt: 系统提示
    :return: 模型的响应
    """
    from openai import OpenAI
    
    client = OpenAI(api_key=api_key, base_url=base_url)
    
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input},
        ],
        stream=False
    )
    
    return response.choices[0].message.content

def main():
    """使用示例"""
    # 从环境变量获取API密钥或直接输入
    api_key = "sk-bc13804410a748ed89d38020edf77024"
    
    # 创建命令行参数解析器
    parser = argparse.ArgumentParser(description="LangChain聊天机器人")
    parser.add_argument("--model", help="使用的模型名称", default="deepseek-chat")
    parser.add_argument("--db_url", help="数据库后端URL", default=None)
    parser.add_argument("--db_token", help="数据库后端认证令牌", default=None)
    parser.add_argument("--async_db", help="使用异步数据库发送", action="store_true")
    parser.add_argument("--embedding_path", help="嵌入模型保存位置", default=r"F:\Files\比赛\花旗杯\AI chatbot\model")
    parser.add_argument("--custom_embedding", help="自定义嵌入模型名称", default=None)
    args = parser.parse_args()
    args.api_key = api_key
    
    # 基本初始化
    bot = LangChainChatBot(
        api_key=args.api_key,
        model_name=args.model,
        db_url=args.db_url,
        db_token=args.db_token,
        use_async_db=args.async_db,
        embedding_model_path=args.embedding_path
    )
    
    # 可以使用自定义配置
    custom_configs = {
        "llm_kwargs": {
            "temperature": 0.8,
            "max_tokens": 2048
        }
    }
    
    # 修改参数示例
    bot.update_pipeline_config(
        temperature=0.5,
        max_tokens=1500
    )
    
    # 修改现有的启动提示
    print("聊天机器人已启动！")
    print("输入 'quit' 退出")
    print("输入 'clear' 清除对话历史")
    print("输入 'direct' 使用直接调用")
    print("输入 'load' 加载文档到RAG系统")
    print("输入 'save' 保存向量存储")
    print("输入 'import' 导入已有向量存储")
    print("输入 'embedding save' 保存嵌入模型信息")
    print("输入 'embedding path' 设置嵌入模型保存路径")
    
    # 存储当前的嵌入模型路径
    embedding_model_path = args.embedding_path
    print(f"当前嵌入模型保存路径: {embedding_model_path}")
    
    if args.db_url:
        print(f"已连接到数据库后端: {args.db_url}")
        print("所有对话将自动保存到数据库")
    
    while True:
        user_input = input("\n你: ")
        
        if user_input.lower() == 'quit':
            print("再见！")
            break
        elif user_input.lower() == 'clear':
            bot.clear_history()
            print("对话历史已清除！")
            continue
        elif user_input.lower() == 'direct':
            direct_input = input("直接调用 - 输入问题: ")
            response = direct_deepseek_call(api_key, direct_input)
            print(f"\nAI (直接调用): {response}")
            continue
        elif user_input.lower() == 'load':
            file_path = input("请输入文件或目录路径: ")
            if os.path.exists(file_path):
                # 加载文档
                num_chunks = bot.load_documents(file_path)
                print(f"已加载 {num_chunks} 个文本块到RAG系统")
            else:
                print("文件路径无效！")
            continue
        elif user_input.lower() == 'save':
            # 使用默认相对路径 "RAG"
            path = "RAG"
            result = bot.save_vector_store(path, save_embedding_model=True)
            print(result)
            continue
        elif user_input.lower() == 'import':
            # 使用默认相对路径 "RAG"
            path = "RAG"
            if os.path.exists(path):
                result = bot.load_vector_store(path)
                print(result)
            else:
                print(f"路径'{path}'无效！")
            continue
        elif user_input.lower() == 'embedding save':
            # 使用指定的嵌入模型保存路径
            result = bot.save_embedding_model(embedding_model_path)
            print(result)
            continue
        elif user_input.lower() == 'embedding path':
            new_path = input(f"请输入新的嵌入模型保存路径(当前为{embedding_model_path}): ")
            if new_path:
                embedding_model_path = new_path
                bot.embedding_model_path = embedding_model_path
                print(f"嵌入模型保存路径已更新为: {embedding_model_path}")
            continue
            
        response = bot.generate_response(user_input)
        print(f"\nAI: {response}")

if __name__ == "__main__":
    main()
