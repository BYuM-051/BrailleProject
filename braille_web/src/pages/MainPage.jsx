import { useAuth } from "@context/AuthContext";
import { Link } from "react-router-dom";

export default function MainPage() 
{
    const { user, thereisNo } = useAuth();
    return(
        <>
        {
            !user && 
            (<Link to = "/signup">
            <button >signup</button>
            </Link>)
        }
        {
            thereisNo &&
            (
                <a>hi {user}</a>
            )
        }
        </>
    );
        
}