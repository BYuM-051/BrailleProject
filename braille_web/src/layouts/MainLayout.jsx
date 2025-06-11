import { Outlet } from "react-router-dom";
import Header from "@components/Header.jsx"

export default function MainLayout()
{
    return (
        <>
            <header>
                <Header/>
            </header>
            <main>
                <Outlet/>
            </main>
        </>
    );
}