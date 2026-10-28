import { puzzles, isCorrect, score } from './puzzles.js';
const $ = selector => document.querySelector(selector);
const KEY = 'merge-or-die-v1';
const fresh = () => ({ solved:0, current:0, elapsed:0, started:false, hints:[], mistakes:0 });
let state = fresh(), sound = false, lastTick = Date.now(), storageAvailable = true;
try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved && Number.isInteger(saved.solved) && saved.solved >= 0 && saved.solved <= 5 && Number.isInteger(saved.current) && saved.current >= 0 && saved.current <= Math.min(saved.solved,4) && Number.isFinite(saved.elapsed) && saved.elapsed >= 0 && typeof saved.started === 'boolean' && Array.isArray(saved.hints) && saved.hints.every(n => Number.isInteger(n) && n>=0 && n<5) && new Set(saved.hints).size === saved.hints.length && Number.isInteger(saved.mistakes) && saved.mistakes >= 0) state=saved; } catch { storageAvailable=false; }
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageAvailable=false;} if(!storageAvailable) $('#footer-status').textContent='PROGRESS SAVING UNAVAILABLE';}
const time = ms => `${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;
function tick(){const now=Date.now();if(state.started&&state.solved<5&&!document.hidden){state.elapsed+=now-lastTick;save();}lastTick=now;$('#timer').textContent=time(state.elapsed);}
setInterval(tick,1000);
document.addEventListener('visibilitychange',()=>{lastTick=Date.now();});
function start(){if(!state.started){state.started=true;lastTick=Date.now();save();}}
function beep(){if(!sound)return;try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.setValueAtTime(550,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+.12);g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.22);o.start();o.stop(ctx.currentTime+.23);o.onended=()=>ctx.close();}catch{}}
function render(){
 $('#rooms').replaceChildren();
 puzzles.forEach((p,i)=>{const b=document.createElement('button');b.className=`room${state.current===i&&state.solved<5?' active':''}${i<state.solved?' solved':''}`;b.disabled=i>state.solved;b.setAttribute('aria-label',`${i+1}. ${p.title}, ${i<state.solved?'restored':i>state.solved?'locked':'available'}`);if(i===state.current&&state.solved<5)b.setAttribute('aria-current','step');b.innerHTML=`<span class="room-number">${String(i+1).padStart(2,'0')}</span><span class="room-copy"><strong>${p.title}</strong><small>${p.subtitle}</small></span><span class="room-icon">${i<state.solved?'✓':i>state.solved?'×':'↗'}</span>`;b.onclick=()=>{state.current=i;save();render();};$('#rooms').append(b);});
 $('#lock-count').textContent=`${state.solved} / 5`;$('#progress').style.width=`${state.solved*20}%`;$('#progress-label').textContent=`${state.solved*20}% SYSTEMS RESTORED`;$('#session-status').textContent=state.solved===5?'ACCESS GRANTED':state.started?'SESSION ACTIVE':'SESSION READY';$('#footer-status').textContent=state.solved===5?'ALL SYSTEMS OPERATIONAL':state.started?'OPERATOR CONNECTED':'AWAITING OPERATOR';$('#timer').textContent=time(state.elapsed);
 if(state.solved===5){$('#category').textContent='MISSION COMPLETE';$('#puzzle').innerHTML=`<div class="victory"><div class="victory-mark">[↗]</div><h2>You shipped. You escaped.</h2><p class="description">Five systems restored. One developer back in the daylight.<br>The incident report can wait.</p><div class="stats"><div class="stat"><strong>${time(state.elapsed)}</strong><span>ACTIVE TIME</span></div><div class="stat"><strong>${score(state.elapsed,state.hints.length,state.mistakes)}</strong><span>FINAL SCORE / 1000</span></div><div class="stat"><strong>${state.hints.length}</strong><span>HINTS USED</span></div></div><p class="description">${state.mistakes} incorrect attempt${state.mistakes===1?'':'s'} · Score = 1000 − seconds − 60 per hint − 25 per miss, minimum 0.</p><button class="primary" id="play-again">Run it back ↗</button></div>`;$('#play-again').onclick=()=>$('#reset-dialog').showModal();return;}
 const i=state.current,p=puzzles[i],solved=i<state.solved;
 $('#category').textContent=p.category;
 $('#puzzle').innerHTML=`<h2>${p.title}</h2><p class="description"></p><div class="code-window"><div class="code-caption"><span>${p.file}</span><span>READ ONLY</span></div><pre></pre></div>${solved?'<div class="hint success"></div><div class="next-row"><p>✓ SYSTEM RESTORED</p><button class="primary" id="next">Next system ↗</button></div>':'<form id="answer-form"><label class="answer-label" for="answer"></label><div class="answer-row"><input id="answer" required autocomplete="off" spellcheck="false" maxlength="100" aria-describedby="feedback"><button class="primary" type="submit">Unlock system ↗</button></div></form><div class="puzzle-bottom"><button class="text-button" id="hint-toggle">↳ Need a hint? <span>(−60 pts)</span></button><span class="attempts">'+(i+1)+' OF 5 LOCKS</span></div><p class="feedback" id="feedback" role="status" aria-live="polite"></p><div id="hint-area"></div>'}`;
 $('#puzzle .description').textContent=p.description;$('#puzzle pre').textContent=p.code;
 if(solved){$('#puzzle .hint').textContent=p.lesson;$('#next').onclick=()=>{state.current=state.solved;save();render();};return;}
 $('.answer-label').textContent=p.label;$('#answer').placeholder=p.placeholder;
 const showHint=()=>{const hint=document.createElement('p');hint.className='hint';hint.textContent=p.hint;$('#hint-area').replaceChildren(hint);$('#hint-toggle').textContent='↳ Hint revealed';};
 if(state.hints.includes(i))showHint();
 $('#hint-toggle').onclick=()=>{start();if(!state.hints.includes(i)){state.hints.push(i);save();}showHint();};
 $('#answer').addEventListener('input',start);
 $('#answer-form').onsubmit=e=>{e.preventDefault();if(!$('#answer').value.trim())return;start();tick();if(isCorrect(i,$('#answer').value)){state.solved++;save();beep();render();const focusTarget=state.solved===5?$('#play-again'):$('#next');focusTarget?.focus();}else{state.mistakes++;save();$('#feedback').textContent='Access denied. Take another look — you have unlimited attempts.';$('#answer').setAttribute('aria-invalid','true');$('#answer').focus();$('#answer').select();}};
 save();
}
$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent=sound?'SOUND ON':'SOUND OFF';$('#sound').setAttribute('aria-pressed',String(sound));};
$('#restart').onclick=()=>$('#reset-dialog').showModal();$('#cancel-reset').onclick=()=>$('#reset-dialog').close();$('#confirm-reset').onclick=()=>{state=fresh();lastTick=Date.now();save();$('#reset-dialog').close();render();};
render();
