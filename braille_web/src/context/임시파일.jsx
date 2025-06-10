import { createContext, useContext, useState } from "react";

const SerialContext = createContext(null);

function SerialProvider({ children })
{
    const [port, setPort] = useState(null);
    const [reader, setReader] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = async () =>
    {
        try
        {
            const newPort = await navigator.serial.requestPort();
            await newPort.open({ baudRate: 9600 });
            setPort(newPort);
            setIsConnected(true);
            startReading(newPort);
        }
        catch (err)
        {
            console.error("Failed to connect serial:", err);
        }
    };

    const disconnect = async () =>
    {
        try
        {
            if (reader)
            {
                await reader.cancel();
                setReader(null);
            }

            if (port)
            {
                await port.close();
                setPort(null);
            }

            setIsConnected(false);
        }
        catch (err)
        {
            console.error("Failed to disconnect serial:", err);
        }
    };

    const write = async (data) =>
    {
        if (!port || !port.writable) return;

        try
        {
            const writer = port.writable.getWriter();
            await writer.write(new TextEncoder().encode(data));
            writer.releaseLock();
        }
        catch (err)
        {
            console.error("Failed to write to serial:", err);
        }
    };

    const startReading = async (newPort, onData) =>
    {
        try
        {
            const decoder = new TextDecoderStream();
            await newPort.readable.pipeTo(decoder.writable);
            const inputStream = decoder.readable;
            const newReader = inputStream.getReader();
            setReader(newReader);

            while (true)
            {
                const { value, done } = await newReader.read();
                if (done) break;
                if (value && onData) onData(value);
            }
        }
        catch (err)
        {
            console.warn("Serial read interrupted:", err);
        }
    };

    return (
        <SerialContext.Provider value={{ port, isConnected, connect, disconnect, write }}>
            {children}
        </SerialContext.Provider>
    );
}

function useSerial()
{
    const context = useContext(SerialContext);
    if (context === null)
    {
        throw new Error("[WARNING] SerialContext is null");
    }
    return context;
}

export { SerialProvider, useSerial };
