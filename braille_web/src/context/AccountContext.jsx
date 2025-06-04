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
import userBeans from "@beans/userBeans";

const AccountContext = createContext(null);

function AccountProvider({ children }) 
{
    const [user, setUser] = useState(null);
    const [role, setRole] = useState("guest");
    const [authReady, setAuthReady] = useState(false);

    useEffect(()=> { setPersistence(auth, browserSessionPersistence).catch(console.error); }, []); // Session대용 Token을 BrowserSession으로 설정하면 Session마냥 종료시 만료가능

    useEffect(() =>
    {
        const unSubscribe = onAuthStateChanged(auth, async (user) => 
        {
            if(user)
            {
                const userSnapshot = await getDoc(doc(db, "users", user.uid));
                const firestoreData = userSnapshot.exists() ? userSnapshot.data() : {};

                const normalizedUser = 
                {
                    ...userBeans,
                    ...firestoreData
                };

                setUser(normalizedUser);
                setRole(normalizedUser.role);
            }
            else
            {
                setUser(null);
                setRole("guest");
            }

            setAuthReady(true);
        } );
        return unSubscribe;
    }, []);

    const login = async (email, password) => signInWithEmailAndPassword(auth, email, password);
    const signup = async (email, password) =>
    {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), 
        {
            ...userBeans,
            role : "user",
            uid : user.uid,
            email : user.email,
        });
    }
    const logout = async () => signOut(auth);

    return (
        <AccountContext.Provider value = {{ user, role, authReady, login, signup, logout}}>
            {children}
        </AccountContext.Provider>
    );
}

function userAccount() 
{
    const context = useContext(AccountContext);
    if(context === null) throw new Error("[WARNING]AccountContextIsNull");
    else if(context === undefined) throw new Error("[FATAL]AccountContextIsUndefined");
    return context;
}

export { AccountContext, AccountProvider, userAccount }