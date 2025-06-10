import { createContext, useContext, useState } from "react";

const SerialContext = createContext(null);

function SerialProvider({ children })
{
    const [port, setPort] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = async () => 
    {
        try
        {
            const newPort = await navigator.serial.requestPort();
            await newPort.open({ baudRate: 9600 });
            setPort(newPort);
            setIsConnected(true);
        }
        catch(err)
        {
            console.error("Failed to serial connect : ", err);
        }
    }

    const disconnect = async() =>
    {
        try
        {
            await port.close();
            setPort(null);
            setIsConnected(false);
        }
        catch(err)
        {
            console.error("Failed to serial disconnect : ", err);
        }
    }

    const write = async(data) =>
    {
        if(!port || !port.writable)
            {return;}

        try
        {
            const writer = port.writable.getWriter();
            await writer.write(new TextEncoder().encode(data));
            writer.releaseLock();
        }
        catch(err)
            {console.error("Failed to write to serial : ", err);}
    }

    const startReading = async (newPort, onData) =>
    {
        
    }

    return (
        <SerialContext.Provider value = {{ port, isConnected, connect, disconnect , write}}>
            {children}
        </SerialContext.Provider>
    );
}

function useSerial()
{
    const context = useContext(SerialContext);
    if(context === null) throw new Error("[WARNING]serialContextIsNull");
    else if(context === undefined) throw new Error("[FATAL]serialContextIsUndefined");
    return context;
}

export { SerialContext, SerialProvider, useSerial }