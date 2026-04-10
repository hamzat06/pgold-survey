import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Types (mirrored from admin page) ─────────────────────────────────────────

interface RatingQuestion {
  id: number; text: string; type: "rating";
  totalAnswers: number; average: number | null; distribution: Record<string, number>;
}
interface MultipleChoiceQuestion {
  id: number; text: string; type: "multiple_choice";
  totalAnswers: number; tally: Record<string, number>;
}
interface TextQuestion {
  id: number; text: string; type: "text";
  totalAnswers: number; responses: string[];
}
type AggregatedQuestion = RatingQuestion | MultipleChoiceQuestion | TextQuestion;

export interface ResultsData {
  totalResponses: number;
  questions: AggregatedQuestion[];
}

// ── Colours ───────────────────────────────────────────────────────────────────

const GOLD   = [0, 82, 255]    as [number, number, number]; // #0052FF brand blue
const DARK   = [17,  24,  39]  as [number, number, number]; // gray-900
const MID    = [107, 114, 128] as [number, number, number]; // gray-500
const LIGHT  = [249, 250, 251] as [number, number, number]; // gray-50
const WHITE  = [255, 255, 255] as [number, number, number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateResultsPDF(data: ResultsData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ── helpers that track y ───────────────────────────────────────────────────
  function ensureSpace(needed: number) {
    if (y + needed > pageH - 20) {
      doc.addPage();
      y = margin;
    }
  }

  function addSectionGap(size = 6) { y += size; }

  // ── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Pgold — Employee Survey Results", margin, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const generated = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.text(`Generated on ${generated}`, margin, 20);

  // Total responses badge (top-right)
  doc.setFontSize(9);
  doc.text(`${data.totalResponses} response${data.totalResponses !== 1 ? "s" : ""}`, pageW - margin, 12, { align: "right" });
  doc.text("Total", pageW - margin, 20, { align: "right" });

  y = 36;

  // ── Questions ──────────────────────────────────────────────────────────────
  data.questions.forEach((q, i) => {
    const typeLabel =
      q.type === "rating" ? "Rating 1–5"
      : q.type === "multiple_choice" ? "Multiple Choice"
      : "Open Text";

    ensureSpace(30);

    // Question header
    doc.setFillColor(...LIGHT);
    doc.roundedRect(margin, y, contentW, 14, 2, 2, "F");

    doc.setTextColor(...GOLD);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`Q${i + 1}  ·  ${typeLabel.toUpperCase()}`, margin + 4, y + 5.5);

    doc.setTextColor(...MID);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${q.totalAnswers} ${q.totalAnswers === 1 ? "response" : "responses"}`,
      pageW - margin - 4, y + 5.5, { align: "right" }
    );

    // Question text
    doc.setTextColor(...DARK);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    const lines = wrapText(doc, q.text, contentW - 8);
    lines.forEach((line, li) => doc.text(line, margin + 4, y + 11.5 + li * 5));
    y += 14 + lines.length * 5 - 5 + 4;

    // ── Rating ───────────────────────────────────────────────────────────────
    if (q.type === "rating") {
      // Average callout
      if (q.average !== null) {
        ensureSpace(14);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...GOLD);
        doc.text(String(q.average), margin + 4, y + 9);
        doc.setFontSize(9);
        doc.setTextColor(...MID);
        doc.setFont("helvetica", "normal");
        doc.text("/ 5 average", margin + 20, y + 9);
        y += 14;
      }

      // Distribution table
      ensureSpace(50);
      const rows = [5, 4, 3, 2, 1].map((n) => {
        const count = q.distribution[String(n)] ?? 0;
        const p = pct(count, q.totalAnswers);
        return [`${n} star${n !== 1 ? "s" : ""}`, count, `${p}%`];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Rating", "Count", "Percentage"]],
        body: rows,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: GOLD, textColor: WHITE, fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 25 }, 2: { cellWidth: 30 } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }

    // ── Multiple choice ───────────────────────────────────────────────────────
    if (q.type === "multiple_choice") {
      const rows = Object.entries(q.tally)
        .sort((a, b) => b[1] - a[1])
        .map(([option, count]) => [option, count, `${pct(count, q.totalAnswers)}%`]);

      ensureSpace(20 + rows.length * 10);

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Option", "Count", "Percentage"]],
        body: rows,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: GOLD, textColor: WHITE, fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }

    // ── Text responses ────────────────────────────────────────────────────────
    if (q.type === "text") {
      if (q.responses.length === 0) {
        ensureSpace(10);
        doc.setFontSize(9);
        doc.setTextColor(...MID);
        doc.setFont("helvetica", "italic");
        doc.text("No responses.", margin + 4, y + 5);
        y += 10;
      } else {
        q.responses.forEach((response, ri) => {
          const responseLines = wrapText(doc, `"${response}"`, contentW - 12);
          const blockH = responseLines.length * 5 + 8;
          ensureSpace(blockH + 4);

          // Card background
          doc.setFillColor(...LIGHT);
          doc.roundedRect(margin, y, contentW, blockH, 2, 2, "F");

          // Left accent bar
          doc.setFillColor(...GOLD);
          doc.rect(margin, y, 2.5, blockH, "F");

          doc.setFontSize(9);
          doc.setTextColor(...DARK);
          doc.setFont("helvetica", "italic");
          responseLines.forEach((line, li) =>
            doc.text(line, margin + 6, y + 5.5 + li * 5)
          );

          // Response number
          doc.setFontSize(7.5);
          doc.setTextColor(...MID);
          doc.setFont("helvetica", "normal");
          doc.text(`#${ri + 1}`, pageW - margin - 3, y + 5.5, { align: "right" });

          y += blockH + 4;
        });
      }
    }

    addSectionGap(8);
  });

  // ── Footer on every page ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFontSize(7.5);
    doc.setTextColor(...MID);
    doc.setFont("helvetica", "normal");
    doc.text("Pgold — Confidential. Aggregate data only. No individual responses are identified.", margin, pageH - 7);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 7, { align: "right" });
  }

  doc.save(`pgold-survey-results-${new Date().toISOString().slice(0, 10)}.pdf`);
}
