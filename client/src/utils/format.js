export const currency = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const liters = (n) => `${Number(n || 0).toFixed(2)} L`;

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function toCSV(rows, columns) {
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const body = rows
    .map((r) =>
      columns
        .map((c) => {
          const val = typeof c.value === 'function' ? c.value(r) : r[c.key];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\n');
  return header + '\n' + body;
}

export function downloadFile(filename, content, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportExcel(filename, sheets) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows, columns }) => {
    const header = columns.map((c) => c.label);
    const body = rows.map((r) =>
      columns.map((c) => (typeof c.value === 'function' ? c.value(r) : r[c.key] ?? ''))
    );
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    ws['!cols'] = columns.map((c) => ({ wch: Math.max(12, c.label.length + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, (name || 'Sheet1').slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
}
