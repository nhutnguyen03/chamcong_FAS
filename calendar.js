const SYNODIC_MONTH = 29.530588853;
const NEW_MOON_EPOCH = 2415021.076998695;
const TIME_ZONE = 7;

function julianDay(day, month, year) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function newMoonJulianDay(k) {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const dr = Math.PI / 180;
  let jd = 2415020.75933 + SYNODIC_MONTH * k + 0.0001178 * t2 - 0.000000155 * t3;
  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const mPrime = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
  let correction = (0.1734 - 0.000393 * t) * Math.sin(m * dr)
    + 0.0021 * Math.sin(2 * m * dr)
    - 0.4068 * Math.sin(mPrime * dr)
    + 0.0161 * Math.sin(2 * mPrime * dr)
    - 0.0004 * Math.sin(3 * mPrime * dr)
    + 0.0104 * Math.sin(2 * f * dr)
    - 0.0051 * Math.sin((m + mPrime) * dr)
    - 0.0074 * Math.sin((m - mPrime) * dr)
    + 0.0004 * Math.sin((2 * f + m) * dr)
    - 0.0004 * Math.sin((2 * f - m) * dr)
    - 0.0006 * Math.sin((2 * f + mPrime) * dr)
    + 0.001 * Math.sin((2 * f - mPrime) * dr)
    + 0.0005 * Math.sin((2 * mPrime + m) * dr);
  const deltaT = t < -11
    ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t2 * t2
    : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return jd + correction - deltaT;
}

function newMoonDay(k) {
  return Math.floor(newMoonJulianDay(k) + 0.5 + TIME_ZONE / 24);
}

function sunLongitude(jd) {
  const t = (jd - 2451545) / 36525;
  const t2 = t * t;
  const dr = Math.PI / 180;
  const m = 357.5291 + 35999.0503 * t - 0.0001559 * t2 - 0.00000048 * t2 * t;
  const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  const dl = (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m)
    + (0.019993 - 0.000101 * t) * Math.sin(2 * dr * m)
    + 0.00029 * Math.sin(3 * dr * m);
  const longitude = ((l0 + dl) % 360 + 360) % 360;
  return Math.floor(longitude / 30);
}

function lunarMonth11(year) {
  const off = julianDay(31, 12, year) - 2415021;
  const k = Math.floor(off / SYNODIC_MONTH);
  let day = newMoonDay(k);
  if (sunLongitude(day - 0.5 - TIME_ZONE / 24) >= 9) day = newMoonDay(k - 1);
  return day;
}

function leapMonthOffset(month11) {
  const k = Math.floor(0.5 + (month11 - NEW_MOON_EPOCH) / SYNODIC_MONTH);
  let last = 0;
  let i = 1;
  let arc = sunLongitude(newMoonDay(k + i) - 0.5 - TIME_ZONE / 24);
  while (arc !== last && i < 14) {
    last = arc;
    i += 1;
    arc = sunLongitude(newMoonDay(k + i) - 0.5 - TIME_ZONE / 24);
  }
  return i - 1;
}

export function solarToLunar(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError('Ngày phải có định dạng YYYY-MM-DD');
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const dateUtc = new Date(Date.UTC(year, month - 1, day));
  if (dateUtc.getUTCFullYear() !== year || dateUtc.getUTCMonth() !== month - 1 || dateUtc.getUTCDate() !== day) {
    throw new RangeError('Ngày dương lịch không hợp lệ');
  }

  const dayNumber = julianDay(day, month, year);
  let k = Math.floor((dayNumber - NEW_MOON_EPOCH) / SYNODIC_MONTH);
  let monthStart = newMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = newMoonDay(k);
  let month11 = lunarMonth11(year);
  let nextMonth11 = month11;
  let lunarYear;
  if (month11 >= monthStart) {
    lunarYear = year;
    month11 = lunarMonth11(year - 1);
  } else {
    lunarYear = year + 1;
    nextMonth11 = lunarMonth11(year + 1);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - month11) / 29);
  let lunarMonth = diff + 11;
  let isLeapMonth = false;
  if (nextMonth11 - month11 > 365) {
    const leapOffset = leapMonthOffset(month11);
    if (diff >= leapOffset) {
      lunarMonth = diff + 10;
      if (diff === leapOffset) isLeapMonth = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeapMonth, timeZone: `GMT+${TIME_ZONE}` };
}

const lunarMonthName = lunar => `tháng ${lunar.month}${lunar.isLeapMonth ? ' nhuận' : ''}`;

function specialEvents(lunar, nextLunar, month, day) {
  const events = [];
  if (lunar.day === 1) {
    events.push({ type: 'lunar', title: `Mùng 1 ${lunarMonthName(lunar)}` });
  }
  if (lunar.day === 14 || lunar.day === 15) {
    events.push({ type: 'lunar', title: `Rằm ${lunarMonthName(lunar)}` });
  }
  if (nextLunar.month !== lunar.month || nextLunar.year !== lunar.year || nextLunar.isLeapMonth !== lunar.isLeapMonth) {
    events.push({ type: 'lunar', title: `Ngày cuối ${lunarMonthName(lunar)}` });
  }

  const solarEvents = {
    '1-1': [{ type: 'holiday', title: 'Tết Dương lịch' }],
    '3-8': [{ type: 'event', title: 'Ngày Quốc tế Phụ nữ' }],
    '4-30': [{ type: 'holiday', title: 'Ngày Giải phóng miền Nam' }],
    '5-1': [{ type: 'holiday', title: 'Ngày Quốc tế Lao động' }],
    '6-1': [{ type: 'event', title: 'Ngày Quốc tế Thiếu nhi' }],
    '9-2': [{ type: 'holiday', title: 'Quốc Khánh Việt Nam' }],
    '10-20': [{ type: 'event', title: 'Ngày Phụ nữ Việt Nam' }],
    '11-20': [{ type: 'event', title: 'Ngày Nhà giáo Việt Nam' }],
    '12-24': [{ type: 'event', title: 'Đêm Giáng Sinh' }],
    '12-25': [{ type: 'event', title: 'Lễ Giáng Sinh' }]
  };
  events.push(...(solarEvents[`${month}-${day}`] || []));

  if (!lunar.isLeapMonth && lunar.month === 1 && lunar.day <= 3) {
    events.push({ type: 'holiday', title: 'Tết Nguyên Đán' });
  }
  if (!lunar.isLeapMonth && lunar.month === 3 && lunar.day === 10) {
    events.push({ type: 'holiday', title: 'Giỗ Tổ Hùng Vương' });
  }
  if (!lunar.isLeapMonth && lunar.month === 7 && lunar.day === 15) {
    events.push({ type: 'event', title: 'Lễ Vu Lan' });
  }
  if (!lunar.isLeapMonth && lunar.month === 8 && lunar.day === 15) {
    events.push({ type: 'event', title: 'Tết Trung Thu' });
  }
  return events;
}

export function getCalendarDayInfo(date) {
  const lunar = solarToLunar(date);
  const [year, month, day] = date.split('-').map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  const nextLunar = solarToLunar(nextDate);
  const weekday = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return {
    lunar,
    weekday: weekday.split(' ').map(word => word.charAt(0).toLocaleUpperCase('vi-VN') + word.slice(1)).join(' '),
    events: specialEvents(lunar, nextLunar, month, day)
  };
}
