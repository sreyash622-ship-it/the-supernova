(() => {
  'use strict';

  const modal = document.getElementById('modal');
  const body = modal.querySelector('.modal-body');
  const toast = document.getElementById('toast');
  const KEY = 'supernova-mission-progress-v1';
  let toastTimer;
  let orbitFrame;

  const readProgress = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { return {}; }
  };
  const progress = readProgress();
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }
  function markComplete(id, message) {
    const alreadyComplete = Boolean(progress[id]?.completed);
    progress[id] = { completed: true, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch {}
    const button = document.querySelector(`[data-mission="${id}"]`);
    const card = button?.closest('.mission');
    if (card && !card.querySelector('.completed-tag')) {
      const tag = document.createElement('span');
      tag.className = 'completed-tag';
      tag.textContent = '✓ COMPLETED';
      card.querySelector('.card-bottom')?.prepend(tag);
    }
    const complete = body.querySelector('.mission-success');
    if (complete) complete.hidden = false;
    const status = body.querySelector('.activity-feedback');
    if (status) status.innerHTML = `<strong>Mission complete!</strong> ${message || 'Your progress is saved on this device.'}`;
    if (!alreadyComplete) notify('Mission complete — progress saved on this device.');
  }
  function updateCompletedCards() {
    document.querySelectorAll('[data-mission]').forEach(button => {
      if (progress[button.dataset.mission]?.completed) {
        const card = button.closest('.mission');
        if (card && !card.querySelector('.completed-tag')) {
          const tag = document.createElement('span');
          tag.className = 'completed-tag';
          tag.textContent = '✓ COMPLETED';
          card.querySelector('.card-bottom')?.prepend(tag);
        }
      }
    });
    const done = Object.values(progress).filter(item => item?.completed).length;
    const counter = document.getElementById('mission-count');
    if (counter) counter.textContent = `${done} of 8 missions completed · progress stays on this device`;
  }

  const shell = (id, title, label, intro, content) => `
    <div class="mission-meta"><span>${label}</span><span>Progress saves on this device</span></div>
    <p class="mission-prompt">${intro}</p>
    ${content}
    <div class="activity-feedback" role="status" aria-live="polite">Change the model, make a prediction, then complete the challenge.</div>
    <div class="mission-footer"><span class="mission-success" hidden>✓ COMPLETE</span><button class="btn dark mission-reset" type="button">Reset activity</button></div>`;

  function initHeart() {
    const steps = [
      ['Body → vena cava', 'Deoxygenated blood returns from the body to the right side of the heart.'],
      ['Right atrium → tricuspid valve', 'The valve keeps blood moving one way into the right ventricle.'],
      ['Right ventricle → pulmonary artery', 'The right ventricle pumps blood toward the lungs.'],
      ['Lungs → pulmonary veins', 'Gas exchange adds oxygen before blood returns to the left side.'],
      ['Left atrium → mitral valve', 'The mitral valve opens into the left ventricle.'],
      ['Left ventricle → aorta → body', 'The strongest chamber sends oxygenated blood around the body.']
    ];
    let i = 0;
    const step = body.querySelector('#heart-step');
    const text = body.querySelector('#heart-explain');
    const meter = body.querySelector('#heart-meter');
    const feedback = body.querySelector('.activity-feedback');
    const advance = body.querySelector('#heart-next');
    function draw() {
      step.textContent = steps[i][0];
      text.textContent = steps[i][1];
      meter.style.width = `${Math.round(i / steps.length * 100)}%`;
      advance.textContent = i < steps.length ? 'Trace next step →' : 'Answer the check →';
    }
    advance.addEventListener('click', () => {
      if (i < steps.length - 1) { i++; draw(); }
      else {
        meter.style.width = '100%';
        body.querySelector('#heart-path').hidden = true;
        body.querySelector('#heart-check').hidden = false;
        advance.hidden = true;
      }
    });
    body.querySelectorAll('[data-heart-answer]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.heartAnswer === 'lungs') {
        feedback.innerHTML = '<strong>That’s right.</strong> The lungs exchange carbon dioxide for oxygen; the heart then distributes oxygenated blood.';
        markComplete('biology', 'You traced a full circulation loop.');
      } else feedback.innerHTML = '<strong>Try again.</strong> The lungs are where blood picks up oxygen.';
    }));
    draw();
  }

  function initCell() {
    const facts = {
      nucleus: 'The nucleus stores DNA and helps regulate cell activity.',
      mitochondrion: 'Mitochondria convert energy from nutrients into ATP the cell can use.',
      membrane: 'The cell membrane controls what enters and leaves the cell.',
      ribosome: 'Ribosomes assemble proteins from amino acids.'
    };
    const feedback = body.querySelector('.activity-feedback');
    body.querySelectorAll('[data-organelle]').forEach(button => button.addEventListener('click', () => {
      const name = button.dataset.organelle;
      feedback.textContent = facts[name];
      if (name === 'mitochondrion') {
        body.querySelectorAll('[data-organelle]').forEach(item => item.disabled = true);
        markComplete('cell', 'You identified the organelle that supplies most usable cellular ATP.');
      }
    }));
  }

  function initChemistry() {
    const inputs = ['coef-h2', 'coef-o2', 'coef-h2o'].map(id => body.querySelector(`#${id}`));
    const feedback = body.querySelector('.activity-feedback');
    const balance = () => {
      const [h, o, w] = inputs.map(input => Math.max(1, Math.min(9, Number(input.value) || 1)));
      body.querySelector('#left-h').textContent = `${2*h} H`;
      body.querySelector('#left-o').textContent = `${2*o} O`;
      body.querySelector('#right-h').textContent = `${2*w} H`;
      body.querySelector('#right-o').textContent = `${w} O`;
      const balanced = 2*h === 2*w && 2*o === w;
      const minimal = h === 2 && o === 1 && w === 2;
      if (balanced && minimal) {
        feedback.innerHTML = '<strong>Balanced.</strong> Four hydrogen atoms and two oxygen atoms appear on each side. Atoms are conserved.';
        markComplete('chemistry', 'You balanced hydrogen and oxygen atoms in the reaction.');
      } else if (balanced) feedback.innerHTML = '<strong>Atom counts match.</strong> Reduce the coefficients to the smallest whole-number ratio.';
      else feedback.innerHTML = `Not balanced yet. Left: ${2*h} H, ${2*o} O · Right: ${2*w} H, ${w} O.`;
    };
    inputs.forEach(input => input.addEventListener('input', balance));
    body.querySelector('#check-balance').addEventListener('click', balance);
    balance();
  }

  function initElements() {
    const data = [
      ['H', 'Hydrogen'], ['He', 'Helium'], ['Li', 'Lithium'], ['Be', 'Beryllium'], ['B', 'Boron'],
      ['C', 'Carbon'], ['N', 'Nitrogen'], ['O', 'Oxygen'], ['F', 'Fluorine'], ['Ne', 'Neon']
    ];
    let p = 1, n = 0, e = 1;
    const render = () => {
      const z = Math.max(1, Math.min(10, p));
      p = z;
      body.querySelector('#element-symbol').textContent = data[z - 1][0];
      body.querySelector('#element-name').textContent = data[z - 1][1];
      body.querySelector('#atomic-number').textContent = `Atomic number ${z}`;
      body.querySelector('#mass-number').textContent = `Mass number ${p+n}`;
      body.querySelector('#charge-state').textContent = `Net charge ${p-e>0?'+':''}${p-e}`;
      body.querySelector('#shell-model').textContent = `Electron shells: ${e===0?'none':`${Math.min(2,e)}${e>2?` · ${e-2}`:''}`}`;
      if (p===6 && n===6 && e===6) {
        body.querySelector('.activity-feedback').innerHTML = '<strong>Carbon-12 built.</strong> Six protons define carbon; six neutrons give mass number 12; six electrons make it neutral.';
        markComplete('elements', 'You built a neutral carbon-12 atom.');
      }
    };
    body.querySelectorAll('[data-atom]').forEach(button => button.addEventListener('click', () => {
      const kind = button.dataset.atom;
      if (kind === 'proton') p = Math.max(1, Math.min(10, p + Number(button.dataset.delta)));
      if (kind === 'neutron') n = Math.max(0, Math.min(20, n + Number(button.dataset.delta)));
      if (kind === 'electron') e = Math.max(0, Math.min(10, e + Number(button.dataset.delta)));
      render();
    }));
    render();
  }

  function initMath() {
    const a = body.querySelector('#math-a'), b = body.querySelector('#math-b'), c = body.querySelector('#math-c');
    const svgPath = body.querySelector('#function-path');
    function plot() {
      const av = Number(a.value), bv = Number(b.value), cv = Number(c.value);
      body.querySelector('#math-equation').textContent = `y = ${av}x² ${bv<0?'−':'+'} ${Math.abs(bv)}x ${cv<0?'−':'+'} ${Math.abs(cv)}`;
      body.querySelector('#math-c-value').textContent = `y-intercept: ${cv}`;
      const pts = [];
      for (let px=0;px<=360;px+=3) {
        const x=(px-180)/30;
        const y=av*x*x+bv*x+cv;
        const py=115-y*12;
        pts.push(`${px},${Math.max(-30,Math.min(260,py))}`);
      }
      svgPath.setAttribute('points',pts.join(' '));
      body.querySelector('#math-a-value').textContent = `a = ${av}`;
    }
    [a,b,c].forEach(input=>input.addEventListener('input',plot));
    body.querySelector('#check-math').addEventListener('click',()=>{
      if(Number(a.value)<0){body.querySelector('.activity-feedback').innerHTML='<strong>Correct.</strong> A negative leading coefficient makes the parabola open downward.';markComplete('math','You controlled a quadratic and identified its opening direction.');}
      else body.querySelector('.activity-feedback').innerHTML='<strong>Not yet.</strong> Set the leading coefficient a below zero.';
    });
    plot();
  }

  function initFractal() {
    const canvas = body.querySelector('#fractal-canvas');
    const ctx = canvas.getContext('2d');
    const depth = body.querySelector('#fractal-depth');
    const angle = body.querySelector('#fractal-angle');
    function draw() {
      const rect=canvas.getBoundingClientRect();
      const dpr=window.devicePixelRatio||1;
      canvas.width=Math.max(1,Math.round(rect.width*dpr));
      canvas.height=Math.max(1,Math.round(rect.height*dpr));
      ctx.scale(dpr,dpr);
      ctx.clearRect(0,0,rect.width,rect.height);
      ctx.strokeStyle='#c2a6ff'; ctx.lineWidth=1.5; ctx.shadowColor='#a879ff'; ctx.shadowBlur=5;
      const maxDepth=Number(depth.value), spread=Number(angle.value)*Math.PI/180;
      function branch(x,y,len,rot,level){
        const x2=x+Math.cos(rot)*len, y2=y+Math.sin(rot)*len;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();
        if(level<maxDepth){branch(x2,y2,len*.69,rot-spread,level+1);branch(x2,y2,len*.69,rot+spread,level+1);}
      }
      branch(rect.width/2,rect.height-8,rect.height*.28,-Math.PI/2,1);
      body.querySelector('#fractal-depth-value').textContent=`${maxDepth} levels · ${2**(maxDepth+1)-2} branches`;
      if(maxDepth>=6) body.querySelector('#check-fractal').disabled=false;
    }
    [depth,angle].forEach(input=>input.addEventListener('input',draw));
    body.querySelector('#check-fractal').addEventListener('click',()=>{
      if(Number(depth.value)>=6){body.querySelector('.activity-feedback').innerHTML='<strong>Pattern revealed.</strong> Each branch follows the same split rule. Repeating a local rule creates detail at many scales.';markComplete('fractals','You explored a branching fractal through six recursive levels.');}
    });
    draw();
  }

  function initQuantum() {
    const energy=body.querySelector('#particle-energy'), barrier=body.querySelector('#barrier-height'), width=body.querySelector('#barrier-width');
    const svg=body.querySelector('#quantum-wave');
    const feedback=body.querySelector('.activity-feedback');
    function update(){
      const E=Number(energy.value)/100, V=Number(barrier.value)/100, w=Number(width.value)/100;
      const transmission=V<=E?0.98:Math.exp(-2*w*Math.sqrt((V-E)*8));
      const pct=Math.round(transmission*100);
      body.querySelector('#energy-value').textContent=`${E.toFixed(2)} eV`;
      body.querySelector('#barrier-height-value').textContent=`${V.toFixed(2)} eV`;
      body.querySelector('#barrier-width-value').textContent=`${w.toFixed(1)} nm`;
      body.querySelector('#transmission-value').textContent=`${pct}%`;
      const path=[];
      for(let x=0;x<=400;x+=4){const amp=x<170?1:(x<230?1:transmission);const y=54-Math.sin((x/400)*Math.PI*16)*16*amp;path.push(`${x},${y}`);}
      svg.setAttribute('points',path.join(' '));
      const bar=body.querySelector('#quantum-barrier');bar.setAttribute('x',`${175}`);bar.setAttribute('width',`${Math.min(52,10+w*14)}`);
      if(V>E&&pct>0&&pct<90){feedback.innerHTML='<strong>Tunneling region.</strong> The particle energy is below the barrier, yet the model still gives a non-zero transmission probability.';}
      else feedback.textContent='Set particle energy below barrier height. Increase width to see transmission fall.';
      body.querySelector('#check-quantum').disabled=!(V>E&&pct>0&&pct<90);
    }
    [energy,barrier,width].forEach(input=>input.addEventListener('input',update));
    body.querySelector('#check-quantum').addEventListener('click',()=>{
      if(!body.querySelector('#check-quantum').disabled)markComplete('quantum','You found a case with non-zero tunneling through a higher barrier.');
    });
    update();
  }

  function initOrbit() {
    const canvas=body.querySelector('#orbit-canvas');
    const altitude=body.querySelector('#orbit-altitude');
    const speed=body.querySelector('#orbit-speed');
    const feedback=body.querySelector('.activity-feedback');
    const ctx=canvas.getContext('2d');
    const draw=()=>{
      const rect=canvas.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
      canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));
      ctx.scale(dpr,dpr);ctx.clearRect(0,0,rect.width,rect.height);
      const cx=rect.width/2,cy=rect.height/2,rEarth=23;
      const r0=1+Number(altitude.value)/100;
      const factor=Number(speed.value)/100;
      const scale=Math.min((rect.width*.44)/(r0+0.6),(rect.height*.42)/(r0+0.6));
      let x=r0,y=0,vx=0,vy=Math.sqrt(1/r0)*factor, pts=[];
      const dt=.006;
      for(let i=0;i<2800;i++){
        const r=Math.hypot(x,y);if(r<=1||r>9)break;
        pts.push([cx+x*scale,cy-y*scale]);
        const ax=-x/(r*r*r),ay=-y/(r*r*r);
        vx+=ax*dt;vy+=ay*dt;x+=vx*dt;y+=vy*dt;
      }
      ctx.strokeStyle='#b793ff';ctx.lineWidth=1.5;ctx.beginPath();pts.forEach((pt,i)=>i?ctx.lineTo(...pt):ctx.moveTo(...pt));ctx.stroke();
      const earthSize=Math.min(rEarth,scale*.76);const gradient=ctx.createRadialGradient(cx-earthSize*.3,cy-earthSize*.35,2,cx,cy,earthSize*1.35);
      gradient.addColorStop(0,'#d9c7ff');gradient.addColorStop(.4,'#9470d6');gradient.addColorStop(1,'#26163d');
      ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(cx,cy,earthSize,0,Math.PI*2);ctx.fill();
      if(pts.length){const p=pts[pts.length-1];ctx.fillStyle='#d2fc70';ctx.beginPath();ctx.arc(p[0],p[1],4,0,Math.PI*2);ctx.fill();}
      body.querySelector('#altitude-value').textContent=`${Number(altitude.value)*10} km`;
      body.querySelector('#speed-value').textContent=`${factor.toFixed(2)}× circular speed`;
      const safe= factor>=.94&&factor<=1.06;
      feedback.innerHTML=safe?'<strong>Near-circular orbit.</strong> The sideways velocity balances gravity in this simplified two-body model.':'Adjust speed toward 1.00× circular speed and run the orbit again.';
      body.querySelector('#check-orbit').disabled=!safe;
    };
    [altitude,speed].forEach(input=>input.addEventListener('input',draw));
    body.querySelector('#run-orbit').addEventListener('click',draw);
    body.querySelector('#check-orbit').addEventListener('click',()=>{
      if(!body.querySelector('#check-orbit').disabled)markComplete('aerospace','You designed a near-circular orbit with gravity and sideways speed in balance.');
    });
    draw();
  }

  const activities = {
    biology: {
      title:'Trace one full heartbeat', label:'BIOLOGY · CIRCULATION', intro:'Follow blood through the four chambers and lungs. Then answer why the lungs are part of the loop.',
      html:`<div class="model-panel heart-panel"><div class="heart-visual">♥</div><div class="flow-copy"><div class="flow-meter"><i id="heart-meter"></i></div><strong id="heart-step"></strong><p id="heart-explain"></p></div></div><button class="btn activity-action" id="heart-next">Trace next step →</button><div id="heart-path" class="mini-note">Six stops make one complete circulation loop.</div><div id="heart-check" class="choice-grid" hidden><p class="wide-choice">Where does blood pick up oxygen?</p><button class="choice" data-heart-answer="lungs">In the lungs</button><button class="choice" data-heart-answer="heart">Inside the left ventricle</button></div>`, init:initHeart
    },
    cell: {
      title:'Build a working cell', label:'BIOLOGY · CELL SCIENCE', intro:'Tap an organelle to inspect its role. Find the structure that supplies most usable cellular energy.',
      html:`<div class="cell-lab"><div class="cell-drawing"><button class="organelle nucleus" data-organelle="nucleus">Nucleus</button><button class="organelle mito" data-organelle="mitochondrion">Mitochondrion</button><button class="organelle membrane" data-organelle="membrane">Membrane</button><button class="organelle ribosome" data-organelle="ribosome">Ribosome</button></div><div class="mini-note">A simplified animal cell model · select a structure</div></div>`, init:initCell
    },
    chemistry: {
      title:'Balance the reaction', label:'CHEMISTRY · CONSERVATION OF ATOMS', intro:'Use the coefficient controls to balance hydrogen reacting with oxygen to form water. This is a virtual model, not a real lab procedure.',
      html:`<div class="reaction-model"><div><input id="coef-h2" type="number" min="1" max="9" value="1" aria-label="Hydrogen coefficient"> H₂</div><b>+</b><div><input id="coef-o2" type="number" min="1" max="9" value="1" aria-label="Oxygen coefficient"> O₂</div><b>→</b><div><input id="coef-h2o" type="number" min="1" max="9" value="1" aria-label="Water coefficient"> H₂O</div></div><div class="atom-counts"><span>Reactants: <b id="left-h">2 H</b> · <b id="left-o">2 O</b></span><span>Products: <b id="right-h">2 H</b> · <b id="right-o">1 O</b></span></div><button class="btn activity-action" id="check-balance">Check atom balance</button><div class="mini-note">Adjust coefficients. The smallest whole-number solution is required to finish.</div>`, init:initChemistry
    },
    elements: {
      title:'Assemble an atom', label:'CHEMISTRY · ATOMIC STRUCTURE', intro:'Protons choose the element. Neutrons change the isotope. Electrons change the charge. Build neutral carbon-12.',
      html:`<div class="atom-builder"><div class="atom-readout"><strong id="element-symbol">H</strong><div><b id="element-name">Hydrogen</b><span id="atomic-number">Atomic number 1</span><span id="mass-number">Mass number 1</span><span id="charge-state">Net charge 0</span></div></div><p id="shell-model" class="mini-note"></p><div class="atom-controls"><div><b>Protons</b><button data-atom="proton" data-delta="-1">−</button><button data-atom="proton" data-delta="1">+</button></div><div><b>Neutrons</b><button data-atom="neutron" data-delta="-1">−</button><button data-atom="neutron" data-delta="1">+</button></div><div><b>Electrons</b><button data-atom="electron" data-delta="-1">−</button><button data-atom="electron" data-delta="1">+</button></div></div></div>`, init:initElements
    },
    math: {
      title:'Shape a quadratic', label:'MATHEMATICS · FUNCTIONS', intro:'Move the coefficients and watch the curve update. Set a negative leading coefficient, then explain the opening direction.',
      html:`<div class="graph-panel"><svg viewBox="0 0 360 230" role="img" aria-label="Interactive quadratic graph"><path d="M0 115H360M180 0V230" stroke="#ffffff38" stroke-dasharray="4 5"/><polyline id="function-path" fill="none" stroke="#d2fc70" stroke-width="3" points=""/></svg><strong id="math-equation"></strong><span id="math-c-value"></span></div><div class="slider-control"><label for="math-a">Leading coefficient <span id="math-a-value"></span></label><input id="math-a" type="range" min="-2" max="2" step="0.1" value="1"></div><div class="slider-control"><label for="math-b">Linear coefficient b</label><input id="math-b" type="range" min="-5" max="5" step="1" value="0"></div><div class="slider-control"><label for="math-c">Constant c</label><input id="math-c" type="range" min="-5" max="5" step="1" value="0"></div><button class="btn activity-action" id="check-math">Check my prediction</button>`, init:initMath
    },
    fractals: {
      title:'Grow a fractal tree', label:'MATHEMATICS · RECURSION', intro:'A single branching rule repeats at every new tip. Increase the recursion depth and observe how a simple rule creates detail.',
      html:`<canvas id="fractal-canvas" class="activity-canvas" aria-label="Generated branching fractal"></canvas><div class="slider-control"><label for="fractal-depth">Recursion depth</label><input id="fractal-depth" type="range" min="1" max="8" step="1" value="4"><span id="fractal-depth-value"></span></div><div class="slider-control"><label for="fractal-angle">Branch angle</label><input id="fractal-angle" type="range" min="15" max="60" step="1" value="32"></div><button class="btn activity-action" id="check-fractal">Complete the pattern mission</button>`, init:initFractal
    },
    quantum: {
      title:'Can a particle cross a barrier?', label:'QUANTUM · TUNNELING MODEL', intro:'Set the particle energy below the barrier. Change its width and see how the estimated tunneling probability responds. This is a qualitative teaching model, not a calibrated prediction.',
      html:`<div class="quantum-panel"><svg viewBox="0 0 400 110" role="img" aria-label="Wave amplitude decays through a barrier"><line x1="0" y1="55" x2="400" y2="55" stroke="#ffffff30"/><rect id="quantum-barrier" x="175" y="16" width="30" height="78" rx="4" fill="#d2fc7040" stroke="#d2fc70"/><polyline id="quantum-wave" fill="none" stroke="#c4a5ff" stroke-width="3" points=""/></svg><div class="transmission">Estimated transmission <strong id="transmission-value">0%</strong></div></div><div class="slider-control"><label for="particle-energy">Particle energy <span id="energy-value"></span></label><input id="particle-energy" type="range" min="20" max="150" value="70"></div><div class="slider-control"><label for="barrier-height">Barrier height <span id="barrier-height-value"></span></label><input id="barrier-height" type="range" min="30" max="200" value="120"></div><div class="slider-control"><label for="barrier-width">Barrier width <span id="barrier-width-value"></span></label><input id="barrier-width" type="range" min="50" max="300" value="150"></div><button class="btn activity-action" id="check-quantum" disabled>Record this tunneling case</button>`, init:initQuantum
    },
    aerospace: {
      title:'Design a stable satellite orbit', label:'AEROSPACE · NEWTONIAN GRAVITY', intro:'Set altitude and orbital speed, then run the trajectory. The simulator numerically integrates a simplified two-body orbit; tune speed to approach a circular path.',
      html:`<canvas id="orbit-canvas" class="activity-canvas orbit-canvas" aria-label="Numerically simulated satellite path around Earth"></canvas><div class="slider-control"><label for="orbit-altitude">Altitude <span id="altitude-value"></span></label><input id="orbit-altitude" type="range" min="10" max="100" value="40"></div><div class="slider-control"><label for="orbit-speed">Orbital speed <span id="speed-value"></span></label><input id="orbit-speed" type="range" min="55" max="145" value="80"></div><button class="btn activity-action" id="run-orbit">Run trajectory</button><button class="btn dark activity-action" id="check-orbit" disabled>Save stable orbit</button><div class="mini-note">Model uses normalized units, a spherical Earth, and no atmosphere or other bodies.</div>`, init:initOrbit
    }
  };

  function openLab(id) {
    cancelAnimationFrame(orbitFrame);
    const item=activities[id]||activities.quantum;
    document.getElementById('modal-title').textContent=item.title;
    body.innerHTML=shell(id,item.title,item.label,item.intro,item.html);
    modal.classList.add('open');
    item.init();
    body.querySelector('.mission-reset').addEventListener('click',()=>openLab(id));
  }
  document.getElementById('hero-demo').addEventListener('click',()=>openLab('quantum'));
  document.getElementById('open-lab').addEventListener('click',()=>openLab('quantum'));
  document.getElementById('close-modal').addEventListener('click',()=>modal.classList.remove('open'));
  modal.addEventListener('click',event=>{if(event.target===modal)modal.classList.remove('open');});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')modal.classList.remove('open');});
  document.querySelectorAll('[data-mission]').forEach(button=>button.addEventListener('click',()=>openLab(button.dataset.mission)));
  document.querySelectorAll('.subject-tab').forEach(tab=>tab.addEventListener('click',()=>{
    document.querySelectorAll('.subject-tab').forEach(item=>item.classList.remove('active'));
    tab.classList.add('active');
    const choice=tab.dataset.subject;
    let shown=0;
    document.querySelectorAll('.mission[data-category]').forEach(card=>{
      const visible=choice==='all'||card.dataset.category===choice;
      card.hidden=!visible;if(visible)shown++;
    });
    document.getElementById('mission-count').textContent=`${shown} ${shown===1?'mission':'missions'} to explore · ${Object.values(progress).filter(item=>item?.completed).length} completed on this device`;
  }));
  document.querySelectorAll('[data-quantum]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-quantum]').forEach(item=>item.classList.remove('active'));
    button.classList.add('active');
    const core=document.getElementById('quantum-core'),readout=document.getElementById('energy-readout');
    const mode=button.dataset.quantum;
    core.style.transition='all .35s';
    core.style.transform=mode==='particle'?'scale(.22)':mode==='measure'?'scale(.65)':'scale(1)';
    core.style.filter=mode==='measure'?'blur(2px) hue-rotate(68deg)':'none';
    core.style.boxShadow=mode==='particle'?'0 0 32px #d2fc70':mode==='measure'?'0 0 95px #d2fc7069':'0 0 60px #b080ff4b';
    readout.textContent=mode==='wave'?'0.72 eV':mode==='particle'?'particle detected':'state measured';
  }));
  document.getElementById('notify-button').addEventListener('click',()=>notify('Launch updates are coming soon. Thanks for being curious!'));
  updateCompletedCards();
})();
