export const toSec=t=>{if(!t)return null;const[a,b=0,c=0]=t.split(':').map(Number);return a*3600+b*60+c};
// Nguồn tính toán duy nhất. Không làm tròn trung gian; chỉ làm tròn expectedTotal.
function calcShift(i){
  const errors=[],shiftHours=+i.shiftHours,interval=+i.interval,lateMinutes=i.lateEnabled?Math.max(0,+i.lateMinutes||0):0;
  if(![6,8,11,13].includes(shiftHours))errors.push('Ca làm phải là 6, 8, 11 hoặc 13 tiếng');
  if(!(interval>0))errors.push('Mốc đi trễ phải > 0');
  if(+i.lateMinutes<0)errors.push('Phút đi trễ không hợp lệ');
  if(+i.overtimeHours<0)errors.push('Giờ tăng ca không hợp lệ');
  if(errors.length)return{errors};
  const shiftType=i.shiftType||(shiftHours===13?'13-day':'8-day');
  const isSunday=i.workDate!=null&&new Date(`${i.workDate}T00:00:00Z`).getUTCDay()===0;
  const rates={
    '6-day':i.dailyRate6,
    '8-day':i.dailyRate,
    '8-night':i.dailyRateNight8,
    '11-day':i.dailyRate11Day,
    '11-night':isSunday?i.dailyRateSundayNight11:i.dailyRateNight11,
    '13-day':isSunday?i.dailyRateSunday13:i.dailyRate13
  };
  const configuredRate=rates[shiftType];
  const hourlyRate=Number(i.hourlyRate)||0;
  const shiftPay=i.payMode==='daily'
    ?configuredRate==null||!Number.isFinite(+configuredRate)?shiftHours*hourlyRate:+configuredRate
    :shiftHours*hourlyRate;
  const hourly=i.payMode==='daily'?shiftPay/shiftHours:+i.hourlyRate;
  const workFraction=i.halfDay?0.5:1,regularHours=shiftHours*workFraction,overtimeHours=+i.overtimeHours||0;
  const regularSec=regularHours*3600,overtimeSec=overtimeHours*3600,totalSec=regularSec+overtimeSec;
  const lateIntervals=Math.ceil(lateMinutes/interval),lateSec=lateMinutes*60;
  const latePenalty=lateIntervals*hourly*interval/60,basePay=shiftPay*workFraction;
  const overtimePay=overtimeHours*(+i.overtimeRate||0);
  const expectedTotal=Math.round(basePay+overtimePay+(i.allowance||0)+(i.bonus||0)-latePenalty-(i.otherDeduction||0)+(i.adjustment||0));
  return{errors,shiftHours,shiftType,halfDay:!!i.halfDay,lateMinutes,overtimeHours,totalSec,countedSec:totalSec,regularSec,overtimeSec,lateSec,lateIntervals,latePenaltyMinutes:lateIntervals*interval,earlySec:0,earlyIntervals:0,earlyPenaltyMinutes:0,hourly,basePay,overtimePay,latePenalty,earlyPenalty:0,expectedTotal};
}

export function calc(i){
  if(i.shiftHours!=null)return calcShift(i);
  const errors=[],std=i.stdH*3600;
  if(!(i.stdH>0))errors.push('Giờ công tiêu chuẩn phải > 0');
  if(!(i.interval>0))errors.push('Mốc đi trễ phải > 0');
  const s=toSec(i.start),e=toSec(i.end),sc=toSec(i.sched);
  if(s==null||e==null)errors.push('Thiếu giờ vào/ra');
  if(errors.length)return{errors};
  let span=e-s;
  if(span<=0){if(i.overnight)span+=86400;else errors.push('Giờ kết thúc trước giờ bắt đầu (bật "qua đêm" nếu là ca qua đêm)')}
  if(i.breakMin<0||i.breakMin*60>span)errors.push('Thời gian nghỉ không hợp lệ');
  if(errors.length)return{errors};
  const totalSec=span-i.breakMin*60;
  const lateSec=i.lateEnabled&&sc!=null?Math.max(0,s-sc):0;
  const scheduledEnd=sc==null?null:sc+std+i.breakMin*60;
  const actualEnd=i.overnight&&e<=s?e+86400:e;
  const earlySec=i.lateEnabled&&scheduledEnd!=null?Math.max(0,scheduledEnd-actualEnd):0;
  const countedSec=totalSec+lateSec+earlySec,regularSec=Math.min(countedSec,std),overtimeSec=Math.max(0,countedSec-std);
  const hourly=i.payMode==='daily'?i.dailyRate/i.stdH:i.hourlyRate;
  const basePay=i.payMode==='daily'?i.dailyRate*(i.shortRule==='full'?1:Math.min(regularSec/std,1)):regularSec/3600*hourly;
  const overtimePay=overtimeSec/3600*(i.overtimeRate||0);
  const lateIntervals=Math.ceil(lateSec/(i.interval*60));
  const earlyIntervals=Math.ceil(earlySec/(i.interval*60));
  const latePenalty=lateIntervals*hourly*i.interval/60;
  const earlyPenalty=earlyIntervals*hourly*i.interval/60;
  const expectedTotal=Math.round(basePay+overtimePay+(i.allowance||0)+(i.bonus||0)-latePenalty-earlyPenalty-(i.otherDeduction||0)+(i.adjustment||0));
  return{errors,totalSec,countedSec,regularSec,overtimeSec,lateSec,lateIntervals,latePenaltyMinutes:lateIntervals*i.interval,earlySec,earlyIntervals,earlyPenaltyMinutes:earlyIntervals*i.interval,hourly,basePay,overtimePay,latePenalty,earlyPenalty,expectedTotal};
}

export function countWorkCredits(records){
  return records.filter(record=>record.status==='work').reduce((credits,record)=>credits+(record.halfDay?0.5:1),0);
}

export function calculateAttendanceBonus(records,amount){
  return countWorkCredits(records)>=26?Number(amount)||0:0;
}
