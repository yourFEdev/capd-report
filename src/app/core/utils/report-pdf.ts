import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Report, ReportCycle } from '../models/report.model';

const MARGIN = 40;
const REPORT_GAP = 28;
const MIN_SPACE_FOR_HEADER = 140;

interface JsPDFWithTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function addPageNumbers(doc: jsPDF): void {
  const pageWidth: number = doc.internal.pageSize.getWidth();
  const pageHeight: number = doc.internal.pageSize.getHeight();
  const pageCount: number = doc.getNumberOfPages();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - MARGIN, pageHeight - 20, { align: 'right' });
  }
}

function drawReport(doc: jsPDF, report: Report, startY: number): number {
  const pageWidth: number = doc.internal.pageSize.getWidth();
  const contentWidth: number = pageWidth - MARGIN * 2;

  let y: number = startY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0);
  const titleLines: string[] = doc.splitTextToSize(report.title, contentWidth);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Date: ${formatDate(report.date)}`, MARGIN, y);
  y += 16;

  if (report.description) {
    const descLines: string[] = doc.splitTextToSize(report.description, contentWidth);
    doc.text(descLines, MARGIN, y);
    y += descLines.length * 13 + 4;
  }

  doc.setTextColor(0);

  autoTable(doc, {
    startY: y + 8,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [15, 118, 110] },
    footStyles: { fillColor: [239, 246, 255], textColor: 20, fontStyle: 'bold' },
    head: [
      [
        'Cycle',
        'Period',
        'Start time',
        'Conc.',
        'Vol. in (ml)',
        'Vol. out (ml)',
        'UF (ml)',
        'Fluid appearance',
        'Notes',
      ],
    ],
    body: report.cycles.map((c: ReportCycle): (string | number)[] => [
      c.cycle,
      c.period,
      c.startTime,
      c.concentration,
      c.volumeIn,
      c.volumeOut,
      c.uf,
      c.fluidAppearance || '-',
      c.notes || '-',
    ]),
    foot: [
      [
        { content: 'Total', colSpan: 4, styles: { halign: 'right' } },
        report.totalVolumeIn,
        report.totalVolumeOut,
        report.totalUF,
        '',
        '',
      ],
    ],
  });

  return (doc as JsPDFWithTable).lastAutoTable?.finalY ?? y;
}

export function exportReportPdf(report: Report): void {
  const doc: jsPDF = new jsPDF({ unit: 'pt', format: 'a4' });

  drawReport(doc, report, MARGIN);
  addPageNumbers(doc);

  doc.save(`report-${report.id}-${slugify(report.title) || 'report'}.pdf`);
}

export function exportAllReportsPdf(reports: Report[]): void {
  const sorted: Report[] = [...reports].sort(
    (a: Report, b: Report): number => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const doc: jsPDF = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageHeight: number = doc.internal.pageSize.getHeight();

  let y: number = MARGIN;

  sorted.forEach((report: Report, index: number): void => {
    if (index > 0) {
      y += REPORT_GAP;

      if (y + MIN_SPACE_FOR_HEADER > pageHeight - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }
    }

    y = drawReport(doc, report, y);
  });

  addPageNumbers(doc);

  doc.save(`all-reports-${new Date().toISOString().slice(0, 10)}.pdf`);
}
