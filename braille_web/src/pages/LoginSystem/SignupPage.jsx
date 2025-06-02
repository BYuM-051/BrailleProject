import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import { db } from "@fireservice/firebase";
import { doc, setDoc } from "firebase/firestore"

import "@css/index.css";

export default function Signup()
{
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [keyword, setKeyword] = useState("");
    const [error, setError] = useState("");
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) =>
    {
        e.preventDefault();
        setError("");

        try
        {
            const userCredential = await signup(email, password);
            const user = userCredential.user;

            const role = keyword.trim().toLowerCase() === "admin" ? "admin" : "user";
            await setDoc(doc(db, "users", user.uid), 
            { 
                role: role 
            });

            navigate("/login");
        }
        catch (err)
        {
            setError("Failed to sign up: " + err.message);
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            {error && <p className="signup-error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="signup-field">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="signup-field">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="signup-field">
                    <label>
                        Keyword (<strong>admin</strong> for admin account, leave blank for user)
                    </label>
                    <input
                        type="text"
                        placeholder="Enter keyword if admin"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </div>
                <button type="submit" className="signup-button">Sign Up</button>
                <p>
                    Already have an account? <a href="/login">Log In</a>
                </p>
            </form>
        </div>
    );
}