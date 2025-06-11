import { useSerial } from "@context/SerialContext"
import { useEffect } from "react";

export default function LearningPage()
{
    const { isConnected, connect, disconnect, write, startReading } = useSerial();

    useEffect(() => 
    {
        if(isConnected)
        {
            //alert("Connected");
        }
        
    }, [isConnected]);

    useEffect(() =>
    {
        return(() =>
        {
            disconnect();
        });
    }, []);

    function readCallback(value)
    {
        alert("NewMessageFromSerial" + value);
    }

    return(
        <div>
            <button onClick=
            {
                async () => 
                {
                    if(await connect())
                    {
                        alert("connected");
                        await startReading(readCallback);
                    }
                    else
                    {
                        alert("notConnected");
                    }
                }
            }>
            connectSerial
            </button>
            {isConnected ? <button onClick={() => write("handShake")} >handShake</button>: null}
        </div>
    )
}