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
                    <li className={getActiveLink("/analyse")}>
                        <Link to="/analyse">
                            <div className="text">Analyse</div>
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
                    <li className={getActiveLink("/user")}>
                        <Link to="/user">
                            <div className="text">ME</div>
                        </Link>
                    </li>
                </ul>
            </div>
            <section id="home">Home</section>
            <section id="analyse">Analyse</section>
            <section id="documentProcess">Document Process</section>
            <section id="question">Qusetion</section>
            <section id="user">ME</section>
        </div>
    );
};

export default Shell;
