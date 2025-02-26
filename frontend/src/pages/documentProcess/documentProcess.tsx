import React from'react';
import "./documentProcess.scss";
import Shell from '../../component/shell/shell';
import { useEffect, useState,useReducer,useRef } from 'react';

const DocumentProcess = () => {
  const [file, setFile] = useState<File>();


  const FileOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files){
      setFile(e.target.files[0]);
    }
  };
  return (
    <div className="document-process">

      <div className='shell'>
        <Shell />
      </div>

      <div className='header'>

      </div>

      <div className='content'>
        <div className='input-container'>
          上传文件
          <input type="file" placeholder='上传文件' onChange={(e) => FileOnchange(e) }/>
        </div>
      </div>

      <div className='footer'>

      </div>
    </div>
    );
}

export default DocumentProcess;