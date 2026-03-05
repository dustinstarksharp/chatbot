import { useEffect, useRef, useState } from "react";
import "./App.css";

export default function App() {
    const [open, setOpen] = useState(false);
    const closeBtnRef = useRef(null);

    // Chat state
    const [messages, setMessages] = useState([]);   // [{role:'user'|'assistant', content:string}]
    const [message, setMessage] = useState("");     // input text
    const [loading, setLoading] = useState(false);  // loading spinner
    const [err, setErr] = useState("");             // error text

    const chatRef = useRef(null); // auto scroll

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

        const userMsg = { role: "user", content: message.trim() };

        // 1. Add USER message to chat
        setMessages((prev) => [...prev, userMsg]);
        setMessage(""); // clear input
        setErr("");
        setLoading(true);

        try {
            // 2. Send to backend (/api/send uses Vite proxy)
            const resp = await fetch("/api/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payload: { question: userMsg.content }
                }),
            });

            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                throw new Error(`API ${resp.status} ${resp.statusText}${text ? ` — ${text}` : ""}`);
            }

            // 3. Read backend response
            const text = await resp.text();
            const aiMsg = { role: "assistant", content: text || "(No response)" };

            // 4. Add AI message to chat
            setMessages((prev) => [...prev, aiMsg]);

        } catch (e) {
            setErr(e.message);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Error: could not reach server." }
            ]);
        } finally {
            setLoading(false);
        }
    }

    function onClearChat() {
        setMessages([]);
        setErr("");
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

                    {/* CONTEXT (optional) */}
                    <p><strong>Context:</strong> Step 1 — Paper Feed</p>
                    <ul>
                        <li>Bypass: BP‑PT10 / BP‑PT11</li>
                        <li>Air Suction: BP‑PT12–16</li>
                        <li>High‑Capacity: BP‑PT17 / BP‑PT18</li>
                    </ul>

                    {/* CHAT WINDOW */}
                    <div className="chat-window" ref={chatRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-bubble ${m.role}`}>
                                {m.content}
                            </div>
                        ))}
                    </div>

                    {/* USER INPUT */}
                    <label htmlFor="ai-input" style={{ display: "block", marginBottom: 6 }}>
                        Type your question:
                    </label>

                    <textarea
                        id="ai-input"
                        placeholder='e.g., "how does bp‑1200 work?"'
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                e.preventDefault();
                                onSend();
                            }
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
                            Tip: This is your chat shell. You’ll later add streaming responses,
                            step‑aware hints, and suggestions for BP‑1200 configuration.
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