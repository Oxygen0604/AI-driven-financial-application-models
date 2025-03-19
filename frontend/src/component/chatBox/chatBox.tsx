import React, { useEffect, useRef, useState } from 'react';
import './chatBox.scss';

interface chatBoxProps {
  type: boolean; // 类型
  value: string; // 外部传入的文本内容
}

const ChatBox: React.FC<chatBoxProps> = ({ type,value}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整textarea高度
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // 重置高度
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // 设置为内容的实际高度
    }
  };

  useEffect(() => {
    adjustHeight(); // 在组件加载或文本变化时调整高度
  }, [value]); // 当外部传入的文本值发生变化时重新调整高度

  return (
    <div className={`chat-box ${type ? 'type-true' : 'type-false'}`}>
      <textarea 
        readOnly={true}
        ref={textareaRef}
        value={value}/>
    </div>
  );
};

export default ChatBox;
