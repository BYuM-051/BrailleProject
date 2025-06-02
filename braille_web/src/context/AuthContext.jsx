import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@fireservice/firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    setPersistence,
    browserSessionPersistence,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";


//TODO :: NOTE :: signup 안만들었네
const AuthContext = createContext(null);

function AuthProvider({ children }) 
{
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(()=> { setPersistence(auth, browserSessionPersistence).catch(console.error); }, []); // Session대용 Token을 BrowserSession으로 설정하면 Session마냥 종료시 만료가능

    useEffect(() =>
    {
        const unSubscribe = onAuthStateChanged(auth, async (user) => 
        {
            if(user)
            {
                const userSnapshot = await getDoc(doc(db, "users", user.uid));

                setUser(user);
                setRole(userSnapshot.exists() ? userSnapshot.data().role : "user");
            }
            else
            {
                setUser(null);
                setRole(null);
            }

            setAuthReady(true);
        }
    );
        return unSubscribe;
    }, []);

    

    const login = async (email, password) => signInWithEmailAndPassword(auth, email, password);
    const signup = async (email, password) => createUserWithEmailAndPassword(auth, email, password);
    const logout = async () => signOut(auth);

    return (
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