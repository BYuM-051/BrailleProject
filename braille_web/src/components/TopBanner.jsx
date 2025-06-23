import { useEffect, useRef, useState } from "react";

export default function TopBanner({ targetRef })
{
    const [visible, setVisible] = useState(false);
    
    useEffect(()=>{
        if(!("serial" in navigator))
            setVisible(true);
    }, []);
    useEffect(()=> {
        targetRef.current.style.transition = "transform 0.3s ease";
        targetRef.current.style.trasnform = visible ? "translateY(80px)" : "translateY(0px)";
    }, [visible, targetRef]);

    return (
        visible && (
            <div
            style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            backgroundColor: "#222",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
            zIndex: 9999,
            transition: "top 0.3s ease",
            }}
            >
                <span style={{ fontSize: "14px" }}>
                ⚠️ 이 페이지는 Chrome 브라우저에서 최적화되어 있습니다.
                </span>
                <button
                onClick={() => setVisible(false)}
                style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: "20px",
                cursor: "pointer",
                lineHeight: "1",
                }}
                aria-label="Close banner"
                >
                ×
                </button>
            </div>
        )
    );
}