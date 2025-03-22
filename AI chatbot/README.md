
# LangChainChatBot 说明文档

## 简介

LangChainChatBot 是一个基于 LangChain 和 DeepSeek API 开发的聊天机器人，支持自然语言处理、文本生成、知识检索和问答功能。它能够与用户进行对话，并根据上下文生成智能回复，支持RAG（Retrieval-Augmented Generation）功能，能够加载和检索文档内容来生成更准确的回答。

该项目利用了 LangChain 库的对话链和记忆功能，结合 DeepSeek API 来实现先进的语言模型和嵌入生成。

## 功能概述

- **对话功能**：与用户进行对话，生成自然语言回复。
- **记忆管理**：支持对话历史的管理（可以选择使用 `ConversationBufferMemory` 或 `ConversationSummaryMemory`）。
- **文本处理**：加载和处理多种格式的文档（如 `.txt`、`.pdf` 等），并将其分割为文本块以进行进一步处理。
- **知识检索**：支持通过向量存储（FAISS）来执行文档检索，并在生成回答时结合相关文档信息。
- **嵌入模型**：支持使用 HuggingFace 提供的预训练模型（如 `paraphrase-multilingual-MiniLM-L12-v2`）生成文本嵌入。
- **向量存储**：支持文档的向量化，并将向量存储在本地，可以进行向量检索。
- **灵活配置**：允许自定义对话模型、记忆类型、提示模板等。

## 安装依赖

本项目使用以下 Python 库：

- `langchain`：用于链式调用和内存管理
- `requests`：用于与外部数据库接口交互
- `torch` 和 `transformers`：用于加载和使用深度学习模型
- `faiss`：用于向量检索
- `openai`：与 OpenAI API 交互
- `langchain_community`：社区提供的文档加载器和向量存储工具

安装依赖：

```bash
pip install langchain requests torch transformers faiss-cpu openai langchain_community
```

## 项目结构

```
LangChainChatBot/
│
├── main.py              # 主程序文件，启动聊天机器人
├── README.md            # 项目说明文档
├── model/                # 存放嵌入模型的路径
├── RAG/                  # 存储向量存储和QA链的文件夹
└── embeddings/           # 存储嵌入模型信息的文件夹
```

## 配置

在使用之前，您需要配置以下内容：

- **API 密钥**：为 DeepSeek API 设置您的 `api_key`。
- **模型名称**：可选择自定义 DeepSeek 模型，默认为 `deepseek-chat`。
- **数据库配置**：如果您希望将对话保存到数据库中，可以提供数据库的 URL 和 Token。
- **嵌入模型路径**：设置嵌入模型保存位置，默认路径为 `./model`。

在 `main.py` 文件中，您可以通过命令行参数或修改代码来自定义这些配置。

## 使用方法

### 启动聊天机器人

通过命令行启动聊天机器人：

```bash
python main.py
```

此时，您可以与机器人进行对话。

### 主要命令

1. **退出聊天**：输入 `quit`。
2. **清除历史**：输入 `clear`，清除对话历史。
3. **直接调用**：输入 `direct`，直接调用 DeepSeek API。
4. **加载文档**：输入 `load`，加载文件或目录，支持 `.txt` 和 `.pdf` 格式。
5. **保存向量存储**：输入 `save`，保存当前的向量存储到本地。
6. **导入向量存储**：输入 `import`，从本地加载已保存的向量存储。
7. **保存嵌入模型信息**：输入 `embedding save`，保存当前嵌入模型的配置信息。
8. **设置嵌入模型保存路径**：输入 `embedding path`，设置新的嵌入模型保存路径。

### 示例

```bash
你: 你好，机器人！
AI: 你好！有什么我可以帮忙的吗？
```

## 自定义

### 更新模型配置

您可以通过 `update_model_config` 方法更新模型配置，修改如 `temperature`、`max_tokens` 等参数。

```python
bot.update_model_config({
    "llm_kwargs": {
        "temperature": 0.8,
        "max_tokens": 1500
    }
})
```

### 设置记忆类型

可以选择 `buffer` 或 `summary` 作为记忆类型，`buffer` 会保留完整的对话历史，而 `summary` 会只保留简短的摘要。

```python
bot.set_memory_type("summary")
```

### 自定义提示模板

可以根据需求自定义提示模板，修改默认的聊天助手提示。

```python
bot.customize_prompt(new_template="新的提示模板")
```

## 注意事项

- 确保在使用向量存储和嵌入模型时，有足够的存储空间。
- 对于大型文档集，加载和分割文档可能需要一定的时间。
- 使用 RAG 功能时，确保已经成功加载文档并创建了向量存储。

## 联系方式

如果您有任何问题或建议，欢迎通过 GitHub 提交 Issues 或联系项目作者。

## 函数说明

### 1. `__init__(self, api_key: str, model_name: str = "deepseek-reasoner", model_configs: Optional[Dict[str, Any]] = None, memory_type: str = "buffer", base_url: str = "https://api.deepseek.com", db_url: Optional[str] = None, db_token: Optional[str] = None, use_async_db: bool = False, embedding_model_path: str = r"model")`
- **说明**：初始化 `LangChainChatBot` 类，设置 DeepSeek API 的相关参数，初始化对话模型、提示模板、记忆、向量存储等。
- **参数**：
  - `api_key`: DeepSeek API 密钥
  - `model_name`: 模型名称，默认 `deepseek-reasoner`
  - `model_configs`: 模型配置字典，包含 LLM 相关的配置
  - `memory_type`: 记忆类型，`buffer` 或 `summary`
  - `base_url`: DeepSeek API 的基础 URL
  - `db_url`: 数据库 URL，用于保存对话
  - `db_token`: 数据库认证令牌
  - `use_async_db`: 是否使用异步数据库
  - `embedding_model_path`: 嵌入模型保存路径

