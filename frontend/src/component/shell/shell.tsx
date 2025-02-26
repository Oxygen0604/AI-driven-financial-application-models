import React from'react';
import './shell.scss';
import { Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

const Shell: React.FC = () => {
    const nav = document.querySelectorAll(".nav li");
    const activeLink=(e: React.MouseEvent)=> {
        nav.forEach((item) => item.classList.remove("active"));
        e.currentTarget.classList.add("active");
    }

    return (
        <div>
            <div className="shell">
                <ul className="nav">
                    <li className="active" id="logo">
                        <Link to="#">
                            <div className="icon">
                                <div className="imageBox">
                                    <img src="./goat.jpg" alt="" />
                                </div>
                            </div>
                            <div className="text">Unicorn_</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/home">
                            <div className="icon">
                                <i className="iconfont icon-cangku"></i>
                            </div>
                            <div className="text">Home</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/detection">
                            <div className="icon">
                                <i className="iconfont icon-zhuti_tiaosepan"></i>
                            </div>
                            <div className="text">Detection</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/documentProcess">
                            <div className="icon">
                                <i className="iconfont icon-qianbao"></i>
                            </div>
                            <div className="text">Document Process</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/question">
                            <div className="icon">
                                <i className="iconfont icon-tupian"></i>
                            </div>
                            <div className="text">Qusetion</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/code">
                            <div className="icon">
                                <i className="iconfont icon-erweima"></i>
                            </div>
                            <div className="text">QR code</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/authentication">
                            <div className="icon">
                                <i className="iconfont icon-dunpaibaoxianrenzheng"></i>
                            </div>
                            <div className="text">authentication</div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/me">
                            <div className="icon">
                                <div className="imageBox">
                                    <img src="./goat.jpg" alt="" />
                                </div>
                            </div>
                            <div className="text">ME</div>
                        </Link>
                    </li>
                </ul>
            </div>
            {/* <section id="home">Home</section>
            <section id="theme">theme</section>
            <section id="wallet">wallet</section>
            <section id="picture">picture</section>
            <section id="code">QR code</section>
            <section id="authentication">authentication</section>
            <section id="me">ME</section> */}
        </div>
    );
};

export default Shell;