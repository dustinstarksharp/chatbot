import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DOMPurify from "dompurify";

/**
 * Export chat messages to a structured PDF (text-based, small size, searchable).
 *
 * @param {Array<{
 *   role: "user"|"assistant",
 *   text?: string|null,
 *   html?: string|null,
 *   typing?: boolean,
 *   timestamp?: string
 * }>} messages
 * @param {{
 *   title?: string,
 *   fileNamePrefix?: string,
 *   locale?: string,
 *   includeTypingPlaceholders?: boolean
 * }=} options
 */
export async function exportChatAsPDF(messages, options = {}) {
    if (!Array.isArray(messages)) {
        throw new Error("exportChatAsPDF: messages must be an array");
    }

    const {
        title = "AI Assistance — Chat Transcript",
        fileNamePrefix = "chat-transcript",
        locale = undefined, // defaults to browser locale
        includeTypingPlaceholders = false,
    } = options;

    // Optionally filter out typing placeholders
    const msgs = includeTypingPlaceholders ? messages : messages.filter(m => !m.typing);

    const doc = new jsPDF({ unit: "pt", format: "letter" }); // 612 x 792 pts
    const now = new Date();
    const subtitle = now.toLocaleString(locale);

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 40, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#666666");
    doc.text(`Exported: ${subtitle}`, 40, 70);
    doc.setTextColor("#000000");

    // Prepare rows for autoTable
    const rows = msgs.map((m) => {
        const role = m.role === "assistant" ? "Assistant" : "User";
        const ts = new Date(m.timestamp || Date.now()).toLocaleString(locale);

        // Prefer html if present; sanitize to text for PDF
        let content = "";
        if (m.html) {
            const sanitized = DOMPurify.sanitize(m.html, { ALLOWED_TAGS: [] });
            content = sanitized
                .replace(/\u00A0/g, " ")
                .replace(/\s+\n/g, "\n")
                .trim();
        } else {
            content = (m.text || "").trim();
        }

        return [role, ts, content];
    });

    autoTable(doc, {
        startY: 90,
        head: [["Role", "Timestamp", "Message"]],
        body: rows,
        styles: {
            font: "helvetica",
            fontSize: 10,
            cellPadding: 6,
            valign: "top",
        },
        headStyles: {
            fillColor: [28, 98, 194], // a calm blue
            textColor: 255,
            fontStyle: "bold",
        },
        columnStyles: {
            0: { cellWidth: 80 },     // Role
            1: { cellWidth: 150 },    // Timestamp
            2: { cellWidth: "auto" }, // Message grows
        },
        margin: { left: 40, right: 40 },
        didDrawPage: (data) => {
            // Footer page number
            const pageNumber = doc.getNumberOfPages();
            doc.setFontSize(9);
            doc.setTextColor("#888");
            doc.text(
                `Page ${pageNumber}`,
                data.settings.margin.left,
                doc.internal.pageSize.getHeight() - 20
            );
        },
    });

    const fileName = `${fileNamePrefix}_${now
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.pdf`;

    // Save synchronously; wrap in Promise for consistent async API
    doc.save(fileName);
    return fileName;
}

export default exportChatAsPDF;
``