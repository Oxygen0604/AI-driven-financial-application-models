import React from 'react';
import "./question.scss";
import Shell from '../../component/shell/shell';
import ChatBox from '../../component/chatBox/chatBox';
import { useState } from 'react';
import axios from 'axios';

const Question = () => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/uploadQues/upload-question', { text });
      alert('提交成功！');
      setText(''); // 清空输入框
    } catch (error) {
      alert('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="question">
      <div className='shell'>
        <Shell />
      </div>

      <div className='container'>
        <div className='header'></div>

        <div className='content'>
          <ChatBox 
            type={false} 
            value='111...（长文本）' 
          />
          <ChatBox 
            type={true} 
            value='111...（短文本）' 
          />
        </div>

        <div className='footer'>
          <form onSubmit={handleSubmit}>
            <textarea 
              className='input'
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSubmitting}
            />
            <button 
              className='send' 
              type="submit" // 明确指定按钮类型
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '提交'}
            </button>
          </form>

          <div className='decoration'>
            AI-DRIVEN FINANTIAL APPLICATION<br/>
            ANALYSE HELPER
          </div>
        </div>
      </div>
    </div>
  );
}

export default Question;