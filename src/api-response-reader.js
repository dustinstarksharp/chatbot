/**
 * api-response-reader.js
 * Utility to interpret/normalize a Sharp "ask" API response.
 *
 * Shape expected (example):
 * {
 *   "answer": "<p>...</p>",
 *   "intents": ["..."],
 *   "citations": [],
 *   "input-tokens-count": 7054,
 *   "output-tokens-count": 218,
 *   "input-tokens-cost": 0.017635,
 *   "output-tokens-cost": 0.00218,
 *   "history": [{ question: "where is the bp", answer: "<p>...</p>" }]
 * }
 */

/** ---- Helpers ---- **/

/**
 * Very small HTML → text converter (keeps list bullets and headings simple).
 * Not a sanitizer; only for creating a readable plain-text preview.
 */
function htmlToPlainText(html = "") {
    if (!html || typeof html !== "string") return "";
    // Convert common block elements to newlines
    let s = html
        .replace(/<\/(p|div|section|article|h\d)>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/li>/gi, "\n• ")
        .replace(/<\/ul>|<\/ol>/gi, "\n");

    // Strip all tags
    s = s.replace(/<\/?[^>]+>/g, "");

    // Decode minimal HTML entities
    s = s
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Collapse whitespace
    return s
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Simple guard for array fields.
 */
function toArray(v) {
    return Array.isArray(v) ? v : [];
}

/**
 * Normalizes token + cost info.
 */
function normalizeUsage(resp) {
    const inputTokens = Number(resp?.["input-tokens-count"] ?? 0);
    const outputTokens = Number(resp?.["output-tokens-count"] ?? 0);
    const inputCost = Number(resp?.["input-tokens-cost"] ?? 0);
    const outputCost = Number(resp?.["output-tokens-cost"] ?? 0);
    return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
    };
}

/**
 * Builds a lightweight display model for UI.
 */
export function toDisplayModel(apiResponse) {
    if (!apiResponse || typeof apiResponse !== "object") {
        throw new Error("Invalid API response: expected an object.");
    }

    const answerHtml = String(apiResponse.answer ?? "");
    const answerText = htmlToPlainText(answerHtml);

    const intents = toArray(apiResponse.intents).map(String);
    const citations = toArray(apiResponse.citations);
    const history = toArray(apiResponse.history).map((h) => ({
        question: String(h?.question ?? ""),
        answerHtml: String(h?.answer ?? ""),
        answerText: htmlToPlainText(String(h?.answer ?? "")),
    }));

    const usage = normalizeUsage(apiResponse);

    return {
        answerHtml,
        answerText,
        intents,
        citations,
        history,
        usage,
        // For quick “is this just a clarifying reply?”
        isLikelyClarification:
            !intents.length &&
            /clarify|specify|more information|incomplete/i.test(answerText),
    };
}

/**
 * Renders the answer and (optionally) more info into a container.
 * - Uses innerHTML for answerHtml (the API already returns formatted HTML).
 * - You can toggle showMeta to append intents, usage, etc.
 *
 * NOTE: If you need strict sanitization, integrate a sanitizer (e.g., DOMPurify).
 */
export function renderAnswer(container, displayModel, { showMeta = true } = {}) {
    if (!container) throw new Error("renderAnswer: container is required");
    if (!displayModel) throw new Error("renderAnswer: displayModel is required");

    const { answerHtml, intents, usage } = displayModel;

    // Clear existing
    container.innerHTML = "";

    // Answer block
    const answerEl = document.createElement("div");
    answerEl.className = "sharp-answer";
    answerEl.innerHTML = answerHtml || "<p><em>No answer provided.</em></p>";
    container.appendChild(answerEl);

    if (showMeta) {
        const metaEl = document.createElement("div");
        metaEl.className = "sharp-meta";
        metaEl.style.cssText = "margin-top:12px;font-size:12px;color:#6b7280;";

        const lines = [];

        if (intents && intents.length) {
            lines.push(
                `<div><strong>Intents:</strong> ${intents
                    .map((i) => `<code>${escapeHtmlInline(i)}</code>`)
                    .join(", ")}</div>`
            );
        }

        if (usage) {
            const { inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost } = usage;
            lines.push(
                `<div><strong>Tokens:</strong> in=${inputTokens}, out=${outputTokens}, total=${totalTokens}</div>`
            );
            lines.push(
                `<div><strong>Cost (USD):</strong> in=${inputCost.toFixed(
                    6
                )}, out=${outputCost.toFixed(6)}, total=${totalCost.toFixed(6)}</div>`
            );
        }

        if (lines.length) {
            metaEl.innerHTML = lines.join("");
            container.appendChild(metaEl);
        }
    }
}

/**
 * Very small inline HTML escaper for meta badges.
 */
function escapeHtmlInline(s = "") {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/** ---- Default helper that does everything in one call (browser) ---- **/

/**
 * Interpret and render into a DOM container.
 * @param {HTMLElement} container - Target element to render into.
 * @param {object} apiResponse - Raw response object from Sharp endpoint.
 * @param {{ showMeta?: boolean }} options
 * @returns {object} displayModel - The normalized display model.
 */
export function interpretAndRender(container, apiResponse, options) {
    const model = toDisplayModel(apiResponse);
    renderAnswer(container, model, options);
    return model;
}

/** ---- Node-friendly usage helpers (no DOM) ---- **/

/**
 * Node: convert API response to a plain string (without HTML tags).
 */
export function toPlainString(apiResponse) {
    const model = toDisplayModel(apiResponse);
    const { answerText, intents, usage } = model;
    const meta = [];
    if (intents?.length) meta.push(`Intents: ${intents.join(", ")}`);
    if (usage) {
        meta.push(
            `Tokens(in/out/total): ${usage.inputTokens}/${usage.outputTokens}/${usage.totalTokens}`
        );
        meta.push(
            `Cost(in/out/total): ${usage.inputCost.toFixed(6)}/${usage.outputCost.toFixed(6)}/${usage.totalCost.toFixed(6)}`
        );
    }
    return [answerText, meta.join(" | ")].filter(Boolean).join("\n\n");
}

export default {
    toDisplayModel,
    renderAnswer,
    interpretAndRender,
    toPlainString,
};