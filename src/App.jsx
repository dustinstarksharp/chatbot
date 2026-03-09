import { useEffect, useRef, useState } from "react";
import ChatBubble from "./Chat-bubble"; // ⬅️ adjust path if ChatBubble.jsx is elsewhere
import { toDisplayModel } from "./api-response-reader"; // ⬅️ adjust path as needed, e.g., "../utils/api-response-reader"
import "./App.css";
import exportChatAsPDF from "./exportPDF";
export default function App() {
    const [open, setOpen] = useState(false);
    const closeBtnRef = useRef(null);

    // Chat state — messages now match ChatBubble shape: { role, html, text, typing, timestamp }
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");     // input text
    const [loading, setLoading] = useState(false);  // loading spinner flag for the Send button
    const [err, setErr] = useState("");             // error text (top-level)

    // NEW: holds the API's "history" array exactly as returned (reverse-ordered, server-capped)
    const [serverHistory, setServerHistory] = useState([]);

    const chatRef = useRef(null); // auto scroll


    async function onExport() {
        try {
            setErr("");
            await exportChatAsPDF(messages, {
                title: "AI Assistance — Chat Transcript",
                fileNamePrefix: "chat-transcript",
                // locale: "en-US",
                includeTypingPlaceholders: false,
            });
        } catch (e) {
            console.error(e);
            setErr("Export failed. See console for details.");
        }
    }


    // ESC closes panel
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Focus close button when panel opens
    useEffect(() => {
        if (open) {
            closeBtnRef.current?.focus();
        }
    }, [open]);

    // Auto-scroll down on new messages
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    // SEND handler
    async function onSend() {
        if (!message.trim()) return;

        const userMsg = {
            role: "user",
            text: message.trim(),
            html: null,
            typing: false,
            timestamp: new Date().toISOString()
        };

        // 1) Add USER message to chat immediately
        setMessages((prev) => [...prev, userMsg]);
        setMessage(""); // clear input
        setErr("");
        setLoading(true);

        // Optional: show a typing placeholder bubble
        const typingMsg = {
            role: "assistant",
            text: "",
            html: null,
            typing: true,
            timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, typingMsg]);

        try {
            // IMPORTANT: send exactly the server-provided history (reverse-ordered, cumulative)
            const resp = await fetch("/api/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payload: {
                        question: userMsg.text,
                        history: serverHistory  // <-- as-is, no client-side reconstruction
                    },
                }),
            });

            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                throw new Error(`API ${resp.status} ${resp.statusText}${text ? ` — ${text}` : ""}`);
            }

            // 3) Parse backend response JSON (Sharp "ask" shape)
            const apiResponse = await resp.json();

            // 4) Normalize with your helper
            const model = toDisplayModel(apiResponse);

            // 5) Create the AI message for ChatBubble
            const aiMsg = {
                role: "assistant",
                // Prefer formatted HTML if available; ChatBubble will render via dangerouslySetInnerHTML
                html: model.answerHtml || null,
                // Provide a plain-text fallback (also useful for copy-to-clipboard features later)
                text: model.answerText || "(No response)",
                typing: false,
                timestamp: new Date().toISOString()
            };

            // 6) Replace the typing placeholder with the real message
            setMessages((prev) => {
                const copy = [...prev];
                if (copy.length && copy[copy.length - 1].typing) {
                    copy.pop();
                }
                return [...copy, aiMsg];
            });

            // NEW: capture the server-returned history for next round
            // The API returns the submitted history plus the latest Q/A at the START of the array (reverse order).
            if (apiResponse && Array.isArray(apiResponse.history)) {
                setServerHistory(apiResponse.history);
            }

        } catch (e) {
            setErr(e.message);

            // Replace typing placeholder with an error bubble
            setMessages((prev) => {
                const copy = [...prev];
                if (copy.length && copy[copy.length - 1].typing) {
                    copy.pop();
                }
                return [
                    ...copy,
                    {
                        role: "assistant",
                        text: "Error: could not reach server.",
                        html: null,
                        typing: false,
                        timestamp: new Date().toISOString()
                    }
                ];
            });
        } finally {
            setLoading(false);
        }
    }

    function onClearChat() {
        setMessages([]);
        setErr("");
        // Optional: reset the history to empty when clearing the chat UI
        setServerHistory([]);
    }

    return (
        <div className="app">

            {/* LEFT DOCK BUTTON */}
            <button
                className="left-dock"
                aria-label="Open AI assistance"
                onClick={() => setOpen(true)}
                title="Open AI Assistance"
            >
                <span>AI Assistance</span>
            </button>

            {/* SLIDE OUT PANEL */}
            <aside
                className={`side-panel ${open ? "open" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ai-panel-title"
            >
                <div className="panel-header">
                    <h2 id="ai-panel-title" className="panel-title">AI Assistance</h2>

                    <button
                        ref={closeBtnRef}
                        className="close-btn"
                        onClick={() => setOpen(false)}
                    >
                        Close
                    </button>
                </div>

                <div className="panel-content">

                    {/* CHAT WINDOW */}
                    <div className="chat-window" ref={chatRef}>
                        {messages.map((m, i) => (
                            <ChatBubble
                                key={i}
                                role={m.role}
                                text={m.text}
                                html={m.html}
                                typing={m.typing}
                                timestamp={m.timestamp}
                            />
                        ))}
                    </div>

                    {/* USER INPUT */}
                    <label htmlFor="ai-input" style={{ display: "block", marginBottom: 6 }}>
                        Type your question:
                    </label>

                    <textarea
                        id="ai-input"
                        placeholder='e.g., "how does BP‑1200 work?"'
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            //Press enter key = send a prompt to chatbot
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                onSend();
                            }
                            //Shift+Enter= allow newline (do nothing)
                        }}
                    />

                    {/* ACTION BUTTONS */}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                            className="icon-btn"
                            onClick={onSend}
                            disabled={loading || !message.trim()}
                        >
                            {loading ? "Sending…" : "Send"}
                        </button>

                        <button className="icon-btn" onClick={onClearChat}>
                            Clear
                        </button>


                        <button className="icon-btn" onClick={onExport}>
                            Export PDF
                        </button>

                    </div>

                    {/* ERROR DISPLAY */}
                    {err && (
                        <p style={{ color: "#ff6b6b", marginTop: 12 }}>
                            {err}
                        </p>
                    )}

                    {/* FOOTER TIP */}
                    <div style={{ marginTop: 18, fontSize: 12, color: "#8ea0c2" }}>
                        <p>
                            Tip: Outputs from the AI are only a suggestion, please refer to client bids and management for a safe configuration.
                        </p>
                    </div>

                </div>
            </aside>

            {/* BACKDROP */}
            {open && <div className="backdrop" onClick={() => setOpen(false)} />}

            {/* PAGE BODY */}
            <main className="center-placeholder">
                <div className="box">Machine Diagram Placeholder</div>
            </main>

        </div>
    );
}