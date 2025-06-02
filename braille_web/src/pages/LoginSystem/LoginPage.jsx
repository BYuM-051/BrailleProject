import { useAuth } from "@context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage () 
{
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) =>
    {
        e.preventDefault();
        setError("");

        try
        {
            await login(email, password);
            
            navigate("/");
        }
        catch (err)
        {
            setError("Login Failed : " + err.message);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="login-error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="login-field">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="login-field">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="login-button">Log In</button>
                <p>Don't have an account? <a href="/signup">Sign Up</a></p>
            </form>
        </div>
    );
}