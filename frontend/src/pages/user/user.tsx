import React from'react';
import "./user.scss";
import Shell from '../../component/shell/shell';
import { useAuthStore,useUserStore } from '../../store';

const User = () => {
  const logout = useAuthStore(state => state.logout);
  const currentUser = useUserStore(state => state.currentUser);


  const handleOnClick = () => {
    logout();
    window.location.href = '/';
  }
  return (
    <div className="user">
      <div className='shell'>
        <Shell />
      </div>

      <div className='user-content'>
        <div className='user-header'>
          Welcome! {currentUser?.nickname}
        </div>

        <div className='user-body'>
          <button onClick={handleOnClick}>登出</button>
        </div>

        <div className='user-footer'>

        </div>
      </div>
    </div>
    );
}

export default User;