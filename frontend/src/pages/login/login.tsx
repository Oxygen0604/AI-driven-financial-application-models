import { useState } from "react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store";
import { useUserStore } from "../../store";
import "./login.scss";
import background from "../../assets/background1.jpg";
import logo from "../../assets/logo.png";


type LoginInputs = {
  identifier: string;
  password: string;
};

type ErrorType = {
  message: string;
};

const Login: React.FC = () => {
  // 输入的用户信息
  const [inputs, setInputs] = useState<LoginInputs>({
    identifier: "",
    password: "",
  });

  // 错误信息
  const [error, setError] = useState<ErrorType | null>(null);

  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { fetchUserProfile, getTheme } = useUserStore();

  // 设置用户信息
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(inputs.identifier, inputs.password); // 调用 login 方法
      await fetchUserProfile(); // 调用 fetchUserProfile 方法，设置 currentUser
      await getTheme(); // 调用 getTheme 方法，设置 userTheme
      navigate("/user/market");
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data);
      } else {
        setError({ message: "登录错误" });
      }
    }
  };

  return (
    <div className="login-container">
      <img className="login-background" src={background} alt="background"></img>
      <div className="login-box">
        <img className="login-logo" src={logo} alt="logo"></img>
        <div className="login-title">登录</div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-item">
            <label htmlFor="identifier">用户名或邮箱:</label>
            <input
              required
              type="text"
              name="identifier"
              id="identifier"
              value={inputs.identifier}
              onChange={handleChange}
            />
          </div>
          <div className="form-item">
            <label htmlFor="password">密码:</label>
            <input
              required
              type="password"
              name="password"
              id="password"
              value={inputs.password}
              onChange={handleChange}
            />
          </div>
          <button type="submit">登录</button>
          {error && <div>{error.message}</div>}
          <div className="register-forget">
            <Link className="link" to="/register">
              立即注册！
            </Link>
            <Link className="link" to="/forget">
              忘记密码?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
