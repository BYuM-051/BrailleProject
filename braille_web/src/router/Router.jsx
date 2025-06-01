import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginSystem/LoginPage";
import SignupPage from "../pages/LoginSystem/SignupPage";
import MainPage from "./MainPage";
import AboutPage from "../pages/AboutPage"

import GalleryPage from "../pages/GalleryPage"

export default function Router() {
    return(
        <BrowserRouter>
            <Routes>
                {/* Auth */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Home / About */}
                <Route path="/" element={<MainPage />} />
                <Route path="/about" element={<AboutPage />} />

                {/* Main Features */}
                <Route path="/learn" element={<LearningPage />} />
                <Route path="/quiz" element={<QuizPage />} />
                <Route path="/image-to-braille" element={<ImageToBraillePage />} />

                {/* Gallery */}
                <Route path="/gallery" element={<GalleryPage />} />

                {/* My Pages */}
                <Route path="/my" element={<MyPage />}>
                    <Route path="stage" element={<MyLearningStagePage />} />
                    <Route path="history" element={<GameHistoryPage />} />
                    <Route path="ranking" element={<GameRankingPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}