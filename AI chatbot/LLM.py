from langchain.llms import HuggingFacePipeline
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain.prompts import PromptTemplate
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
from typing import Optional, Dict, Any

class LangChainChatBot:
    def __init__(self, 
                 model_name: str = "THUDM/chatglm3-6b",
                 model_configs: Optional[Dict[str, Any]] = None,
                 memory_type: str = "buffer"):
        """
        初始化基于LangChain的聊天机器人
         model_name: Hugging Face模型名称
         model_configs: 模型配置参数
         memory_type: 记忆类型 ("buffer" 或 "summary")
        """
        # 初始化基本属性
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_configs = model_configs or {}
        
        # 初始化各组件
        self._initialize_model()
        self._initialize_pipeline()
        self._initialize_prompt()
        self._initialize_memory(memory_type)
        self._initialize_conversation_chain()
        
        print(f"Using device: {self.device}")
        
    def _initialize_model(self):
        """初始化模型和分词器"""
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_name, 
            trust_remote_code=True
        )
        
        model_kwargs = {
            "trust_remote_code": True,
            "torch_dtype": torch.float16 if self.device == "cuda" else torch.float32,
            **self.model_configs.get("model_kwargs", {})
        }
        
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            **model_kwargs
        ).to(self.device)
        
    def _initialize_pipeline(self):
        """初始化HuggingFace pipeline"""
        pipeline_kwargs = {
            "max_new_tokens": 1024,
            "temperature": 0.7,
            "top_p": 0.95,
            "repetition_penalty": 1.1,
            "device": 0 if self.device == "cuda" else -1,
            **self.model_configs.get("pipeline_kwargs", {})
        }
        
        self.pipe = pipeline(
            "text-generation",
            model=self.model,
            tokenizer=self.tokenizer,
            **pipeline_kwargs
        )
        
        self.llm = HuggingFacePipeline(pipeline=self.pipe)
    
    def _initialize_prompt(self):
        """初始化提示词模板"""
        self.default_template = """
        你是一个专业、友好的AI助手。你需要:
        1. 始终保持礼貌和专业的态度
        2. 给出清晰、准确的回答
        3. 在不确定的情况下诚实承认
        4. 避免有害或不当的内容
        5. 使用用户的语言进行回复
        
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
        self._initialize_model()
        self._initialize_pipeline()
        self._initialize_conversation_chain()
    
    def update_pipeline_config(self, 
                             temperature: Optional[float] = None,
                             max_new_tokens: Optional[int] = None,
                             top_p: Optional[float] = None,
                             repetition_penalty: Optional[float] = None):
        """
        更新pipeline配置
        :param temperature: 温度参数
        :param max_new_tokens: 最大生成token数
        :param top_p: top-p采样参数
        :param repetition_penalty: 重复惩罚参数
        """
        pipeline_kwargs = self.model_configs.get("pipeline_kwargs", {})
        
        if temperature is not None:
            pipeline_kwargs["temperature"] = temperature
        if max_new_tokens is not None:
            pipeline_kwargs["max_new_tokens"] = max_new_tokens
        if top_p is not None:
            pipeline_kwargs["top_p"] = top_p
        if repetition_penalty is not None:
            pipeline_kwargs["repetition_penalty"] = repetition_penalty
            
        self.model_configs["pipeline_kwargs"] = pipeline_kwargs
        self._initialize_pipeline()
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
        
        

def main():
    """使用示例"""
    # 基本初始化
    bot = LangChainChatBot()
    
    # 或者使用自定义配置初始化
    custom_configs = {
        "model_kwargs": {
            "device_map": "auto",
            "load_in_8bit": True
        },
        "pipeline_kwargs": {
            "temperature": 0.8,
            "max_new_tokens": 2048
        }
    }
    
    bot = LangChainChatBot(
        model_name="THUDM/chatglm3-6b",
        model_configs=custom_configs,
        memory_type="summary"
    )
    
    # 修改pipeline参数示例
    bot.update_pipeline_config(
        temperature=0.9,
        max_new_tokens=1500
    )
    
    # 修改提示词模板示例
    new_template = """你现在是一个专业的助手。
    历史对话：
    {history}
    
    Human: {input}
    Assistant:"""
    bot.customize_prompt(new_template)
    
    # 切换记忆类型示例
    bot.set_memory_type("summary")
    
    print("聊天机器人已启动！输入 'quit' 退出，输入 'clear' 清除对话历史。")
    
    while True:
        user_input = input("\n你: ")
        
        if user_input.lower() == 'quit':
            print("再见！")
            break
        elif user_input.lower() == 'clear':
            bot.clear_history()
            print("对话历史已清除！")
            continue
            
        response = bot.generate_response(user_input)
        print(f"\nAI: {response}")

if __name__ == "__main__":
    main()