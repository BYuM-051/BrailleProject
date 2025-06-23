import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const SerialContext = createContext(null);

function SerialProvider({ children })
{
    const [isConnected, setIsConnected] = useState(false);
    const portRef = useRef(null);
    const readerRef = useRef(null);
    const isReadingRef = useRef(false);
    const pipeClosedRef = useRef(null);
    const abortControllerRef = useRef(null);

    const connect = async (onData) =>
    {
        try
        {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            portRef.current = port;
            setIsConnected(true);

            const textDecoder = new TextDecoderStream();
            pipeClosedRef.current = port.readable.pipeTo(textDecoder.writable);

            const reader = textDecoder.readable.getReader();
            readerRef.current = reader;
            isReadingRef.current = true;

            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            while (true)
            {
                const { value, done } = await reader.read();

                if (abortController.signal.aborted || done)
                {
                    break;
                }

                if (value)
                {
                    onData(value);
                }
            }

            reader.releaseLock();
            isReadingRef.current = false;
        }
        catch (err)
        {
            console.error("Serial connect/read failed:", err);
            setIsConnected(false);
        }
    };

    const disconnect = async () =>
    {
        try
        {
            abortControllerRef.current?.abort();

            if (isReadingRef.current && readerRef.current)
            {
                await readerRef.current.cancel();
                await pipeClosedRef.current?.catch(() => {});
                readerRef.current = null;
                isReadingRef.current = false;
            }

            if (portRef.current)
            {
                await portRef.current.close();
                portRef.current = null;
            }

            setIsConnected(false);
        }
        catch (err)
        {
            console.error("Serial disconnect failed:", err);
        }
    };

    const write = async (data) =>
    {
        const port = portRef.current;

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
            console.error("Serial write failed:", err);
        }
    };

    useEffect(() =>
    {
        return () =>
        {
            disconnect();
        };
    }, []);

    const contextValue = useMemo(() =>
    {
        return {
            isConnected,
            connect,
            disconnect,
            write
        };
    }, [isConnected]);

    return (
        <SerialContext.Provider value={contextValue}>
            {children}
        </SerialContext.Provider>
    );
}

function useSerial()
{
    const context = useContext(SerialContext);

    if (context === null)
    {
        throw new Error("[WARNING] useSerial() must be used within <SerialProvider>");
    }

    return context;
}

export { SerialProvider, useSerial };