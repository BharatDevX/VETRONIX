type ExportValue = string | number | boolean | null | undefined;

export type ExportRow = Record<string, ExportValue>;

function escapeCsvCell(value: ExportValue) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function exportRows(filename: string, rows: ExportRow[]) {
  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function printReport() {
  window.print();
}
