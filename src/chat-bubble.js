import React from "react";

type Role = "assistant" | "user" | "system";

export type ChatBubbleProps = {
    id?: string;
    role: Role;
    /** Use this if your API returns HTML (e.g., Sharp "answer") */
    html?: string;
    /** Use this if you have plain text content */
    text?: string;
    /** ISO date string or Date; if omitted, shows "now" */
    timestamp?: string | number | Date;
    /** Optional display name override (default: AI/You/System) */
    name?: string;
    /** Show animated typing dots */
    typing?: boolean;
    /** Optional avatar (emoji, letter, or image URL) */
    avatar?: string;
    /** When true, bubble uses smaller compact spacing */
    compact?: boolean;
    /** For screen readers */
    ariaLabel?: string;
};

function formatTime(ts?: string | number | Date) {
    try {
        const d = ts ? new Date(ts) : new Date();
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

export default function ChatBubble({
    id,
    role,
    html,
    text,
    timestamp,
    name,
    typing = false,
    avatar,
    compact = false,
    ariaLabel,
}: ChatBubbleProps) {
    const label =
        ariaLabel ||
        (role === "assistant" ? "AI message" : role === "user" ? "User message" : "System message");

    const displayName =
        name || (role === "assistant" ? "AI" : role === "user" ? "You" : "System");

    const timeString = formatTime(timestamp);

    const isImageAvatar = avatar && /^(https?:)?\/\//.test(avatar);

    return (
        <div
            id={id}
            className={`cb msg ${role} ${compact ? "compact" : ""}`}
            role="listitem"
            aria-label={label}
        >
            {/* Avatar */}
            <div className="cb avatar" aria-hidden="true">
                {avatar ? (
                    isImageAvatar ? (
                        <img src={avatar} alt="" />
                    ) : (
                        <span>{avatar}</span>
                    )
                ) : role === "assistant" ? (
                    <span>🤖</span>
                ) : role === "user" ? (
                    <span>👤</span>
                ) : (
                    <span>ℹ️</span>
                )}
            </div>

            {/* Bubble */}
            <div className="cb body">
                <div className="cb header">
                    <strong className="cb name">{displayName}</strong>
                    {timeString && <span className="cb time" aria-hidden="true">{timeString}</span>}
                </div>

                <div className={`cb bubble ${role}`}>
                    {typing ? (
                        <span className="cb typing" aria-live="polite" aria-label="AI is typing">
                            <span className="dot" />
                            <span className="dot" />
                            <span className="dot" />
                        </span>
                    ) : html ? (
                        // If you trust the backend HTML (e.g., first-party), render it:
                        <div dangerouslySetInnerHTML={{ __html: html }} />
                    ) : (
                        <pre className="cb text">{text ?? ""}</pre>
                    )}
                </div>
            </div>
        </div>
    );
}
