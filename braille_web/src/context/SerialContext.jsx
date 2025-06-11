import { createContext, useContext, useRef, useState } from "react";

const SerialContext = createContext(null);

function SerialProvider({ children })
{
    const [port, setPort] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const readerRef = useRef(null);
    const isReadingRef = useRef(false);

    const connect = async () =>
    {
        try
        {
            const newPort = await navigator.serial.requestPort();
            await newPort.open({ baudRate: 9600 });
            setPort(newPort);
            setIsConnected(true);
            return true;
        }
        catch (err)
        {
            console.error("Failed to serial connect: ", err);
            return false;
        }
    };

    const disconnect = async () =>
    {
        try
        {
            if (readerRef.current)
            {
                await readerRef.current.cancel();
                readerRef.current.releaseLock();
                readerRef.current = null;
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
            console.error("Failed to serial disconnect: ", err);
        }
    };

    const write = async (data) =>
    {
        if (!port || !port.writable)
        {
            console.warn("No writable serial port");
            return;
        }

        try
        {
            const writer = port.writable.getWriter();
            await writer.write(new TextEncoder().encode(data));
            writer.releaseLock();
        }
        catch (err)
        {
            console.error("Failed to write to serial: ", err);
        }
    };

    const startReading = async (onData) =>
    {
        if (isReadingRef.current)
        {
            console.warn("Already reading.");
            return;
        }

        if (!port || !port.readable)
        {
            console.warn("No readable serial port");
            return;
        }

        try
        {
            const textDecoder = new TextDecoderStream();
            await port.readable.pipeTo(textDecoder.writable);
            readerRef.current = textDecoder.readable.getReader();
            isReadingRef.current = true;

            while (true)
            {
                const { value, done } = await readerRef.current.read();
                console.log(value);
                if (done)
                {
                    break;
                }
                if (value)
                {
                    onData(value);
                }
            }

            readerRef.current.releaseLock();
            isReadingRef.current = false;
        }
        catch (err)
        {
            console.error("Failed to read from serial: ", err);
            isReadingRef.current = false;
        }
    };

    return (
        <SerialContext.Provider
            value={{ port, isConnected, connect, disconnect, write, startReading }}
        >
            {children}
        </SerialContext.Provider>
    );
}

function useSerial()
{
    const context = useContext(SerialContext);

    if (context === null)
    {
        throw new Error("[WARNING] serialContext is null");
    }
    else if (context === undefined)
    {
        throw new Error("[FATAL] serialContext is undefined");
    }

    return context;
}

export { SerialProvider, useSerial };