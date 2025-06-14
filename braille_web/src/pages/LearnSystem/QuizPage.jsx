import { useSerial } from "@context/SerialContext";

export default function QuizPage()
{
    const { isConnected, connect, write, disconnect } = useSerial();

    const handleConnect = async () =>
    {
        await connect((value) =>
        {
            console.log("📥 Received from serial:", value);
        });
    };

    return (
        <div>
            <p>{isConnected ? "🟢 Connected" : "🔴 Disconnected"}</p>
            <button onClick={handleConnect}>Connect</button>
            {isConnected && (
                <>
                    <button onClick={() => write("handShake\n")}>Send</button>
                    <button onClick={disconnect}>Disconnect</button>
                </>
            )}
        </div>
    );
}
