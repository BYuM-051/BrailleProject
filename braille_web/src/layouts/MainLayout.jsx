import { Outlet } from "react-router-dom";
import Header from "@componets/Header.jsx"

export default function MainLayout()
{
    return (
        <>
            <Header>
                <Outlet />
            </Header>
        </>
    );
}