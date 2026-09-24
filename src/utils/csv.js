/**
 * CSV compatible con Excel en configuración regional española/latinoamericana:
 *  - separador `;`  - BOM UTF-8 (tildes y ñ)  - saltos CRLF
 *  - neutraliza "CSV injection": celdas que empiezan por = + - @ se prefijan con '
 */
export function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows, columns) {
  const head = columns.map((c) => csvCell(c.label)).join(';');
  const body = rows.map((r) => columns.map((c) => csvCell(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(';'));
  return `\uFEFF${[head, ...body].join('\r\n')}`;
}

export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
