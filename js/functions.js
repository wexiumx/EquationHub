(function(){
  // Smooth interactive plotting for functions page with many function types
  const state = {
    mode: 'linear',
    // For each mode store current (displayed) and target (desired) parameter values
    linear: { current: { k: 1, b: 0 }, target: { k: 1, b: 0 } },
    quadratic: { current: { a: 1, b: 0, c: 0 }, target: { a: 1, b: 0, c: 0 } },
    inverse: { current: { k: 1 }, target: { k: 1 } },
    power: { current: { a: 1, b: 2 }, target: { a: 1, b: 2 } },
    root: { current: { a: 1, n: 2 }, target: { a: 1, n: 2 } },
    exp: { current: { a: 1, base: 2 }, target: { a: 1, base: 2 } },
    log: { current: { a: 1, base: 2, c: 0 }, target: { a: 1, base: 2, c: 0 } },
    trig: { current: { fn: 'sin', A: 1, B: 1, C: 0 }, target: { fn: 'sin', A: 1, B: 1, C: 0 } },
    animating: false
  };

  // DOM
  const modeButtons = document.querySelectorAll('.func-select button');
  const formulaEl = document.querySelector('.formula-display');
  const sliders = document.querySelectorAll('.param');
  const trigFnSelect = document.querySelector('.param-trig-fn');
  const canvas = document.getElementById('func-canvas');
  const ctx = canvas.getContext('2d');

  function setMode(mode){
    state.mode = mode;
    document.body.classList.remove('mode-linear','mode-quadratic','mode-inverse','mode-power','mode-root','mode-exp','mode-log','mode-trig');
    document.body.classList.add('mode-'+mode);
    document.querySelectorAll('.param-group').forEach(g => g.style.display = g.dataset.mode === mode ? 'block' : 'none');
    modeButtons.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    updateFormula();
    // ensure canvas redraw
    draw();
  }

  function round(v){ return (Math.round(v*100)/100).toString(); }

  function getParam(mode, name){
    const m = state[mode];
    if(!m) return 0;
    return (m.current && (name in m.current)) ? m.current[name] : (m.target && m.target[name]) || 0;
  }

  function setTarget(mode, name, val){
    const m = state[mode];
    if(!m) return;
    if(!(name in m.target)) m.target[name] = val;
    else m.target[name] = val;
    // if it's a discrete (fn) set immediate current to avoid lag for selects
    if(typeof val === 'string') m.current[name] = val;
    startAnimationLoop();
  }

  function updateFormula(){
    const mode = state.mode;
    if(mode === 'linear'){
      const k = getParam('linear','k'), b = getParam('linear','b');
      formulaEl.textContent = `y = ${round(k)}·x ${b>=0?'+':''}${round(b)}`;
    } else if(mode === 'quadratic'){
      const a = getParam('quadratic','a'), b = getParam('quadratic','b'), c = getParam('quadratic','c');
      formulaEl.textContent = `y = ${round(a)}·x² ${b>=0?'+':''}${round(b)}·x ${c>=0?'+':''}${round(c)}`;
    } else if(mode === 'inverse'){
      const k = getParam('inverse','k');
      formulaEl.textContent = `y = ${round(k)} / x`;
    } else if(mode === 'power'){
      const a = getParam('power','a'), b = getParam('power','b');
      formulaEl.textContent = `y = ${round(a)}·x^${round(b)}`;
    } else if(mode === 'root'){
      const a = getParam('root','a'), n = getParam('root','n');
      formulaEl.textContent = `y = ${round(a)}·√[${round(n)}]{x}`;
    } else if(mode === 'exp'){
      const a = getParam('exp','a'), base = getParam('exp','base');
      formulaEl.textContent = `y = ${round(a)}·${round(base)}^x`;
    } else if(mode === 'log'){
      const a = getParam('log','a'), base = getParam('log','base'), c = getParam('log','c');
      formulaEl.textContent = `y = ${round(a)}·log_${round(base)}(x) ${c>=0?'+':''}${round(c)}`;
    } else if(mode === 'trig'){
      const fn = getParam('trig','fn'), A = getParam('trig','A'), B = getParam('trig','B'), C = getParam('trig','C');
      formulaEl.textContent = `y = ${round(A)}·${fn}(${round(B)}·x ${C>=0?'+':''}${round(C)})`;
    }
  }

  function onSlider(e){
    const input = e.target;
    const mode = input.dataset.mode;
    const name = input.name;
    const val = parseFloat(input.value);
    setTarget(mode, name, val);
    // update label immediately to reflect the chosen value
    const lbl = input.parentElement.querySelector('.param-value');
    if(lbl) lbl.textContent = val;
  }

  function onTrigFnChange(e){
    const fn = e.target.value;
    setTarget('trig', 'fn', fn);
    updateFormula();
    draw();
  }

  function fitCanvas(){
    const r = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * r);
    canvas.height = Math.round(rect.height * r);
    ctx.setTransform(r,0,0,r,0,0);
  }

  function evalFunc(x){
    const mode = state.mode;
    // helper to fetch current params
    const get = (m,n) => getParam(m,n);
    try {
      if(mode === 'linear'){
        const k = get('linear','k'), b = get('linear','b'); return k*x + b;
      } else if(mode === 'quadratic'){
        const a = get('quadratic','a'), b = get('quadratic','b'), c = get('quadratic','c'); return a*x*x + b*x + c;
      } else if(mode === 'inverse'){
        const k = get('inverse','k'); return x === 0 ? NaN : k / x;
      } else if(mode === 'power'){
        const a = get('power','a'), b = get('power','b'); return Math.sign(x) * Math.pow(Math.abs(x), b) * a;
      } else if(mode === 'root'){
        const a = get('root','a'), n = get('root','n'); if(x < 0 && n%2===0) return NaN; return a * Math.pow(Math.abs(x), 1 / n) * (x<0? -1 : 1);
      } else if(mode === 'exp'){
        const a = get('exp','a'), base = get('exp','base'); return a * Math.pow(base, x);
      } else if(mode === 'log'){
        const a = get('log','a'), base = get('log','base'), c = get('log','c'); if(x <= 0) return NaN;
        return a * (Math.log(x) / Math.log(base)) + c;
      } else if(mode === 'trig'){
        const fn = get('trig','fn'), A = get('trig','A'), B = get('trig','B'), C = get('trig','C');
        const arg = B * x + C;
        if(fn === 'sin') return A * Math.sin(arg);
        if(fn === 'cos') return A * Math.cos(arg);
        if(fn === 'tan') return A * Math.tan(arg);
      }
    } catch(err){
      return NaN;
    }
    return NaN;
  }

  function draw(){
    if(!ctx) return;
    fitCanvas();
    const w = canvas.width; const h = canvas.height;
    const lw = canvas.clientWidth; const lh = canvas.clientHeight;
    ctx.clearRect(0,0,w,h);

    const pad = 40;
    const plotW = lw - pad*2; const plotH = lh - pad*2;
    const xMin = -10, xMax = 10;
    const samples = 800;
    let yMin = Infinity, yMax = -Infinity;
    const ys = [];
    for(let i=0;i<=samples;i++){
      const t = i/samples;
      const x = xMin + (xMax - xMin)*t;
      const y = evalFunc(x);
      ys.push({x,y});
      if(y<yMin) yMin = y;
      if(y>yMax) yMax = y;
    }
    if(!isFinite(yMin) || !isFinite(yMax)) { yMin=-10; yMax=10; }
    if(Math.abs(yMax - yMin) < 1e-6){ yMax = yMin + 1; }
    const yPad = (yMax - yMin)*0.12;
    yMin -= yPad; yMax += yPad;

    function sx(x){ return pad + ((x - xMin)/(xMax-xMin))*plotW; }
    function sy(y){ return pad + plotH - ((y - yMin)/(yMax-yMin))*plotH; }

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for(let gx=Math.ceil(xMin); gx<=Math.floor(xMax); gx++){
      const xpx = sx(gx);
      ctx.beginPath(); ctx.moveTo(xpx, pad); ctx.lineTo(xpx, pad+plotH); ctx.stroke();
    }
    const yStep = Math.max(1, Math.round((yMax - yMin)/8));
    for(let gy=Math.floor(yMin); gy<=Math.ceil(yMax); gy+=yStep){
      const ypx = sy(gy);
      ctx.beginPath(); ctx.moveTo(pad, ypx); ctx.lineTo(pad+plotW, ypx); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5;
    if(xMin<=0 && xMax>=0){ const x0 = sx(0); ctx.beginPath(); ctx.moveTo(x0,pad); ctx.lineTo(x0,pad+plotH); ctx.stroke(); }
    if(yMin<=0 && yMax>=0){ const y0 = sy(0); ctx.beginPath(); ctx.moveTo(pad,y0); ctx.lineTo(pad+plotW,y0); ctx.stroke(); }

    // function
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath();
    let started=false;
    for(let i=0;i<ys.length;i++){
      const p = ys[i];
      if(!isFinite(p.y)) { started=false; continue; }
      const xpx = sx(p.x); const ypx = sy(p.y);
      if(!started){ ctx.moveTo(xpx, ypx); started=true; } else { ctx.lineTo(xpx, ypx); }
    }
    ctx.stroke();

    // labels
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '12px Inter, sans-serif';
    ctx.fillText('x', pad + plotW - 10, pad + plotH + 18);
    ctx.fillText('y', pad - 18, pad + 10);
  }

  // Smooth animation loop: interpolate current -> target
  let rafId = null;
  function startAnimationLoop(){
    if(state.animating) return;
    state.animating = true;
    function step(){
      let changed = false;
      // for each mode, ease current towards target for numeric keys
      for(const mName of Object.keys(state)){
        if(mName === 'mode' || mName === 'animating') continue;
        const m = state[mName];
        if(!m || !m.current || !m.target) continue;
        for(const k of Object.keys(m.target)){
          const t = m.target[k];
          const cur = m.current[k];
          if(typeof t === 'number'){
            // lerp numeric
            const next = cur + (t - cur) * 0.16;
            if(Math.abs(next - cur) > 1e-4){
              m.current[k] = next; changed = true;
            } else if(cur !== t){
              m.current[k] = t; changed = true;
            }
          } else if(typeof t === 'string'){
            // instant swap for discrete strings
            if(cur !== t){ m.current[k] = t; changed = true; }
          }
        }
      }
      if(changed){
        updateFormula();
        draw();
        rafId = requestAnimationFrame(step);
      } else {
        state.animating = false;
        if(rafId) cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
    rafId = requestAnimationFrame(step);
  }

  // init bindings
  function init(){
    if(!formulaEl || !canvas) return;
    modeButtons.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)) );
    sliders.forEach(s => s.addEventListener('input', onSlider));
    if(trigFnSelect) trigFnSelect.addEventListener('change', onTrigFnChange);

    // set starting labels
    sliders.forEach(s => {
      const lbl = s.parentElement.querySelector('.param-value'); if(lbl) lbl.textContent = s.value;
    });

    // ensure select initial value matches state
    if(trigFnSelect) trigFnSelect.value = state.trig.current.fn;

    setMode(state.mode);
    draw();
    window.addEventListener('resize', draw);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();