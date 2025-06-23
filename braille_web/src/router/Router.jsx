import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "@pages/LoginSystem/LoginPage";
import SignupPage from "@pages/LoginSystem/SignupPage";
import AboutPage from "@pages/AboutPage"
import GalleryPage from "@pages/GalleryPage"
import MainPage from "@pages/MainPage";
import LearningPage from "@pages/LearnSystem/LearningPage";
import QuizPage from "@pages/LearnSystem/QuizPage";
import ImageToBraillePage from "@pages/ImageToBaillePage";
import MyPage from "@pages/My/MyPage";
import MyLearningStagePage from "@pages/My/MyLearningStagePage"
import GameHistoryPage from "@pages/My/GameHistoryPage";
import GameRankingPage from "@pages/My/GameRankingPage";
import MainLayout from "@layouts/MainLayout"
import TopBanner from "@components/TopBanner";

export default function Router() 
{
    const appRef = useRef(null);
    
    return(
        <BrowserRouter>
            <TopBanner targetRef = {appRef}/>
            <Routes>
                <Route element={<MainLayout appRef = {appRef} />}>
                    {/* Auth */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    {/* Home / About */}
                    <Route index element={<MainPage />} />
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
                </Route>
            </Routes>
        </BrowserRouter>
    );
}