### 2. `_initialize_embeddings(self, model_path="paraphrase-multilingual-MiniLM-L12-v2")`
- **说明**：初始化嵌入模型，加载 HuggingFace 提供的预训练嵌入模型。
- **参数**：
  - `model_path`: 使用的嵌入模型路径，默认为 `paraphrase-multilingual-MiniLM-L12-v2`
  
### 3. `_initialize_llm(self)`
- **说明**：初始化 DeepSeek LLM，设置默认参数并连接到 OpenAI API。

### 4. `_initialize_prompt(self)`
- **说明**：初始化对话的提示模板。
  
### 5. `_initialize_memory(self, memory_type: str)`
- **说明**：初始化对话记忆，可以选择 `ConversationBufferMemory` 或 `ConversationSummaryMemory`。
- **参数**：
  - `memory_type`: 记忆类型，`buffer` 或 `summary`
  
### 6. `_initialize_conversation_chain(self)`
- **说明**：初始化对话链，基于 LLM、记忆和提示模板创建对话。
  
### 7. `generate_embeddings(self, texts)`
- **说明**：生成文本的嵌入向量。
- **参数**：
  - `texts`: 输入文本列表
- **返回**：文本的嵌入向量
  
### 8. `update_model_config(self, config_updates: Dict[str, Any])`
- **说明**：更新模型配置。
- **参数**：
  - `config_updates`: 包含更新的配置字典
  
### 9. `update_pipeline_config(self, temperature: Optional[float] = None, max_tokens: Optional[int] = None, top_p: Optional[float] = None, presence_penalty: Optional[float] = None)`
- **说明**：更新管道配置，如温度、最大 tokens 等参数。
- **参数**：
  - `temperature`: 温度参数
  - `max_tokens`: 最大 token 数
  - `top_p`: top-p 采样参数
  - `presence_penalty`: 重复惩罚参数
  
### 10. `set_memory_type(self, memory_type: str)`
- **说明**：设置记忆类型，可以选择 `buffer` 或 `summary`。
- **参数**：
  - `memory_type`: 记忆类型，`buffer` 或 `summary`
  
### 11. `customize_prompt(self, new_template: str)`
- **说明**：自定义对话的提示模板。
- **参数**：
  - `new_template`: 新的提示模板

### 12. `generate_response(self, user_input: str) -> str`
- **说明**：生成对话回复。
- **参数**：
  - `user_input`: 用户输入的文本
- **返回**：生成的回复

### 13. `_send_to_database(self, response: str, user_input: str, metadata: Optional[Dict[str, Any]] = None) -> bool`
- **说明**：将 AI 回复发送到数据库后端。
- **参数**：
  - `response`: AI 生成的回复
  - `user_input`: 用户输入
  - `metadata`: 附加的元数据（可选）
- **返回**：是否成功发送到数据库

### 14. `process_file(self, file_path: str) -> str`
- **说明**：处理文件内容，读取文件并生成相应的 AI 回复。
- **参数**：
  - `file_path`: 文件路径
- **返回**：生成的回复

### 15. `load_documents(self, file_paths, chunk_size=1000, chunk_overlap=200)`
- **说明**：加载并处理文档，支持 `.txt`、`.pdf` 格式的文件。
- **参数**：
  - `file_paths`: 文件路径列表或单个文件路径
  - `chunk_size`: 分块大小
  - `chunk_overlap`: 分块重叠大小
- **返回**：加载并处理的文本块数量

### 16. `_create_vector_store(self, embedding_model_path=None)`
- **说明**：从加载的文档中创建向量存储。
- **参数**：
  - `embedding_model_path`: 嵌入模型的保存路径
  
### 17. `save_vector_store(self, path="RAG", save_embedding_model=True)`
- **说明**：将向量存储保存到本地。
- **参数**：
  - `path`: 保存路径
  - `save_embedding_model`: 是否保存嵌入模型信息
  
### 18. `load_vector_store(self, path="RAG", custom_embedding_model=None)`
- **说明**：从本地加载向量存储。
- **参数**：
  - `path`: 加载路径
  - `custom_embedding_model`: 自定义的嵌入模型路径
  
### 19. `save_embedding_model(self, path=None)`
- **说明**：保存当前使用的嵌入模型信息到指定路径。
- **参数**：
  - `path`: 保存路径
  
### 20. `clear_history(self)`
- **说明**：清除对话历史。

### 21. `_create_qa_chain(self)`
- **说明**：创建问答链，结合检索器生成问答。

### 22. `direct_deepseek_call(api_key: str, user_input: str, model_name: str = "deepseek-chat", base_url: str = "https://api.deepseek.com", system_prompt: str = "You are a helpful assistant")`
- **说明**：直接调用 DeepSeek API 获取回复。
- **参数**：
  - `api_key`: DeepSeek API 密钥
  - `user_input`: 用户输入的文本
  - `model_name`: 使用的模型名称
  - `base_url`: DeepSeek API 基础 URL
  - `system_prompt`: 系统提示
  
### 23. `main()`
- **说明**：启动聊天机器人，提供命令行交互界面，支持多种功能操作。
