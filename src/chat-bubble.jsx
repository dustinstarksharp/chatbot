import React from "react";
import "./chat-bubble.css";

export default function ChatBubble({ role, html, text, typing, timestamp }) {
    const displayName =
        role === "assistant" ? "AI" :
            role === "user" ? "You" :
                "System";

    const time = timestamp
        ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";

    return (
        <div className={`cb msg ${role}`}>
            <div className="cb avatar">
                {role === "assistant" ? "🤖" : role === "user" ? "👤" : "ℹ️"}
            </div>

            <div className="cb body">
                <div className="cb header">
                    <strong className="cb name">{displayName}</strong>
                    {time && <span className="cb time">{time}</span>}
                </div>

                <div className={`cb bubble ${role}`}>
                    {typing ? (
                        <span className="cb typing">
                            <span className="dot" />
                            <span className="dot" />
                            <span className="dot" />
                        </span>
                    ) : html ? (
                        <div dangerouslySetInnerHTML={{ __html: html }} />
                    ) : (
                        <pre className="cb text">{text}</pre>
                    )}
                </div>
            </div>
        </div>
    );
}
