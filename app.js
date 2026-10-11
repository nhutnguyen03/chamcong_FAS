import {calc,countWorkCredits,calculateAttendanceBonus} from './calculations.js';
import {getCalendarDayInfo} from './calendar.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const N=['attendance','payments','settings'];
const db=await new Promise((ok,ko)=>{const q=indexedDB.open('workpay',1);q.onupgradeneeded=()=>N.forEach(n=>q.result.createObjectStore(n,{keyPath:'id'}));q.onsuccess=()=>ok(q.result);q.onerror=()=>ko(q.error)});
const rq=r=>new Promise((ok,ko)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)});
const st=(s,m='readonly')=>db.transaction(s,m).objectStore(s);
const all=s=>rq(st(s).getAll()),put=(s,o)=>rq(st(s,'readwrite').put(o)),del=(s,id)=>rq(st(s,'readwrite').delete(id));
const bulk=(data,clear)=>{const t=db.transaction(N,'readwrite');N.forEach(n=>{const o=t.objectStore(n);if(clear)o.clear();(data[n]||[]).forEach(x=>o.put(x))});return new Promise((ok,ko)=>{t.oncomplete=ok;t.onerror=t.onabort=()=>ko(t.error)})};
const DEF={id:'default',payMode:'daily',dailyRate:255000,dailyRate13:450000,dailyRate6:null,dailyRate11Day:null,dailyRateNight8:309500,dailyRateNight11:426500,dailyRateSunday13:832000,dailyRateSundayNight11:758500,attendanceBonus:250000,bhxhAmount:557550,hourlyRate:35000,overtimeRate:39000,stdH:8,breakMin:60,interval:30,sched:'08:00:00',lateEnabled:true,shortRule:'prorate'};
const connectionStatus=$('#connectionStatus');
const pwaInstall=$('#pwaInstall'),pwaIosInstall=$('#pwaIosInstall'),pwaInstallLater=$('#pwaInstallLater');
const pwaUpdate=$('#pwaUpdate'),pwaUpdateMessage=$('#pwaUpdateMessage');
const pwaIosGuide=$('#pwaIosGuide');
let deferredInstallPrompt=null,pwaRegistration=null,reloadAfterUpdate=false,pwaListenersAttached=false;
let previousOnlineState=navigator.onLine,connectionMessageTimer,installDismissedThisSession=false;
try{installDismissedThisSession=sessionStorage.getItem('workpay-install-dismissed')==='1'}catch(error){console.warn('Không thể đọc trạng thái nhắc cài WorkPay:',error)}
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIosSafari=()=>{
  const ua=navigator.userAgent;
  const ios=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  return ios&&/Safari/i.test(ua)&&!/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo)/i.test(ua);
};
function updateInstallButtons(){
  const canInstall=!isStandalone()&&!installDismissedThisSession;
  pwaInstall.hidden=!(canInstall&&deferredInstallPrompt);
  pwaIosInstall.hidden=!(canInstall&&!deferredInstallPrompt&&isIosSafari());
  pwaInstallLater.hidden=!(pwaInstall.hidden===false||pwaIosInstall.hidden===false);
}
function setConnectionStatus(online,reconnected=false){
  clearTimeout(connectionMessageTimer);
  connectionStatus.textContent=online?(reconnected?'✅ Đã kết nối Internet':'🟢 Đang online'):'🟠 Bạn đang offline - dữ liệu vẫn được lưu trên thiết bị.';
  connectionStatus.classList.toggle('is-offline',!online);
  if(online&&reconnected)connectionMessageTimer=setTimeout(()=>{connectionStatus.textContent='🟢 Đang online'},3000);
}
window.addEventListener('offline',()=>{
  if(previousOnlineState===false)return;
  previousOnlineState=false;
  setConnectionStatus(false);
});
window.addEventListener('online',()=>{
  if(previousOnlineState===true)return;
  previousOnlineState=true;
  setConnectionStatus(true,true);
  pwaRegistration?.update().catch(error=>console.warn('Không thể kiểm tra cập nhật WorkPay:',error));
});
setConnectionStatus(navigator.onLine);
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  updateInstallButtons();
});
window.addEventListener('appinstalled',()=>{
  deferredInstallPrompt=null;
  installDismissedThisSession=true;
  updateInstallButtons();
});
pwaInstall.addEventListener('click',async()=>{
  if(!deferredInstallPrompt)return;
  const prompt=deferredInstallPrompt;
  deferredInstallPrompt=null;
  updateInstallButtons();
  try{
    await prompt.prompt();
    await prompt.userChoice;
  }catch(error){
    console.warn('Không thể mở lời nhắc cài WorkPay:',error);
  }finally{
    updateInstallButtons();
  }
});
pwaIosInstall.addEventListener('click',()=>pwaIosGuide.showModal());
$('#pwaIosClose').addEventListener('click',()=>pwaIosGuide.close());
pwaIosGuide.addEventListener('click',event=>{if(event.target===pwaIosGuide)pwaIosGuide.close()});
pwaInstallLater.addEventListener('click',()=>{
  installDismissedThisSession=true;
  try{sessionStorage.setItem('workpay-install-dismissed','1')}catch(error){console.warn('Không thể lưu trạng thái nhắc cài WorkPay:',error)}
  updateInstallButtons();
});
pwaUpdate.addEventListener('click',()=>{
  const waitingWorker=pwaRegistration?.waiting;
  if(!waitingWorker)return;
  reloadAfterUpdate=true;
  waitingWorker.postMessage({type:'SKIP_WAITING'});
});
function showPwaUpdateIfReady(){
  const updateReady=Boolean(pwaRegistration?.waiting&&navigator.serviceWorker.controller);
  pwaUpdate.hidden=!updateReady;
  pwaUpdateMessage.hidden=!updateReady;
}
async function registerPwa(){
  if(!('serviceWorker'in navigator))return;
  try{
    const workerUrl=new URL('./service-worker.js',document.baseURI);
    const existingRegistration=await navigator.serviceWorker.getRegistration(document.baseURI);
    pwaRegistration=existingRegistration||await navigator.serviceWorker.register(workerUrl);
    if(!pwaListenersAttached){
      pwaListenersAttached=true;
      navigator.serviceWorker.addEventListener('controllerchange',()=>{
        if(reloadAfterUpdate)location.reload();
        showPwaUpdateIfReady();
      });
      pwaRegistration.addEventListener('updatefound',()=>{
        const worker=pwaRegistration.installing;
        if(!worker)return;
        worker.addEventListener('statechange',showPwaUpdateIfReady);
      });
    }
    showPwaUpdateIfReady();
    if(navigator.onLine){
      try{await pwaRegistration.update()}catch(error){console.warn('Không thể kiểm tra cập nhật WorkPay:',error)}
    }
  }catch(error){
    console.warn('Không thể đăng ký Service Worker WorkPay:',error);
  }
}
window.addEventListener('load',registerPwa,{once:true});
if(document.readyState==='complete')registerPwa();
const OPTIONAL_RATES=new Set(['dailyRate6','dailyRate11Day']);
const NUM=[['dailyRate','Lương ngày ca 8 tiếng (ngày)'],['dailyRate13','Lương ngày ca 13 tiếng (6h-19h)'],['dailyRate6','Lương ca 6 tiếng (để trống = tính theo giờ)'],['dailyRate11Day','Lương ca 11 tiếng ban ngày (để trống = tính theo giờ)'],['dailyRateNight8','Lương đêm ca 8 tiếng'],['dailyRateNight11','Lương đêm ca 11 tiếng (19h-6h)'],['dailyRateSunday13','Chủ nhật ca ngày 13 tiếng'],['dailyRateSundayNight11','Chủ nhật ca đêm 11 tiếng'],['attendanceBonus','Chuyên cần (đủ 26 công/tháng)'],['bhxhAmount','BHXH mỗi tháng'],['hourlyRate','Lương giờ'],['overtimeRate','Tăng ca/giờ'],['stdH','Giờ công tiêu chuẩn'],['breakMin','Nghỉ (phút)'],['interval','Mốc đi trễ (phút)']];
const SETTING_GROUPS=[
  {title:'Mức lương theo ca',keys:['dailyRate','dailyRate13','dailyRate6','dailyRate11Day','dailyRateNight8','dailyRateNight11','dailyRateSunday13','dailyRateSundayNight11']},
  {title:'Phụ cấp và các khoản cố định',keys:['attendanceBonus','bhxhAmount','hourlyRate','overtimeRate']},
  {title:'Quy tắc chấm công',keys:['stdH','breakMin','interval']}
];
const hourOptions=Array.from({length:24},(_,i)=>`<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`).join('');
const minuteOptions=Array.from({length:60},(_,i)=>`<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`).join('');
const timeControl=id=>`<div class="time-control"><select id="${id}_hour" aria-label="Giờ"><option value="">Giờ</option>${hourOptions}</select><span>:</span><select id="${id}_minute" aria-label="Phút"><option value="">Phút</option>${minuteOptions}</select></div>`;
const readTime=id=>{const h=$('#'+id+'_hour').value,m=$('#'+id+'_minute').value;return h&&m?`${h}:${m}:00`:''};
const setTime=(id,value)=>{const match=String(value||'').match(/^(\d{2}):(\d{2})/);$('#'+id+'_hour').value=match?match[1]:'';$('#'+id+'_minute').value=match?match[2]:''};
const fields=p=>SETTING_GROUPS.map((group,index)=>`<fieldset class="settings-group"><legend>${group.title}</legend><div class="settings-fields">${index===0?`<label>Phương thức tính lương<select id=${p}payMode><option value=daily>Lương ngày</option><option value=hourly>Lương giờ</option></select></label>`:''}${NUM.filter(([key])=>group.keys.includes(key)).map(([key,label])=>`<label>${label}<input type=number step=any min=0 id=${p}${key}></label>`).join('')}${index===2?`<label>Giờ bắt đầu theo lịch${timeControl(p+'sched')}</label><label class="check-field"><input type=checkbox id=${p}lateEnabled> Tính trễ/về sớm theo mốc</label><label>Quy tắc thiếu giờ<select id=${p}shortRule><option value=prorate>Theo tỷ lệ</option><option value=full>Trả đủ ngày</option></select></label>`:''}</div></fieldset>`).join('');
const keys=['payMode','sched','shortRule'];
const get=p=>({...Object.fromEntries(keys.map(k=>[k,k==='sched'?readTime(p+k):$('#'+p+k).value])),...Object.fromEntries(NUM.map(([k])=>[k,OPTIONAL_RATES.has(k)&&!$('#'+p+k).value.trim()?null:+$('#'+p+k).value])),lateEnabled:$('#'+p+'lateEnabled').checked});
const fill=(p,o)=>{keys.forEach(k=>k==='sched'?setTime(p+k,o[k]):$('#'+p+k).value=o[k]);NUM.forEach(([k])=>$('#'+p+k).value=o[k]??'');$('#'+p+'lateEnabled').checked=o.lateEnabled};
$('#sf').innerHTML=fields('s_');
updateInstallButtons();
const supportDialog=$('#supportDlg'),supportToast=$('#supportToast');
let supportToastTimer;
const showSupportToast=message=>{supportToast.textContent=message;supportToast.hidden=false;clearTimeout(supportToastTimer);supportToastTimer=setTimeout(()=>{supportToast.hidden=true},2000)};
$('#supportOpen').addEventListener('click',()=>supportDialog.showModal());
$('#supportClose').addEventListener('click',()=>supportDialog.close());
supportDialog.addEventListener('click',event=>{if(event.target===supportDialog)supportDialog.close()});
supportDialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();supportDialog.close()}});
supportDialog.querySelectorAll('.support-method').forEach(card=>{
  card.addEventListener('click',event=>{
    if(event.target.closest('button, .support-qr'))return;
    card.querySelector('.support-qr-toggle').click();
  });
});
supportDialog.querySelectorAll('.support-qr-toggle').forEach(button=>button.addEventListener('click',()=>{
  const qr=$('#'+button.getAttribute('aria-controls'));
  const show=qr.hidden;
  qr.hidden=!show;
  button.setAttribute('aria-expanded',String(show));
  button.textContent=show?'Ẩn QR':'Xem QR';
}));
supportDialog.querySelectorAll('[data-hide]').forEach(button=>button.addEventListener('click',()=>{
  const qr=$('#'+button.dataset.hide);
  qr.hidden=true;
  supportDialog.querySelector(`[aria-controls="${button.dataset.hide}"]`).setAttribute('aria-expanded','false');
  supportDialog.querySelector(`[aria-controls="${button.dataset.hide}"]`).textContent='Xem QR';
}));
supportDialog.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  const value=button.dataset.copy;
  try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
    else{
      const input=document.createElement('textarea');
      input.value=value;
      input.setAttribute('readonly','');
      input.style.position='fixed';
      input.style.opacity='0';
      document.body.append(input);
      input.select();
      const copied=document.execCommand('copy');
      input.remove();
      if(!copied)throw new Error('Clipboard copy was rejected');
    }
    showSupportToast(button.dataset.copyLabel==='số MoMo'?'Đã sao chép số MoMo!':'Đã sao chép số tài khoản');
  }catch(error){
    console.error('Không thể sao chép thông tin ủng hộ:',error);
    showSupportToast('Không thể sao chép. Vui lòng thử lại.');
  }
}));
const money=n=>Math.round(n||0).toLocaleString('vi-VN')+' ₫',hr=s=>((s||0)/3600).toFixed(2);
const formatDate=d=>{const[y,m,day]=String(d||'').split('-');return y&&m&&day?`${day}-${m}-${y}`:d};
const shiftLabel=(type,hours)=>({ '5-day':'Ca 5 tiếng','6-day':'Ca 6 tiếng','8-day':'Ca 8 tiếng (ngày)','8-night':'Ca 8 tiếng (đêm)','11-day':'Ca 11 tiếng (ngày)','11-night':'Ca 11 tiếng (đêm)','13-day':'Ca 13 tiếng (6h-19h)' }[type]||`Ca ${hours} tiếng`);
const shiftOptions=Array.from($('#m_shiftType').options,option=>({value:option.value,label:option.textContent}));
const isSundayDate=date=>Boolean(date)&&new Date(`${date}T00:00:00Z`).getUTCDay()===0;
function configuredShiftRate(type,settings,date){
  const hours=Number(type.split('-')[0]),sunday=isSundayDate(date),rateKey=type==='13-day'?(sunday?'dailyRateSunday13':'dailyRate13'):type==='11-night'?(sunday?'dailyRateSundayNight11':'dailyRateNight11'):({'5-day':null,'6-day':'dailyRate6','8-day':'dailyRate','8-night':'dailyRateNight8','11-day':'dailyRate11Day'}[type]);
  if(settings.payMode!=='daily')return Number(settings.hourlyRate)*hours;
  const configured=rateKey?settings[rateKey]:null;
  return configured==null||!Number.isFinite(Number(configured))?Number(settings.hourlyRate)*hours:Number(configured);
}
function syncShiftOptions(date,preferredShift){
  const sunday=isSundayDate(date)&&$('#m_status').value==='work',available=sunday?['13-day','11-night'].map(type=>shiftOptions.find(option=>option.value===type)):shiftOptions,select=$('#m_shiftType'),settings=get('s_'),previous=preferredShift??select.value;
  select.innerHTML=available.map(option=>`<option value="${option.value}">${option.label}${settings.payMode==='daily'?` · ${money(configuredShiftRate(option.value,settings,date))}${sunday?' (Chủ nhật)':''}`:''}</option>`).join('');
  select.value=available.some(option=>option.value===previous)?previous:(sunday?'':'8-day');
}
function renderOvertimeChoices(value){
  const selected=Number(value)||0,choices=[0,1,2,3,4,5];
  if(!choices.includes(selected)&&selected>0)choices.push(selected);
  $('#m_overtimeChoices').innerHTML=choices.map(hours=>`<button type="button" class="overtime-choice${hours===selected?' selected':''}" data-overtime-hours="${hours}" aria-pressed="${hours===selected}">${hours===0?'0':`${hours} giờ`}</button>`).join('');
}
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());
let S=DEF,recs=[],pays=[],monthlySettings=new Map(),ym=today.slice(0,7),year=+today.slice(0,4),cur=null;
const toast=(m)=>{const t=$('#toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',2500)};
async function load(){recs=await all('attendance');pays=await all('payments');const settings=await all('settings');S={...DEF,...(settings.find(x=>x.id==='default')||{})};monthlySettings=new Map(settings.filter(x=>x.id.startsWith('payroll:')).map(x=>[x.id,x]));render()}
const monthRecs=()=>recs.filter(r=>r.workDate.startsWith(ym)).sort((a,b)=>a.workDate<b.workDate?-1:1);
const equivalentWorkDays=countWorkCredits;
const attendanceBonusFor=records=>calculateAttendanceBonus(records,S.attendanceBonus);
const bhxhEnabledFor=month=>monthlySettings.get(`payroll:${month}`)?.bhxhEnabled===true;
const bhxhFor=month=>monthlySettings.get(`payroll:${month}`)?.bhxhEnabled?Number(S.bhxhAmount)||0:0;
function render(){renderQuickAttendance();renderCal();renderPay();renderYear();fill('s_',S);conv()}
function renderQuickAttendance(){const record=recs.find(item=>item.workDate===today);$('#quickAttendanceDate').textContent=formatDate(today);$('#quickAttendanceStatus').textContent=record?`${record.status==='work'?'Đã chấm công':record.status==='unpaid'?'Đã ghi nhận nghỉ không lương':record.status==='paid'?'Đã ghi nhận nghỉ có lương':'Đã ghi nhận nghỉ lễ'}${record.shiftType?` · ${shiftLabel(record.shiftType,record.shiftHours)}`:''} · ${money(record.expectedTotal)}`:'Chưa có chấm công hôm nay';$('#quickAttendanceButton').textContent=record?'Sửa chấm công':'Chấm công hôm nay'}
function renderCal(){const[y,m]=ym.split('-').map(Number);$('#ml').textContent=`Tháng ${m}/${y}`;const first=new Date(Date.UTC(y,m-1,1)),off=(first.getUTCDay()+6)%7;let h=['T2','T3','T4','T5','T6','T7','CN'].map(d=>`<div class=h>${d}</div>`).join('');
for(let i=0;i<42;i++){const d=new Date(Date.UTC(y,m-1,1-off+i)),ds=d.toISOString().slice(0,10),r=recs.find(x=>x.workDate===ds),events=getCalendarDayInfo(ds).events,types=[...new Set(events.map(event=>event.type))],isSunday=d.getUTCDay()===0,dayEvents=events.map(event=>event.title).join(' · ');const cls=['day',d.getUTCMonth()!==m-1&&'o',ds===today&&'t',ds===cur&&'selected',isSunday&&'sunday',r&&(r.status==='work'?(r.lateIntervals||r.earlyIntervals?'l':'w'):r.status==='unpaid'?'u':'v'),r?.note&&'has-note'].filter(Boolean).join(' '),accessibleLabel=[formatDate(ds),isSunday?'Chủ nhật':'',r?.status==='work'?'Đã chấm công':r?'Đã ghi nhận ngày nghỉ':'Chưa chấm công',r?.note?'Có ghi chú':'',dayEvents].filter(Boolean).join('. ');
h+=`<button type="button" class="${cls}" data-d="${ds}" aria-label="${esc(accessibleLabel)}" aria-pressed="${ds===cur}" title="${esc(dayEvents)}"><span class="day-top"><b>${d.getUTCDate()}</b><span class="event-dots" aria-hidden="true">${types.map(type=>`<i class="event-dot ${type}"></i>`).join('')}</span></span>${r?`<span>${r.status==='work'?hr(r.totalSec)+'h':'nghỉ'}</span><span>${money(r.expectedTotal)}${r.lateIntervals||r.earlyIntervals?' ⏰':''}</span>`:''}</button>`}
$('#grid').innerHTML=h}
function renderPay(){const R=monthRecs(),sum=k=>R.reduce((a,r)=>a+(r[k]||0),0),attendanceBonus=attendanceBonusFor(R),bhxh=bhxhFor(ym),exp=sum('expectedTotal')+attendanceBonus-bhxh,P=pays.filter(p=>p.payrollMonth===ym),got=P.reduce((a,p)=>a+p.amount,0),diff=got-exp;
const msg=diff<0?'Tiền thực nhận thấp hơn lương dự kiến':diff>0?'Tiền thực nhận cao hơn lương dự kiến':'Đã khớp';
$('#bhxhEnabled').checked=bhxhEnabledFor(ym);
$('#bhxhAmountLabel').textContent=money(S.bhxhAmount);
$('#stats').innerHTML=[['Lương dự kiến',money(exp)],['Chuyên cần',money(attendanceBonus)],['Trừ BHXH',money(bhxh)],['Thực nhận',money(got)],['Chênh lệch',money(diff)+' – '+msg],['Số công quy đổi',equivalentWorkDays(R)],['Giờ làm',hr(sum('totalSec'))],['Giờ thường',hr(sum('regularSec'))],['Giờ tăng ca',hr(sum('overtimeSec'))],['Tiền tăng ca',money(sum('overtimePay'))],['Khấu trừ trễ/về sớm',money(sum('latePenalty')+sum('earlyPenalty'))+' ('+Math.round(sum('latePenaltyMinutes')+sum('earlyPenaltyMinutes'))+' phút)']].map(([a,b])=>`<div>${a}<b>${b}</b></div>`).join('');
$('#tbl').innerHTML='<tr><th>Ngày<th>Ca<th>Công<th>Trễ(phút)<th>Mốc trễ<th>Về sớm(phút)<th>TC(giờ)<th>Lương ca<th>Tiền TC<th>Trừ trễ<th>Trừ sớm<th>Tổng</tr>'+R.map(r=>{const shift=r.shiftHours?shiftLabel(r.shiftType||(r.shiftHours===13?'13-day':'8-day'),r.shiftHours):r.start?`${r.start}–${r.end||''}`:'—',work=r.halfDay?'Nửa ngày':r.shiftHours?'Đủ ca':'—',late=r.lateMinutes??Math.round((r.lateSec||0)/60),early=Math.round((r.earlySec||0)/60),ot=r.overtimeHours??((r.overtimeSec||0)/3600);return`<tr data-d="${r.workDate}"><td>${formatDate(r.workDate)}<td>${shift}<td>${work}<td>${late}<td>${r.lateIntervals||0}<td>${early}<td>${(+ot).toFixed(2)}<td>${money(r.basePay)}<td>${money(r.overtimePay)}<td>${money(r.latePenalty)}<td>${money(r.earlyPenalty)}<td>${money(r.expectedTotal)}</tr>`}).join('');
$('#ptbl').innerHTML=P.map(p=>`<tr><td>${formatDate(p.paymentDate)}<td>${esc(p.type)} ${esc(p.note)}<td>${money(p.amount)}<td><button class="d np" data-pd="${p.id}">Xóa</button></tr>`).join('')||'<tr><td>Chưa có khoản nào</tr>';
renderIncomeDashboard()}
const safeNumber=value=>Number.isFinite(Number(value))?Number(value):0;
const sumField=(records,key)=>records.reduce((total,record)=>total+safeNumber(record[key]),0);
const signedNumber=(value,digits=2)=>`${value>0?'+':''}${value.toLocaleString('vi-VN',{maximumFractionDigits:digits})}`;
const monthOffset=(key,offset)=>{const[y,m]=key.split('-').map(Number);return new Date(Date.UTC(y,m-1+offset,1)).toISOString().slice(0,7)};
function incomeMonthStats(key){
  const records=recs.filter(record=>typeof record.workDate==='string'&&record.workDate.startsWith(key));
  const payments=pays.filter(payment=>payment.payrollMonth===key);
  const bonus=attendanceBonusFor(records),bhxh=bhxhFor(key);
  return{key,records,payments,credits:equivalentWorkDays(records),hours:sumField(records,'totalSec')/3600,overtime:sumField(records,'overtimeSec')/3600,expected:sumField(records,'expectedTotal')+bonus-bhxh,received:payments.reduce((total,payment)=>total+safeNumber(payment.amount),0),bonus,bhxh};
}
function signedMoney(value){return`${value>0?'+':''}${money(value)}`}
function renderIncomeDashboard(){
  const current=incomeMonthStats(ym),previous=incomeMonthStats(monthOffset(ym,-1));
  const monthName=`Tháng ${Number(ym.slice(5,7))} năm ${ym.slice(0,4)}`;
  $('#incomeMonthPicker').value=ym;
  $('#incomeMonthLabel').textContent=`${monthName}${ym===today.slice(0,7)?' · Tháng chưa kết thúc':''}`;
  const average=current.credits?current.expected/current.credits:null;
  $('#incomeStats').innerHTML=[
    ['Lương ước tính',money(current.expected),current.records.length?'Từ chấm công, chuyên cần và BHXH đã chọn':'Chưa có bản ghi chấm công'],
    ['Tiền đã nhận',money(current.received),current.payments.length?`${current.payments.length} khoản đã ghi nhận`:'Chưa ghi nhận khoản nhận tiền'],
    ['Công quy đổi',`${current.credits.toLocaleString('vi-VN')} công`,`${current.records.length} ngày có bản ghi`],
    ['Tăng ca',`${current.overtime.toLocaleString('vi-VN',{maximumFractionDigits:2})} giờ`,`${money(sumField(current.records,'overtimePay'))} tiền tăng ca`],
    ['Ước tính trung bình/công',average===null?'—':money(average),average===null?'Chưa có công để tính trung bình':'Lương ước tính chia cho công quy đổi']
  ].map(([label,value,note])=>`<div>${label}<b>${value}</b><small>${note}</small></div>`).join('');
  const compareMetric=(label,key,available)=>{if(!available(current)||!available(previous))return`<div class="income-compare-item"><b>${label}</b><span>Chưa đủ dữ liệu để so sánh hai tháng.</span></div>`;const delta=current[key]-previous[key],percent=previous[key]===0?null:delta/Math.abs(previous[key])*100;return`<div class="income-compare-item"><b>${label}</b><span>Chênh lệch hiện tại: <strong>${key==='expected'||key==='received'?signedMoney(delta):`${signedNumber(delta)} ${key==='credits'?'công':''}`}</strong>${percent===null?' · Không thể tính tỷ lệ vì tháng trước bằng 0':` · ${signedNumber(percent,1)}% so với tháng trước`}</span><small>${money(key==='expected'?current.expected:current.received)} hiện tại · ${money(key==='expected'?previous.expected:previous.received)} tháng trước</small></div>`};
  $('#incomeComparison').innerHTML=`<div class="income-comparison-heading"><b>So với ${Number(previous.key.slice(5,7))}/${previous.key.slice(0,4)}</b><span>${ym===today.slice(0,7)?'Số liệu tháng hiện tại còn tạm tính, chưa nên xem là xu hướng cuối tháng.':'So sánh theo số liệu đã ghi nhận trong từng tháng.'}</span></div><div class="income-comparison-grid">${compareMetric('Lương ước tính','expected',month=>month.records.length>0)}${compareMetric('Tiền đã nhận','received',month=>month.payments.length>0)}</div>`;
  const breakdown=[
    ['Lương ca',sumField(current.records,'basePay'),'plus'],['Tiền tăng ca',sumField(current.records,'overtimePay'),'plus'],['Phụ cấp',sumField(current.records,'allowance'),'plus'],['Thưởng trên bản ghi',sumField(current.records,'bonus'),'plus'],['Thưởng chuyên cần',current.bonus,'plus'],['Trừ đi trễ/về sớm',-sumField(current.records,'latePenalty')-sumField(current.records,'earlyPenalty'),'minus'],['Khấu trừ khác',-sumField(current.records,'otherDeduction'),'minus'],['Điều chỉnh',sumField(current.records,'adjustment'),'signed'],['BHXH',-current.bhxh,'minus']
  ];
  $('#incomeBreakdown').innerHTML=current.records.length||current.bhxh?breakdown.map(([label,value,kind])=>`<div class="income-breakdown-item"><span>${label}</span><b class="${kind}">${signedMoney(value)}</b></div>`).join(''):'<p class="income-empty">Chưa có dữ liệu chấm công cho tháng này.</p>';
  const workRecords=month=>month.records.filter(record=>record.status==='work');
  const countMatching=(records,predicate)=>records.filter(predicate).length;
  const nightCount=month=>countMatching(workRecords(month),record=>record.shiftType==='8-night'||record.shiftType==='11-night');
  const sundayPremiumCount=month=>countMatching(workRecords(month),record=>record.payMode==='daily'&&(record.shiftType==='13-day'||record.shiftType==='11-night')&&typeof record.workDate==='string'&&new Date(`${record.workDate}T00:00:00Z`).getUTCDay()===0);
  const changeLines=[
    ['Công quy đổi',current.credits-previous.credits,'công'],
    ['Ca làm đã ghi nhận',workRecords(current).length-workRecords(previous).length,'ca'],
    ['Ca đêm',nightCount(current)-nightCount(previous),'ca'],
    ['Ca có thể áp dụng đơn giá Chủ nhật',sundayPremiumCount(current)-sundayPremiumCount(previous),'ca'],
    ['Giờ tăng ca',current.overtime-previous.overtime,'giờ']
  ].filter(([,delta])=>Math.abs(delta)>0.0001).map(([label,delta,unit])=>`<li>${label}: <b>${signedNumber(delta)} ${unit}</b></li>`);
  const payComponents=[
    ['Lương ca','basePay'],['Tiền tăng ca','overtimePay'],['Phụ cấp','allowance'],['Thưởng trên bản ghi','bonus'],['Khấu trừ đi trễ/về sớm',null],['Khấu trừ khác','otherDeduction'],['Điều chỉnh','adjustment']
  ];
  for(const[label,key]of payComponents){
    const amount=key?sumField(current.records,key)-sumField(previous.records,key):(sumField(current.records,'latePenalty')+sumField(current.records,'earlyPenalty'))-(sumField(previous.records,'latePenalty')+sumField(previous.records,'earlyPenalty'));
    if(Math.abs(amount)>0.5)changeLines.push(`<li>${label}: <b>${signedMoney(key==='otherDeduction'||key===null?-amount:amount)}</b> thay đổi theo bản ghi.</li>`);
  }
  if(current.bonus!==previous.bonus)changeLines.push(`<li>Thưởng chuyên cần: <b>${signedMoney(current.bonus-previous.bonus)}</b>.</li>`);
  if(current.bhxh!==previous.bhxh)changeLines.push(`<li>BHXH được trừ: <b>${signedMoney(previous.bhxh-current.bhxh)}</b> thay đổi.</li>`);
  $('#incomeChanges').innerHTML=!current.records.length||!previous.records.length?'<p class="income-empty">Cần có bản ghi chấm công ở cả hai tháng để so sánh thay đổi.</p>':changeLines.length?`<ul>${changeLines.join('')}</ul>`:'<p>Chưa thấy thay đổi trong các chỉ số công, ca và thành phần lương đã lưu.</p>';
  renderIncomeChart();
}
function renderIncomeChart(){
  const range=$('#incomeChartRange').value,metric=$('#incomeChartMetric').value;
  const months=range==='year'?Array.from({length:12},(_,index)=>`${year}-${String(index+1).padStart(2,'0')}`):Array.from({length:Number(range)},(_,index)=>monthOffset(ym,index-Number(range)+1));
  const titles={expected:'Lương ước tính',received:'Tiền đã nhận',days:'Ngày công quy đổi',overtime:'Giờ tăng ca'};
  const valid=month=>metric==='received'?month.payments.length>0:month.records.length>0;
  const points=months.map(key=>{const stats=incomeMonthStats(key);return{key,label:`T${Number(key.slice(5,7))}`,value:stats[metric==='days'?'credits':metric]??0,available:valid(stats)}});
  const availablePoints=points.filter(point=>point.available);
  const status=$('#incomeChartStatus');
  if(!availablePoints.length){status.textContent=`Chưa có dữ liệu ${titles[metric].toLowerCase()} trong ${range==='year'?`năm ${year}`:`khoảng ${range} tháng đang chọn`}.`;$('#incomeChart').innerHTML='';return}
  status.textContent=`${titles[metric]} · ${range==='year'?`năm ${year}`:`${range} tháng tính đến ${Number(ym.slice(5,7))}/${ym.slice(0,4)}`}. Tháng chưa có dữ liệu không được tính là số 0.`;
  const width=640,height=250,left=24,right=12,top=22,bottom=34,plotHeight=height-top-bottom,plotWidth=width-left-right;
  const values=availablePoints.map(point=>point.value),max=Math.max(0,...values),min=Math.min(0,...values),spread=max-min||1,zeroY=top+plotHeight*max/spread,slot=plotWidth/points.length,barWidth=Math.min(34,slot*.58);
  const grid=Array.from({length:3},(_,index)=>{const y=top+plotHeight*index/2;return`<line x1="${left}" y1="${y}" x2="${width-right}" y2="${y}" class="income-chart-grid"/>`}).join('');
  const bars=points.map((point,index)=>{const center=left+slot*(index+.5);if(!point.available)return`<text x="${center}" y="${height-bottom+15}" text-anchor="middle" class="income-chart-axis" aria-label="${point.key}: chưa có dữ liệu">${point.label}*</text>`;const barHeight=Math.abs(point.value)*plotHeight/spread,y=point.value>=0?zeroY-barHeight:zeroY,label=metric==='expected'||metric==='received'?compactMoney(point.value):point.value.toLocaleString('vi-VN',{maximumFractionDigits:1}),labelY=point.value>=0?Math.max(top+10,y-5):Math.min(height-bottom-3,y+barHeight+13);return`<rect x="${center-barWidth/2}" y="${y}" width="${barWidth}" height="${Math.max(barHeight,1)}" rx="3" class="income-chart-bar"><title>${point.key} · ${titles[metric]}: ${metric==='expected'||metric==='received'?money(point.value):`${point.value.toLocaleString('vi-VN',{maximumFractionDigits:2})} ${metric==='days'?'công':'giờ'}`}</title></rect><text x="${center}" y="${labelY}" text-anchor="middle" class="income-chart-value">${label}</text><text x="${center}" y="${height-bottom+15}" text-anchor="middle" class="income-chart-axis">${point.label}</text>`}).join('');
  $('#incomeChart').innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Biểu đồ ${titles[metric].toLowerCase()} theo tháng">${grid}<line x1="${left}" y1="${zeroY}" x2="${width-right}" y2="${zeroY}" class="income-chart-zero"/>${bars}</svg><small>* Tháng chưa có dữ liệu cho chỉ số đã chọn.</small>`;
}
function renderYear(){
  $('#yearInput').value=year;
  const months=Array.from({length:12},(_,i)=>{
    const month=String(i+1).padStart(2,'0'),key=`${year}-${month}`,R=recs.filter(r=>r.workDate.startsWith(key)),P=pays.filter(p=>p.payrollMonth===key);
    const sum=k=>R.reduce((a,r)=>a+(Number(r[k])||0),0),days=equivalentWorkDays(R),hours=sum('totalSec')/3600,overtime=sum('overtimeSec')/3600,attendanceBonus=attendanceBonusFor(R),bhxh=bhxhFor(key);
    return{key,month:i+1,records:R.length,days,hours,overtime,average:days?hours/days:0,attendanceBonus,bhxh,expected:sum('expectedTotal')+attendanceBonus-bhxh,received:P.reduce((a,p)=>a+(Number(p.amount)||0),0)};
  });
  const totalHours=months.reduce((a,m)=>a+m.hours,0),totalOvertime=months.reduce((a,m)=>a+m.overtime,0),totalDays=months.reduce((a,m)=>a+m.days,0),totalBonus=months.reduce((a,m)=>a+m.attendanceBonus,0),totalBhxh=months.reduce((a,m)=>a+m.bhxh,0),totalExpected=months.reduce((a,m)=>a+m.expected,0),totalReceived=months.reduce((a,m)=>a+m.received,0),worked=months.filter(m=>m.days>0);
  const extrema=(fn,pick)=>{if(!worked.length)return'—';const value=pick(...worked.map(fn));return worked.filter(m=>fn(m)===value).map(m=>`T${m.month}`).join(', ')};
  $('#yearStats').innerHTML=[
    ['Tổng lương dự kiến',money(totalExpected)],['Tổng chuyên cần',money(totalBonus)],['Tổng trừ BHXH',money(totalBhxh)],['Tổng thực nhận',money(totalReceived)],['Số ngày làm quy đổi',`${totalDays.toLocaleString('vi-VN')} công`],
    ['Tổng giờ làm',`${totalHours.toFixed(2)} giờ`],['Tổng giờ tăng ca',`${totalOvertime.toFixed(2)} giờ`],['Giờ làm TB/tháng',worked.length?`${(totalHours/worked.length).toFixed(2)} giờ`:'—'],
    ['Tháng nhiều công nhất',extrema(m=>m.days,Math.max)],['Tháng ít công nhất',worked.length<2?'—':extrema(m=>m.days,Math.min)]
  ].map(([label,value],i)=>`<div>${label}<b>${value}</b>${i===7?`<small>Trung bình trên ${worked.length} tháng có ngày làm</small>`:''}${i===8||i===9?'<small>Trong các tháng có ngày làm</small>':''}</div>`).join('');
  const max=Math.max(0,...months.flatMap(m=>[m.expected,m.received])),min=Math.min(0,...months.flatMap(m=>[m.expected,m.received])),spread=max-min,range=spread||1,chartW=480,chartH=300,top=22,bottom=42,left=46,right=8,plotH=chartH-top-bottom,plotW=chartW-left-right,barW=8,zeroY=top+plotH*max/range;
  const lines=Array.from({length:5},(_,i)=>{const y=top+plotH*i/4,value=max-spread*i/4;return`<line x1="${left}" y1="${y}" x2="${chartW-right}" y2="${y}" class="chart-grid"/><text x="${left-8}" y="${y+4}" text-anchor="end" class="chart-axis">${compactMoney(value)}</text>`}).join('');
  const bar=(x,value,kind,month)=>{const height=Math.abs(value)*plotH/range,y=value>=0?zeroY-height:zeroY;return`<rect x="${x}" y="${y}" width="${barW}" height="${height}" rx="2" class="${kind}"><title>T${month}: ${kind==='bar-expected'?'lương dự kiến':'thực nhận'} ${money(value)}</title></rect>`};
  const bars=months.map((m,i)=>{const center=left+plotW*(i+.5)/12;return`${bar(center-barW-2,m.expected,'bar-expected',m.month)}${bar(center+2,m.received,'bar-paid',m.month)}<text x="${center}" y="${chartH-14}" text-anchor="middle" class="chart-axis">T${m.month}</text>`}).join('');
  const hasYearData=recs.some(record=>record.workDate.startsWith(String(year)))||pays.some(payment=>payment.payrollMonth?.startsWith(String(year)));
  $('#yearChart').innerHTML=hasYearData?`<svg viewBox="0 0 ${chartW} ${chartH}" role="img" aria-label="Biểu đồ lương dự kiến và tiền thực nhận theo từng tháng năm ${year}">${lines}${bars}</svg>`:`<div class="empty-state" role="status"><span aria-hidden="true">▥</span><b>Chưa có dữ liệu trong năm ${year}</b><p>Thống kê sẽ cập nhật khi bạn bắt đầu ghi nhận chấm công hoặc khoản tiền đã nhận.</p></div>`;
  $('#yearTable').innerHTML='<tr><th>Tháng<th>Công<th>Giờ làm<th>Giờ TB/công<th>Tăng ca<th>Chuyên cần<th>BHXH<th>Lương dự kiến<th>Thực nhận</tr>'+months.map(m=>`<tr><td>T${m.month}<td>${m.days.toLocaleString('vi-VN')}<td>${m.hours.toFixed(2)}<td>${m.average.toFixed(2)}<td>${m.overtime.toFixed(2)}<td>${money(m.attendanceBonus)}<td>${money(m.bhxh)}<td>${money(m.expected)}<td>${money(m.received)}</tr>`).join('')+`<tr class="year-total"><th>Cả năm<th>${totalDays.toLocaleString('vi-VN')}<th>${totalHours.toFixed(2)}<th>${totalDays?(totalHours/totalDays).toFixed(2):'0.00'}<th>${totalOvertime.toFixed(2)}<th>${money(totalBonus)}<th>${money(totalBhxh)}<th>${money(totalExpected)}<th>${money(totalReceived)}</tr>`;
}
function compactMoney(n){const sign=n<0?'-':'';n=Math.abs(n);if(n>=1000000)return`${sign}${(n/1000000).toLocaleString('vi-VN',{maximumFractionDigits:1})}tr`;if(n>=1000)return`${sign}${Math.round(n/1000)}k`;return`${sign}${Math.round(n)}`}
function conv(){const s=get('s_');$('#conv').textContent=s.payMode==='daily'?`${money(s.dailyRate/s.stdH)}/giờ · ca 13h ${money(s.dailyRate13)}/ngày · ca đêm 8h ${money(s.dailyRateNight8)} · ca đêm 11h ${money(s.dailyRateNight11)}`:money(s.hourlyRate)+'/giờ'}
function readM(){const shiftType=$('#m_shiftType').value,shiftHours=Number(shiftType.split('-')[0]);const r={...get('s_'),status:$('#m_status').value,shiftType,shiftHours,workDate:cur,lateEnabled:$('#m_lateEnabled').checked,lateMinutes:+$('#m_lateMinutes').value||0,halfDay:$('#m_halfDay').checked,overtimeHours:+$('#m_overtimeHours').value||0,note:$('#m_note').value};['allowance','bonus','otherDeduction','adjustment'].forEach(k=>r[k]=+$('#m_'+k).value||0);return r}
function prev(){const r=readM();if(r.status!=='work'){$('#pv').textContent='Tiền: '+money(r.status==='unpaid'?0:r.adjustment);return{r,res:{errors:[],expectedTotal:r.status==='unpaid'?0:r.adjustment}}}
const x=calc(r);$('#pv').innerHTML=x.errors.length?`<span class=err>${x.errors.join('<br>')}</span>`:`${shiftLabel(x.shiftType,x.shiftHours)}${x.halfDay?' · nửa ngày':''} (tính lương thường ${hr(x.regularSec)}h, tăng ca ${hr(x.overtimeSec)}h)<br>Lương ca ${money(x.basePay)} · Tăng ca ${money(x.overtimePay)}${r.payMode==='daily'&&r.workDate&&new Date(`${r.workDate}T00:00:00Z`).getUTCDay()===0&&(x.shiftType==='13-day'||x.shiftType==='11-night')?'<br>Đã áp dụng mức lương Chủ nhật':''}<br>${x.lateMinutes?`Đi trễ ${x.lateMinutes} phút = ${x.lateIntervals} mốc, trừ ${money(x.latePenalty)}`:'Không đi trễ'}<br><b>Tổng: ${money(x.expectedTotal)}</b>`;return{r,res:x}}
function syncLateField(){$('#m_lateMinutes').disabled=!$('#m_lateEnabled').checked}
let openedRecord=null,clonePlan=null,cloneDates=new Set(),cloneExcludedDates=new Set();
async function openDay(d){
  cur=d;
  let r;
  try{r=await rq(st('attendance').get(d))}
  catch(error){toast('Không thể đọc chấm công: '+error.message);return}
  if(cur!==d)return;
  const cached=recs.findIndex(item=>item.workDate===d);
  if(r){if(cached<0)recs.push(r);else recs[cached]=r}else if(cached>=0)recs.splice(cached,1);
  renderQuickAttendance();renderCal();renderPay();renderYear();openedRecord=r?JSON.parse(JSON.stringify(r)):null;
  const info=getCalendarDayInfo(d);
  $('#dt').textContent='Chấm công ngày '+formatDate(d);
  $('#calendarInfo').innerHTML=`<div class="calendar-date-meta"><span>📅 ${info.weekday}</span><span>🌙 ${info.lunar.day} tháng ${info.lunar.month}${info.lunar.isLeapMonth?' nhuận':''} Âm lịch</span></div>${info.events.length?`<div class="calendar-events"><b>Ngày đặc biệt</b>${info.events.map(event=>`<div class="calendar-event ${event.type}"><span>${event.type==='holiday'?'🇻🇳':'📌'}</span><span>${event.title}</span></div>`).join('')}</div>`:''}`;
  const defaultShift=isSundayDate(d)?{shiftType:'13-day',shiftHours:13}:{shiftType:'8-day',shiftHours:8};
  const o=r||{...S,status:'work',...defaultShift,lateEnabled:false,lateMinutes:0,halfDay:false,overtimeHours:0,allowance:0,bonus:0,otherDeduction:0,adjustment:0,note:''};
  $('#m_status').value=o.status;
  syncShiftOptions(d,o.shiftType||(o.shiftHours===13?'13-day':'8-day'));
  $('#m_lateEnabled').checked=o.shiftHours!=null?!!o.lateEnabled:!!o.lateSec;
  $('#m_lateMinutes').value=o.lateMinutes??Math.ceil((o.lateSec||0)/60);
  $('#m_halfDay').checked=!!o.halfDay;
  $('#m_overtimeHours').value=o.overtimeHours??((o.overtimeSec||0)/3600);
  renderOvertimeChoices($('#m_overtimeHours').value);
  syncLateField();
  ['allowance','bonus','otherDeduction','adjustment'].forEach(k=>$('#m_'+k).value=o[k]||0);
  $('#m_note').value=o.note||'';
  $('#mdel').style.display=r?'':'none';$('#mclone').hidden=!r;
  prev();$('#dlg').showModal();
}
function mondayOf(date){const day=new Date(`${date}T00:00:00Z`),offset=(day.getUTCDay()+6)%7;day.setUTCDate(day.getUTCDate()-offset);return day.toISOString().slice(0,10)}
function addDays(date,count){const value=new Date(`${date}T00:00:00Z`);value.setUTCDate(value.getUTCDate()+count);return value.toISOString().slice(0,10)}
function openCloneDialog(sourceDate=cur){clonePlan=null;cloneDates.clear();cloneExcludedDates.clear();$('#cloneSourceDate').value=sourceDate||today;$('#cloneMode').value='single';$('#cloneSingleDate').value='';$('#cloneAddDate').value='';$('#cloneRangeStart').value='';$('#cloneRangeEnd').value='';$('#cloneSourceWeek').value=mondayOf(sourceDate||today);$('#cloneTargetWeek').value='';$('#cloneDetails').value='all';$('#cloneNote').checked=false;$('#cloneStatus').textContent='';$('#clonePreview').hidden=true;renderCloneDateList();syncCloneMode();$('#cloneDlg').showModal()}
function syncCloneMode(){const mode=$('#cloneMode').value;$('#cloneSingleControls').hidden=mode!=='single';$('#cloneMultipleControls').hidden=mode!=='multiple';$('#cloneWeekControls').hidden=mode!=='week';$('#clonePreview').hidden=true;clonePlan=null}
function renderCloneDateList(){$('#cloneDateList').innerHTML=[...cloneDates].sort().map(date=>`<div class="clone-date-item"><label><input type="checkbox" data-clone-date="${date}" ${cloneExcludedDates.has(date)?'':'checked'}> ${formatDate(date)}</label><button class="s" type="button" data-remove-clone-date="${date}" aria-label="Xóa ngày ${formatDate(date)} khỏi danh sách">Xóa</button></div>`).join('')||'<small>Chưa chọn ngày đích.</small>'}
const validISODate=date=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())&&new Date(`${date}T00:00:00Z`).toISOString().slice(0,10)===date;
function addCloneDate(date){if(!validISODate(date))return false;cloneDates.add(date);cloneExcludedDates.delete(date);renderCloneDateList();$('#clonePreview').hidden=true;clonePlan=null;return true}
function cloneInputRecord(source,target,copyDetails,copyNote){
  const record={...source,id:target,workDate:target,updatedAt:Date.now()};
  delete record.createdAt;
  if(!copyDetails){record.lateEnabled=false;record.lateMinutes=0;record.halfDay=false;record.overtimeHours=0;record.allowance=0;record.bonus=0;record.otherDeduction=0;record.adjustment=0}
  if(!copyNote)record.note='';
  for(const key of ['totalSec','countedSec','regularSec','overtimeSec','lateSec','lateIntervals','latePenaltyMinutes','earlySec','earlyIntervals','earlyPenaltyMinutes','hourly','basePay','overtimePay','latePenalty','earlyPenalty','expectedTotal'])delete record[key];
  if(record.status==='work'){
    const result=calc(record);
    if(result.errors.length)throw new Error(`${formatDate(source.workDate)}: ${result.errors.join(', ')}`);
    return{...record,...result,id:target,workDate:target,updatedAt:record.updatedAt};
  }
  record.expectedTotal=record.status==='unpaid'?0:Number(record.adjustment)||0;
  return record;
}
async function prepareClonePlan(){
  const mode=$('#cloneMode').value,copyDetails=$('#cloneDetails').value==='all',copyNote=$('#cloneNote').checked,records=await all('attendance'),pairs=[];
  if(mode==='week'){
    const sourceWeek=$('#cloneSourceWeek').value,targetWeek=$('#cloneTargetWeek').value;
    if(!sourceWeek||!targetWeek||mondayOf(sourceWeek)!==sourceWeek||mondayOf(targetWeek)!==targetWeek)throw new Error('Hãy chọn thứ Hai cho tuần nguồn và tuần đích.');
    for(let offset=0;offset<7;offset++){
      const sourceDate=addDays(sourceWeek,offset),source=records.find(item=>item.workDate===sourceDate);
      if(source)pairs.push({source,targetDate:addDays(targetWeek,offset)});
    }
  }else{
    const sourceDate=$('#cloneSourceDate').value,source=records.find(item=>item.workDate===sourceDate);
    if(!source)throw new Error('Ngày nguồn chưa có bản ghi chấm công.');
    let targets=[];
    if(mode==='single')targets=[$('#cloneSingleDate').value];
    else targets=[...cloneDates].filter(date=>!cloneExcludedDates.has(date));
    targets=[...new Set(targets.filter(Boolean))].sort();
    if(!targets.length)throw new Error('Hãy chọn ít nhất một ngày đích.');
    if(targets.length>62)throw new Error('Mỗi lần chỉ có thể nhân bản tối đa 62 ngày đích.');
    pairs.push(...targets.map(targetDate=>({source,targetDate})));
  }
  if(!pairs.length)throw new Error('Tuần nguồn không có ngày nào đã chấm công.');
  const sources=[...new Map(pairs.map(pair=>[pair.source.workDate,pair.source])).values()];
  return{sources,items:pairs.map(({source,targetDate})=>{
    if(!validISODate(targetDate))throw new Error('Ngày đích không hợp lệ.');
    const before=records.find(item=>item.workDate===targetDate)||null;
    return{source,targetDate,before,record:cloneInputRecord(source,targetDate,copyDetails,copyNote),action:targetDate===source.workDate?'same':before?'skip':'copy'};
  })};
}
function renderClonePlan(){
  const items=clonePlan.items,newCount=items.filter(item=>item.action==='copy').length,replaceCount=items.filter(item=>item.action==='replace').length,skipCount=items.length-newCount-replaceCount;
  $('#cloneSummary').textContent=`Ngày sẽ tạo mới: ${newCount} · thay thế: ${replaceCount} · bỏ qua: ${skipCount}.`;
  $('#clonePreviewList').innerHTML=items.map((item,index)=>{
    const copiedFields=$('#cloneDetails').value==='all'?[
      item.record.halfDay?'Nửa ngày':null,
      item.record.lateEnabled&&item.record.lateMinutes?`Trễ ${item.record.lateMinutes} phút`:null,
      item.record.overtimeHours?`Tăng ca ${item.record.overtimeHours} giờ`:null,
      item.record.allowance?`Phụ cấp ${money(item.record.allowance)}`:null,
      item.record.bonus?`Thưởng ${money(item.record.bonus)}`:null,
      item.record.otherDeduction?`Khấu trừ ${money(item.record.otherDeduction)}`:null,
      item.record.adjustment?`Điều chỉnh ${money(item.record.adjustment)}`:null
    ].filter(Boolean):[];
    if($('#cloneNote').checked&&item.record.note)copiedFields.push(`Ghi chú: ${esc(item.record.note)}`);
    const info=`${item.source.status==='work'?shiftLabel(item.source.shiftType,item.source.shiftHours):item.source.status==='unpaid'?'Nghỉ không lương':item.source.status==='paid'?'Nghỉ có lương':'Nghỉ lễ'} · Dự kiến ${money(item.record.expectedTotal)}${copiedFields.length?` · ${copiedFields.join(' · ')}`:''}`;
    const choices=item.targetDate===item.source.workDate?'<small>Ngày nguồn và ngày đích trùng nhau — bỏ qua để tránh tự ghi đè.</small>':item.before?`<label><input type="radio" name="clone-action-${index}" value="skip" ${item.action==='skip'?'checked':''}> Bỏ qua, giữ bản ghi hiện tại</label><label><input type="radio" name="clone-action-${index}" value="replace" ${item.action==='replace'?'checked':''}> Thay thế sau khi xác nhận</label>`:'<small>Ngày trống — sẽ tạo bản ghi mới.</small>';
    return`<article class="clone-preview-item" data-clone-index="${index}"><b>${formatDate(item.source.workDate)} → ${formatDate(item.targetDate)}</b><div>${info}</div>${item.before?`<small>Đã có dữ liệu: ${item.before.status==='work'?shiftLabel(item.before.shiftType,item.before.shiftHours):'nghỉ đã ghi nhận'}.</small>`:''}${choices}</article>`;
  }).join('');
  $('#clonePreview').hidden=false;
}
function sameRecord(a,b){if(a==null&&b==null)return true;if(a==null||b==null)return false;return JSON.stringify(a)===JSON.stringify(b)}
function writeCloneBatch(plan,items){
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction('attendance','readwrite'),store=transaction.objectStore('attendance');
    let remaining=plan.sources.length+items.length,failure=null,writing=false;
    const checked=()=>{remaining--;if(remaining||writing)return;writing=true;items.forEach(item=>store.put(item.record))};
    const check=(id,expected)=>{const request=store.get(id);request.onsuccess=()=>{if(!sameRecord(request.result,expected)){failure=new Error(`Dữ liệu ngày ${formatDate(id)} vừa thay đổi. Hãy xem trước lại trước khi nhân bản.`);transaction.abort();return}checked()};request.onerror=()=>{failure=request.error}};
    transaction.oncomplete=resolve;
    transaction.onabort=()=>reject(failure||transaction.error||new Error('Không thể lưu các bản ghi nhân bản.'));
    plan.sources.forEach(source=>check(source.id,source));
    items.forEach(item=>check(item.targetDate,item.before));
  });
}
$('#dlg').addEventListener('input',prev);$('#dlg').addEventListener('change',prev);$('#m_status').addEventListener('change',()=>{syncShiftOptions(cur,$('#m_shiftType').value);prev()});$('#m_overtimeChoices').addEventListener('click',event=>{const button=event.target.closest('[data-overtime-hours]');if(!button)return;$('#m_overtimeHours').value=button.dataset.overtimeHours;renderOvertimeChoices(button.dataset.overtimeHours);prev()});$('#m_lateEnabled').addEventListener('change',syncLateField);$('#mclose').onclick=()=>$('#dlg').close();
$('#msave').onclick=async e=>{const{r,res}=prev();if(res.errors.length)return toast('Dữ liệu không hợp lệ');e.target.disabled=true;if(cur===today)$('#quickAttendanceStatus').textContent='Đang lưu chấm công…';try{const record={...r,...res,id:cur,workDate:cur,updatedAt:Date.now()};await new Promise((resolve,reject)=>{const transaction=db.transaction('attendance','readwrite'),store=transaction.objectStore('attendance'),request=store.get(cur);let failure=null;request.onsuccess=()=>{if(!sameRecord(request.result,openedRecord)){failure=new Error('Dữ liệu ngày này vừa thay đổi ở nơi khác. Đóng và mở lại ngày để tránh ghi đè.');transaction.abort();return}store.put(record)};request.onerror=()=>{failure=request.error;transaction.abort()};transaction.oncomplete=resolve;transaction.onabort=()=>reject(failure||transaction.error||new Error('Không thể lưu chấm công.'))});await load();$('#dlg').close();toast('Đã lưu chấm công')}catch(x){if(cur===today)$('#quickAttendanceStatus').textContent='Lỗi lưu chấm công: '+x.message;toast('Lỗi lưu: '+x.message)}finally{e.target.disabled=false}};
$('#mdel').onclick=async()=>{if(confirm('Xóa chấm công ngày '+cur+'?')){await del('attendance',cur);await load();$('#dlg').close()}};
$('#quickAttendanceButton').onclick=()=>{if(ym!==today.slice(0,7)){ym=today.slice(0,7);render()}openDay(today)};
$('#quickCalendarButton').onclick=()=>{ym=today.slice(0,7);render();document.querySelector('nav button[data-t="cal"]').click()};
$('#mclone').onclick=()=>{if(!openedRecord)return toast('Ngày này chưa có dữ liệu để nhân bản.');openCloneDialog(cur)};
$('#cloneClose').onclick=()=>$('#cloneDlg').close();
$('#cloneCancelButton').onclick=()=>$('#cloneDlg').close();
$('#cloneMode').addEventListener('change',syncCloneMode);
$('#cloneSourceDate').addEventListener('change',()=>{if($('#cloneMode').value==='week')$('#cloneSourceWeek').value=mondayOf($('#cloneSourceDate').value||today);$('#clonePreview').hidden=true;clonePlan=null});
$('#cloneSourceWeek').addEventListener('change',()=>{$('#clonePreview').hidden=true;clonePlan=null});
$('#cloneTargetWeek').addEventListener('change',()=>{$('#clonePreview').hidden=true;clonePlan=null});
$('#cloneSingleDate').addEventListener('change',()=>{$('#clonePreview').hidden=true;clonePlan=null});
$('#cloneDetails').addEventListener('change',()=>{$('#clonePreview').hidden=true;clonePlan=null});
$('#cloneNote').addEventListener('change',()=>{$('#clonePreview').hidden=true;clonePlan=null});
$('#cloneAddDateButton').onclick=()=>{if(!addCloneDate($('#cloneAddDate').value))toast('Chọn ngày đích hợp lệ trước khi thêm.')};
$('#cloneAddRangeButton').onclick=()=>{const start=$('#cloneRangeStart').value,end=$('#cloneRangeEnd').value;if(!start||!end||start>end)return toast('Khoảng ngày không hợp lệ.');const first=new Date(`${start}T00:00:00Z`),last=new Date(`${end}T00:00:00Z`),count=(last-first)/86400000+1;if(count>62)return toast('Mỗi lần chỉ có thể thêm tối đa 62 ngày.');for(let offset=0;offset<count;offset++){const date=addDays(start,offset);cloneDates.add(date);cloneExcludedDates.delete(date)}renderCloneDateList();$('#clonePreview').hidden=true;clonePlan=null};
$('#cloneSelectAllButton').onclick=()=>{cloneExcludedDates.clear();renderCloneDateList();$('#clonePreview').hidden=true;clonePlan=null};
$('#cloneClearDatesButton').onclick=()=>{cloneExcludedDates=new Set(cloneDates);renderCloneDateList();$('#clonePreview').hidden=true;clonePlan=null};
$('#cloneDateList').addEventListener('click',event=>{const button=event.target.closest('[data-remove-clone-date]');if(button){cloneDates.delete(button.dataset.removeCloneDate);renderCloneDateList();$('#clonePreview').hidden=true;clonePlan=null}});
$('#cloneDateList').addEventListener('change',event=>{const checkbox=event.target.closest('[data-clone-date]');if(!checkbox)return;if(checkbox.checked)cloneExcludedDates.delete(checkbox.dataset.cloneDate);else cloneExcludedDates.add(checkbox.dataset.cloneDate);$('#clonePreview').hidden=true;clonePlan=null});
$('#clonePreviewButton').onclick=async event=>{const button=event.currentTarget;button.disabled=true;$('#cloneStatus').textContent='Đang kiểm tra dữ liệu hiện tại…';try{clonePlan=await prepareClonePlan();renderClonePlan();$('#cloneStatus').textContent='Bản xem trước được tạo từ dữ liệu đã lưu.'}catch(error){clonePlan=null;$('#clonePreview').hidden=true;$('#cloneStatus').textContent=error.message}finally{button.disabled=false}};
$('#clonePreviewList').addEventListener('change',event=>{const item=event.target.closest('[data-clone-index]');if(!item||!clonePlan)return;const planned=clonePlan.items[Number(item.dataset.cloneIndex)];if(event.target.name?.startsWith('clone-action-')){planned.action=event.target.value;renderClonePlan()}});
$('#cloneConfirmButton').onclick=async event=>{
  const button=event.currentTarget;
  if(!clonePlan)return toast('Hãy tạo bản xem trước trước khi xác nhận.');
  const items=clonePlan.items.filter(item=>item.action==='copy'||item.action==='replace'),replaceCount=items.filter(item=>item.action==='replace').length,skipCount=clonePlan.items.length-items.length;
  if(!items.length)return toast('Không có ngày nào được chọn để ghi.');
  if(replaceCount&&!confirm(`Bạn đã chọn thay thế ${replaceCount} ngày đang có dữ liệu. Tiếp tục?`))return;
  button.disabled=true;button.textContent='Đang lưu…';$('#cloneStatus').textContent='Đang lưu các bản ghi…';
  try{await writeCloneBatch(clonePlan,items);await load();$('#cloneDlg').close();toast(`Nhân bản thành công: ${items.length-replaceCount} ngày mới, ${replaceCount} ngày thay thế, ${skipCount} ngày bỏ qua.`)}
  catch(error){$('#cloneStatus').textContent=error.message;toast('Không thể nhân bản: '+error.message)}
  finally{button.disabled=false;button.textContent='Xác nhận nhân bản'}
};
document.addEventListener('click',async e=>{const d=e.target.closest('[data-d]');if(d)openDay(d.dataset.d);if(e.target.dataset.pd&&confirm('Xóa khoản này?')){await del('payments',e.target.dataset.pd);load()}});
const shift=n=>{const[y,m]=ym.split('-').map(Number),d=new Date(Date.UTC(y,m-1+n,1));ym=d.toISOString().slice(0,7);render()};
$('#prev').onclick=()=>shift(-1);$('#next').onclick=()=>shift(1);$('#cur').onclick=()=>{ym=today.slice(0,7);render()};
$('#incomePrevMonth').onclick=()=>{ym=monthOffset(ym,-1);render()};
$('#incomeNextMonth').onclick=()=>{ym=monthOffset(ym,1);render()};
$('#incomeCurrentMonth').onclick=()=>{ym=today.slice(0,7);render()};
$('#incomeMonthPicker').addEventListener('change',event=>{const value=event.target.value;if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)){event.target.value=ym;toast('Tháng không hợp lệ');return}ym=value;render()});
$('#incomeChartRange').addEventListener('change',renderIncomeChart);
$('#incomeChartMetric').addEventListener('change',renderIncomeChart);
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>{const active=x===b;x.classList.toggle('on',active);if(active)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});document.querySelectorAll('.sec').forEach(s=>s.hidden=s.id!==b.dataset.t)});
$('#yearInput').onchange=e=>{const next=Number(e.target.value);if(!Number.isInteger(next)||next<2000||next>9999){toast('Năm phải từ 2000 đến 9999');e.target.value=year;return}year=next;renderYear();renderIncomeDashboard()};
$('#sf').addEventListener('input',()=>{conv();if(cur&&$('#dlg').open)syncShiftOptions(cur,$('#m_shiftType').value)});
$('#ssave').onclick=async()=>{const s=get('s_');if(!(s.stdH>0&&s.interval>0))return toast('Giờ công và mốc đi trễ phải > 0');if(!Number.isFinite(s.bhxhAmount)||s.bhxhAmount<0)return toast('Tiền BHXH phải là số không âm');S={...s,id:'default'};try{await put('settings',S);renderPay();renderYear();toast('Đã lưu mặc định (không ảnh hưởng ngày cũ)')}catch(error){toast('Lỗi lưu thiết lập: '+error.message)}};
$('#bhxhEnabled').addEventListener('change',async event=>{const setting={id:`payroll:${ym}`,bhxhEnabled:event.target.checked};try{await put('settings',setting);monthlySettings.set(setting.id,setting);renderPay();renderYear()}catch(error){event.target.checked=!event.target.checked;toast('Lỗi lưu lựa chọn BHXH: '+error.message)}});
$('#padd').onclick=async()=>{const a=+$('#pa').value,d=$('#pd').value;if(!d||!a)return toast('Nhập ngày và số tiền');await put('payments',{id:crypto.randomUUID(),paymentDate:d,payrollMonth:ym,amount:a,type:$('#pt').value,note:$('#pn').value,createdAt:Date.now()});$('#pa').value='';await load();toast('Đã thêm')};
const dl=(name,txt,mime)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:mime}));a.download=name;a.click()};
$('#exp').onclick=async()=>dl(`workpay-${today}.json`,JSON.stringify({app:'workpay',version:1,attendance:await all('attendance'),payments:await all('payments'),settings:await all('settings')},null,1),'application/json');
$('#csv').onclick=()=>{const h=['Ngày','Trạng thái','Ca','Công','Phút trễ','Mốc trễ','Giờ tăng ca','Lương ca','Tiền tăng ca','Trừ trễ','Trừ về sớm','Phụ cấp','Thưởng','Khấu trừ khác','Điều chỉnh','Tổng'],R=monthRecs(),rows=R.map(r=>[formatDate(r.workDate),r.status,r.shiftHours?shiftLabel(r.shiftType||(r.shiftHours===13?'13-day':'8-day'),r.shiftHours):r.start?`${r.start}–${r.end||''}`:'',r.halfDay?'Nửa ngày':'Đủ ca',r.lateMinutes??Math.round((r.lateSec||0)/60),r.lateIntervals||0,r.overtimeHours??((r.overtimeSec||0)/3600),r.basePay,r.overtimePay,r.latePenalty,r.earlyPenalty,r.allowance,r.bonus,r.otherDeduction,r.adjustment,r.expectedTotal]);const bonus=attendanceBonusFor(R),bhxh=bhxhFor(ym);if(bonus){const bonusRow=Array(h.length).fill('');bonusRow[0]='Thưởng chuyên cần';bonusRow[h.length-1]=bonus;rows.push(bonusRow)}if(bhxh){const bhxhRow=Array(h.length).fill('');bhxhRow[0]='Khấu trừ BHXH';bhxhRow[h.length-1]=-bhxh;rows.push(bhxhRow)}const totalRow=Array(h.length).fill('');totalRow[0]='Lương dự kiến sau khấu trừ';totalRow[h.length-1]=R.reduce((total,r)=>total+(Number(r.expectedTotal)||0),0)+bonus-bhxh;rows.push(totalRow);dl(`luong-${ym}.csv`,'\ufeff'+[h,...rows].map(l=>l.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n'),'text/csv')};
$('#imp').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(d.app!=='workpay'||d.version!==1||!Array.isArray(d.attendance)||!Array.isArray(d.payments))throw Error('Sai định dạng/phiên bản');const rep=$('#imode').value==='replace';if(!confirm(`Nhập ${d.attendance.length} chấm công, ${d.payments.length} thanh toán (${rep?'THAY THẾ toàn bộ dữ liệu hiện có':'hợp nhất'})?`))return;await bulk(d,rep);await load();toast('Đã nhập')}catch(x){toast('Lỗi nhập: '+x.message)}e.target.value=''};
$('#wipe').onclick=async()=>{if(confirm('Xóa TOÀN BỘ dữ liệu? Không thể hoàn tác.')&&confirm('Xác nhận lần cuối: bạn đã xuất sao lưu chưa?')){await bulk({},true);await load()}};
await load();
