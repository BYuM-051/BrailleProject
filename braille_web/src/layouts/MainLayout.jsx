import { Outlet } from "react-router-dom";
import Header from "@components/Header"

export default function MainLayout()
{
    return (
        <div ref = {appRef}>
            <header>
                <Header/>
            </header>
            <main>
                <Outlet/>
            </main>
        </div>
    );
}