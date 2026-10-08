const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthStr = (d = new Date()) => dateStr(d).slice(0, 7);

// Mon-Fri days between two YYYY-MM-DD strings (inclusive)
function workingDays(startStr, endStr) {
  const [y, m, d] = startStr.split('-').map(Number);
  let count = 0;
  for (let dt = new Date(y, m - 1, d); dateStr(dt) <= endStr; dt.setDate(dt.getDate() + 1)) {
    const w = dt.getDay();
    if (w !== 0 && w !== 6) count++;
  }
  return count;
}

function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const start = `${month}-01`;
  const end = `${month}-${pad(last)}`;
  const today = dateStr();
  const effectiveEnd = end < today ? end : today;
  return { start, end, days: last, workingDays: workingDays(start, effectiveEnd) };
}

module.exports = { dateStr, monthStr, workingDays, monthRange };
