// server.cjs
const express = require("express");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(express.json());

const BASE = "https://service2.sharpusa.net/api/enhanced-search/ai/v1.0/query/ask";

function percentEncode(str) {
    return encodeURIComponent(str)
        .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase())
        .replace(/%2F/g, "/");
}

function signRequest(url, method = "POST") {
    const dateHeader = new Date().toUTCString();
    const userAgent = "NodeRuntime";
    const u = new URL(url);
    const host = u.host;
    const path = u.pathname;
    const parameters = `${dateHeader}${host}${userAgent}`;
    const messageData = [method.toUpperCase(), host, path, percentEncode(parameters)].join("\n");
    const signature = crypto
        .createHmac("sha256", process.env.SECRET_KEY)
        .update(messageData)
        .digest("base64");
    return {
        date: dateHeader,
        "user-agent": userAgent,
        Authorization: `Bearer ${process.env.ACCESS_KEY}:${signature}`,
    };
}

app.post("/api/send", async (req, res) => {
    try {
        const payload = req.body?.payload || {};
        const headers = { ...signRequest(BASE), "Content-Type": "application/json" };

        const upstream = await fetch(BASE, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        const contentType = upstream.headers.get("content-type") || "text/plain";
        const text = await upstream.text();
        res.setHeader("Content-Type", contentType);
        res.status(upstream.status).send(text);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err?.message || "Proxy error" });
    }
});

app.listen(3001, () => console.log("Server running at http://localhost:3001"));