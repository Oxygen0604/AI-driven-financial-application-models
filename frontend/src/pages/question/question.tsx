import React from'react';
import "./question.scss";
import Shell from '../../component/shell/shell';
import ChatBox from '../../component/chatBox/chatBox';

const Question = () => {


  return (
    <div className="question">
      <div className='shell'>
        <Shell />
      </div>

      <div className='container'>
        <div className='header'>

        </div>

        <div className='content'>
          <ChatBox type={false} value='11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111'/>
          <ChatBox type={true} value='1111111111111111111111111111111111111111111111111111111'/>
        </div>

        <div className='footer'>
          <div className='input'>
            <textarea placeholder='请输入你的问题'/>
          </div>

          <div className='decoration'>
            AI-DRIVEN FINANTIAL APPLICATION<br/>
            ANALYSE HELPER
          </div>

          <div className='send'>
            发送
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default Question;