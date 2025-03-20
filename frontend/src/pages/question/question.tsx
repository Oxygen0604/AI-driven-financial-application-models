import React from'react';
import { useState, useEffect,useRef } from "react";
import "./question.scss";
import Shell from '../../component/shell/shell';
import ChatBox from '../../component/chatBox/chatBox';

interface chatBoxProps {
  type: boolean; // 类型
  value: string; // 文本内容
}

const Question = () => {
  const [items, setItems] = useState<chatBoxProps[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleOnClick = () => {
    if (inputValue.trim() === "") {
      alert("请输入问题");
      return;
    }
    setItems([...items, {type: false, value: inputValue}]);
    textareaRef.current!.value = "";
  };

  const handleOnChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  }


  return (
    <div className="question">
      <div className='shell'>
        <Shell />
      </div>

      <div className='container'>
        <div className='header'>

        </div>

        <div className='content'>
          {
            items.map((item, index) => (
              <div key={index}>
                <ChatBox type={item.type} value={item.value} />
              </div>
            ))
          }
          <ChatBox type={false} value='11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111'/>
          <ChatBox type={true} value='1111111111111111111111111111111111111111111111111111111'/>

        </div>

        <div className='footer'>
          <div className='input'>
            <textarea placeholder='请输入你的问题' ref={textareaRef} onChange={(e)=>(handleOnChange(e))}/>
          </div>

          <div className='decoration'>
            AI-DRIVEN FINANTIAL APPLICATION<br/>
            ANALYSE HELPER
          </div>

          <div className='send' onClick={handleOnClick}>
            发送
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default Question;