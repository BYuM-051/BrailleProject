import { userAccount } from "@context/AccountContext";
import { Link } from "react-router-dom";

export default function MainPage() 
{
    const { user, thereisNo } = userAccount();
    return(
        <>
        {
            !user && 
            (<Link to = "/signup">
            <button >signup</button>
            </Link>)
        }
        {
            user &&
            (
                <a>hi {JSON.stringify(user)}</a>
            )
        }
        </>
    );
        
}