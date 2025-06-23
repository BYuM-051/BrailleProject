import { useEffect, useState } from "react";
import "./TopBanner.css"

export default function TopBanner({ targetRef })
{
    const [visible, setVisible] = useState(false);
    
    useEffect(()=>{
        if(!("serial" in navigator))
            setVisible(true);
    }, []);
    useEffect(()=> {
        targetRef.current.style.transition = "transform 0.3s ease";
        targetRef.current.style.transform = visible ? "translateY(80px)" : "translateY(0px)";
    }, [visible, targetRef]);

    return (
        visible && (
            <div className="top-banner">
                <span>
                    ⚠️ 원활한 이용을 위해 <strong>Chrome</strong> 브라우저를 권장합니다.
                </span>

                <div className="top-banner-actions">
                    <a
                        href="https://www.google.com/chrome/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="top-banner-download"
                    >
                        <img
                            src="https://www.google.com/chrome/static/images/chrome-logo-m100.svg"
                            alt="Chrome Logo"
                            className="top-banner-icon"
                        />
                        Chrome 다운로드
                    </a>
                    <button
                        className="top-banner-close"
                        onClick={() => setVisible(false)}
                        aria-label="Close banner"
                    >
                        ×
                    </button>
                </div>
            </div>
        )
    );

}