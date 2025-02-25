from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain.prompts import PromptTemplate
from pydantic import BaseModel
from langchain_openai import ChatOpenAI  # Changed to use OpenAI interface
from typing import Optional, Dict, Any

class MyModel(BaseModel):
    class Config:
        arbitrary_types_allowed = True
        
class LangChainChatBot:
    def __init__(self, 
                 api_key: str,
                 model_name: str = "deepseek-reasoner",  # Updated default model
                 model_configs: Optional[Dict[str, Any]] = None,
                 memory_type: str = "buffer",
                 base_url: str = "https://api.deepseek.com"):  # Added base_url parameter
        """
        初始化基于LangChain的聊天机器人
         api_key: Deepseek API密钥
         model_name: Deepseek模型名称
         model_configs: 模型配置参数
         memory_type: 记忆类型 ("buffer" 或 "summary")
         base_url: DeepSeek API的基础URL
        """
        # 初始化基本属性
        self.api_key = api_key
        self.model_name = model_name
        self.model_configs = model_configs or {}
        self.base_url = base_url
        
        # 初始化各组件
        self._initialize_llm()
        self._initialize_prompt()
        self._initialize_memory(memory_type)
        self._initialize_conversation_chain()
        
        print(f"Using Deepseek API with model: {self.model_name}")
        
    def _initialize_llm(self):
        """初始化使用OpenAI客户端接口的DeepSeek LLM"""
        # 设置默认参数
        llm_kwargs = {
            "max_tokens": 1024,
            "temperature": 0.7,
            "top_p": 0.95,
            # repetition_penalty is not directly supported in the OpenAI interface
            # but can be mapped to presence_penalty or frequency_penalty
            "presence_penalty": 0.1,  # Similar to repetition_penalty
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
                return_messages=True
            )
        else:  # default to buffer
            self.memory = ConversationBufferMemory(
                return_messages=True
            )
            
    def _initialize_conversation_chain(self):
        """初始化对话链"""
        self.conversation = ConversationChain(
            llm=self.llm,
            memory=self.memory,
            prompt=self.prompt,
            verbose=False
        )
    
    def update_model_config(self, config_updates: Dict[str, Any]):
        """
        更新模型配置
        :param config_updates: 要更新的配置参数
        """
        self.model_configs.update(config_updates)
        self._initialize_llm()  # Changed from _initialize_model
        self._initialize_conversation_chain()
    
    def update_pipeline_config(self, 
                             temperature: Optional[float] = None,
                             max_tokens: Optional[int] = None,  # Changed from max_new_tokens
                             top_p: Optional[float] = None,
                             presence_penalty: Optional[float] = None):  # Changed from repetition_penalty
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
            response = self.conversation.predict(input=user_input)
            return response.strip()
        except Exception as e:
            return f"发生错误: {str(e)}"
    
    def clear_history(self):
        """清除对话历史"""
        self.memory.clear()
        
        
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
        stream=True
    )
    
    return response.choices[0].message.content

def main():
    """使用示例"""
    import os
    
    # 从环境变量获取API密钥或直接输入
    api_key = "sk-bc13804410a748ed89d38020edf77024"
    
    # 基本初始化
    bot = LangChainChatBot(api_key=api_key)
    
    # 或者使用自定义配置初始化
    custom_configs = {
        "llm_kwargs": {
            "temperature": 0.8,
            "max_tokens": 2048
        }
    }
    
    bot = LangChainChatBot(
        api_key=api_key,
        model_name="deepseek-chat",
        model_configs=custom_configs,
        memory_type="summary"
    )
    
    # 修改参数示例
    bot.update_pipeline_config(
        temperature=0.9,
        max_tokens=1500
    )
    
    # 修改提示词模板示例
    new_template = """你是一个文本处理器，我会上传给你文本，你需要:
        1. 始终保持礼貌和专业的态度
        2. 给出清晰、准确的回答
        3. 在不确定的情况下诚实承认
        4. 避免有害或不当的内容
        5. 使用用户的语言进行回复
        6. 提取出文本关键词并对文本关键词做出解释
        7. 使用清晰明了的语言总结文本内容
        8. 对文本进行分块划分
        9. 仔细阅读文本内容，当我向你提问时，你可以迅速找到问题在文本中的具体位置
        
    历史对话：
    {history}
    
    Human: {input}
    Assistant:"""
    bot.customize_prompt(new_template)
    
    # 切换记忆类型示例
    bot.set_memory_type("summary")
    
    print("聊天机器人已启动！输入 'quit' 退出，输入 'clear' 清除对话历史，输入 'direct' 使用直接调用。")
    
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
            
        response = bot.generate_response(user_input)
        print(f"\nAI: {response}")

if __name__ == "__main__":
    main()