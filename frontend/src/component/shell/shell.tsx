import React from 'react';
import './shell.scss';
import { Link, useLocation } from 'react-router-dom';

const Shell: React.FC = () => {
    const location = useLocation(); // 获取当前的路径

    // 根据路径来设置当前激活的链接
    const getActiveLink = (path: string) => {
        return location.pathname === path ? "active" : "";
    };

    return (
        <div>
            <div className="shell">
                <ul className="nav">
                    <li className={getActiveLink("/")} id="logo">
                        <div className="text">Unicorn_</div>
                    </li>
                    <li className={getActiveLink("/home")}>
                        <Link to="/home">
                            <div className="text">Home</div>
                        </Link>
                    </li>
                    <li className={getActiveLink("/detection")}>
                        <Link to="/detection">
                            <div className="text">Detection</div>
                        </Link>
                    </li>
                    <li className={getActiveLink("/documentProcess")}>
                        <Link to="/documentProcess">
                            <div className="text">Document Process</div>
                        </Link>
                    </li>
                    <li className={getActiveLink("/question")}>
                        <Link to="/question">
                            <div className="text">Qusetion</div>
                        </Link>
                    </li>
                    <li className={getActiveLink("/code")}>
                        <Link to="/code">
                            <div className="text">QR code</div>
                        </Link>
                    </li>
                    <li className={getActiveLink("/authentication")}>
                        <Link to="/authentication">
                            <div className="text">authentication</div>
                        </Link>
                    </li>
                    <li className={getActiveLink("/me")}>
                        <Link to="/me">
                            <div className="text">ME</div>
                        </Link>
                    </li>
                </ul>
            </div>
            <section id="home">Home</section>
            <section id="theme">theme</section>
            <section id="wallet">wallet</section>
            <section id="picture">picture</section>
            <section id="code">QR code</section>
            <section id="authentication">authentication</section>
            <section id="me">ME</section>
        </div>
    );
};

export default Shell;
