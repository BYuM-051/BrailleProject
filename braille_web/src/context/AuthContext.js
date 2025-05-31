import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    setPersistence,
    browserSessionPersistence,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";



const AuthContext = createContext(null);

function AuthProvider() 
{
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(()=> { setPersistence(auth, browserSessionPersistence).catch(console.error); }, []); // Session대용 Token을 BrowserSession으로 설정하면 Session마냥 종료시 만료가능

    useEffect(() =>
    {
        const unSubscribe = onAuthStateChanged(auth, (user) => 
        {
            setUser(user);
        }
    );
        return unSubscribe;
    }, []);

    

    const login = async (email, password) => 
    {
        const credential = await signInWithEmailAndPassword(auth, email, password);

        //get UserInfo From DB
        setUser(credential.user);
        setAuthReady(true);
    };

    const signup = async (email, password) =>
    {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => 
    {
        return signOut(auth);
    };

    return 
    (
        <AuthContext.Provider value = {{ user, role, authReady, login, signup, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

function useAuth() 
{
    const context = useContext(AuthContext);
    if(context === null) throw new Error("[WARNING]authContextIsNull");
    else if(context === undefined) throw new Error("[FATAL]authContextIsUndefined");
    return context;
}

export { AuthContext, AuthProvider, useAuth }