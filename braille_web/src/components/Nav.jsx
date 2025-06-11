import { NavLink } from "react-router-dom";

import "./Nav.css"

export default function Nav()
{
    return(
        <nav className="main-nav">
            <ul>
                <li><NavLink to="/" end>홈</NavLink></li>
                <li><NavLink to="/about">소개</NavLink></li>
                <li><NavLink to="/learn">학습</NavLink></li>
                <li><NavLink to="/quiz">퀴즈</NavLink></li>
                <li><NavLink to="/image-to-braille">이미지 변환</NavLink></li>
                <li><NavLink to="/gallery">갤러리</NavLink></li>
                <li><NavLink to="/my">마이페이지</NavLink></li>
            </ul>
        </nav>
    );
}