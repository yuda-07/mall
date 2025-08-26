function parseRangeOrToday(qs) {
  let start = qs.start ? new Date(qs.start) : null;
  let end   = qs.end   ? new Date(qs.end)   : null;
  if (!(start instanceof Date) || isNaN(start)) {
    start = new Date(); start.setHours(0,0,0,0);
  }
  if (!(end instanceof Date) || isNaN(end)) {
    end = new Date();   end.setHours(23,59,59,999);
  }
  return { start, end };
}

const HARI = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];
function idxSenin0(d) { return (d.getDay() + 6) % 7; }
function rangeMingguIni() {
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const monIdx = idxSenin0(start);
  start.setDate(start.getDate() - monIdx);
  const end = new Date(start); end.setDate(start.getDate() + 7);
  return { start, end };
}

module.exports = { parseRangeOrToday, HARI, idxSenin0, rangeMingguIni };
