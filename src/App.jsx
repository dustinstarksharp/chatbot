import { useEffect, useRef, useState } from "react";
import "./App.css";

export default function App() {
    const [open, setOpen] = useState(false);
    const closeBtnRef = useRef(null);

    // Close with ESC
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Focus the close button when panel opens (simple a11y)
    useEffect(() => {
        if (open) {
            closeBtnRef.current?.focus();
        }
    }, [open]);

    return (
        <div className="app">
            {/* LEFT RECTANGULAR DOCK / TAB */}
            <button
                className="left-dock"
                aria-label="Open AI assistance"
                onClick={() => setOpen(true)}
                title="Open AI Assistance"
            >
                <span>AI Assistance</span>
            </button>

            {/* SLIDE-OUT PANEL (LEFT) */}
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
                    <p><strong>Context:</strong> Step 1 — Paper Feed</p>
                    <ul>
                        <li>Bypass: BP‑PT10 / BP‑PT11</li>
                        <li>Air Suction: BP‑PT12–16</li>
                        <li>High‑Capacity: BP‑PT17 / BP‑PT18</li>
                    </ul>

                    <div style={{ height: 12 }} />

                    <label htmlFor="ai-input" style={{ display: "block", marginBottom: 6 }}>
                        Type here (demo only):
                    </label>
                    <textarea id="ai-input" placeholder="Ask or paste a purpose sentence..." />

                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                            className="icon-btn"
                            onClick={async () => {

                                const resp = await fetch("/api/send", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ payload: { question: "where is the bp" } }),
                                });


                                const text = await resp.text();
                                alert(text);
                            }}
                        >
                            Send
                        </button>
                        <button className="icon-btn" onClick={() => alert("Clear stub")}>Clear</button>
                    </div>

                    <div style={{ marginTop: 18, fontSize: 12, color: "#8ea0c2" }}>
                        <p>
                            Tip: This is just a shell. Later, mount your real chat components here and
                            stream AI bullets. Keep replies short and step‑aware.
                        </p>
                    </div>
                </div>
            </aside>

            {/* BACKDROP (click to close) */}
            {open && <div className="backdrop" onClick={() => setOpen(false)} />}

            {/* PAGE BODY PLACEHOLDER */}
            <main className="center-placeholder">
                <div className="box">Machine Diagram Placeholder</div>
            </main>
        </div>
    );
}