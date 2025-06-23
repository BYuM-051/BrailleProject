import { useEffect, useState } from "react";
import "./TopBanner.css"
import { useSerial } from "@context/SerialContext";

export default function TopBanner({ targetRef })
{
    const [visible, setVisible] = useState(false);
    
    const { isSupported } = useSerial();

    useEffect(()=> {
        setVisible(!isSupported);
    }, []);

    useEffect(()=> {
        targetRef.current.style.transition = "transform 0.3s ease";
        targetRef.current.style.transform = visible ? "translateY(80px)" : "translateY(0px)";
    }, [visible, targetRef]);

    return (
        visible && (
            <div className="top-banner" role="alert" aria-live="assertive">
                <div className="top-banner__message">
                    ⚠️ 이 페이지는 Chromium 기반 브라우저에서만 정상 작동합니다.<br />
                    <span className="top-banner__note">(Chrome, Edge, Brave 등)</span>
                </div>

                <div className="top-banner__actions">
                    <a
                        href="https://www.google.com/chrome/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="top-banner__button"
                    >
                        <img
                            src="https://www.google.com/chrome/static/images/chrome-logo-m100.svg"
                            alt="Chrome Logo"
                            className="top-banner__icon"
                        />
                        Chrome 다운로드
                    </a>
                    <button
                        className="top-banner__close"
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