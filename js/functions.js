// Interactive function grapher
// Supports multiple function types and smooth parameter animation

(function () {
  // Application state: current displayed values and target values for smooth interpolation
  const appState = {
    mode: 'linear',
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

  // DOM references (may be null if elements are missing)
  const modeButtons = document.querySelectorAll('.func-select button');
  const formulaEl = document.querySelector('.formula-display');
  const sliders = document.querySelectorAll('.param');
  const trigFnSelect = document.querySelector('.param-trig-fn');
  const canvas = document.getElementById('func-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  // Utility: round number to two decimals and return string
  const fmt = v => (Math.round(v * 100) / 100).toString();

  // Safely retrieve a parameter value from appState
  function getParam(mode, name) {
    const m = appState[mode];
    if (!m) return 0;
    if (m.current && name in m.current) return m.current[name];
    if (m.target && name in m.target) return m.target[name];
    return 0;
  }

  // Set a target parameter value and start animation
  function setTarget(mode, name, value) {
    const m = appState[mode];
    if (!m) return;
    m.target[name] = value;
    // discrete values (like trig function name) update immediately
    if (typeof value === 'string') m.current[name] = value;
    startAnimationLoop();
  }

  // Update the displayed formula text based on current mode/parameters
  function updateFormula() {
    if (!formulaEl) return;
    const mode = appState.mode;
    if (mode === 'linear') {
      const k = getParam('linear', 'k'), b = getParam('linear', 'b');
      formulaEl.textContent = `y = ${fmt(k)}·x ${b >= 0 ? '+' : ''}${fmt(b)}`;
    } else if (mode === 'quadratic') {
      const a = getParam('quadratic', 'a'), b = getParam('quadratic', 'b'), c = getParam('quadratic', 'c');
      formulaEl.textContent = `y = ${fmt(a)}·x² ${b >= 0 ? '+' : ''}${fmt(b)}·x ${c >= 0 ? '+' : ''}${fmt(c)}`;
    } else if (mode === 'inverse') {
      const k = getParam('inverse', 'k');
      formulaEl.textContent = `y = ${fmt(k)} / x`;
    } else if (mode === 'power') {
      const a = getParam('power', 'a'), b = getParam('power', 'b');
      formulaEl.textContent = `y = ${fmt(a)}·x^${fmt(b)}`;
    } else if (mode === 'root') {
      const a = getParam('root', 'a'), n = getParam('root', 'n');
      formulaEl.textContent = `y = ${fmt(a)}·√[${fmt(n)}]{x}`;
    } else if (mode === 'exp') {
      const a = getParam('exp', 'a'), base = getParam('exp', 'base');
      formulaEl.textContent = `y = ${fmt(a)}·${fmt(base)}^x`;
    } else if (mode === 'log') {
      const a = getParam('log', 'a'), base = getParam('log', 'base'), c = getParam('log', 'c');
      formulaEl.textContent = `y = ${fmt(a)}·log_${fmt(base)}(x) ${c >= 0 ? '+' : ''}${fmt(c)}`;
    } else if (mode === 'trig') {
      const fn = getParam('trig', 'fn'), A = getParam('trig', 'A'), B = getParam('trig', 'B'), C = getParam('trig', 'C');
      formulaEl.textContent = `y = ${fmt(A)}·${fn}(${fmt(B)}·x ${C >= 0 ? '+' : ''}${fmt(C)})`;
    }
  }

  // Switch active function mode and update UI
  function setMode(mode) {
    appState.mode = mode;
    document.body.classList.remove('mode-linear', 'mode-quadratic', 'mode-inverse', 'mode-power', 'mode-root', 'mode-exp', 'mode-log', 'mode-trig');
    document.body.classList.add('mode-' + mode);
    document.querySelectorAll('.param-group').forEach(g => { g.style.display = (g.dataset.mode === mode) ? 'block' : 'none'; });
    modeButtons.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    updateFormula();
    draw();
  }

  // Handle numeric slider input
  function onSlider(e) {
    const input = e.target;
    const mode = input.dataset.mode;
    const name = input.name;
    const val = parseFloat(input.value);
    setTarget(mode, name, val);
    const label = input.parentElement.querySelector('.param-value');
    if (label) label.textContent = val;
  }

  // Handle trig function select change
  function onTrigFnChange(e) {
    const fn = e.target.value;
    setTarget('trig', 'fn', fn);
    updateFormula();
    draw();
  }

  // Resize canvas for high-DPI screens
  function fitCanvas() {
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // Evaluate the currently selected function at x
  function evalFunc(x) {
    const mode = appState.mode;
    const get = (m, n) => getParam(m, n);
    try {
      if (mode === 'linear') {
        const k = get('linear', 'k'), b = get('linear', 'b'); return k * x + b;
      }
      if (mode === 'quadratic') {
        const a = get('quadratic', 'a'), b = get('quadratic', 'b'), c = get('quadratic', 'c'); return a * x * x + b * x + c;
      }
      if (mode === 'inverse') {
        const k = get('inverse', 'k'); return x === 0 ? NaN : k / x;
      }
      if (mode === 'power') {
        const a = get('power', 'a'), b = get('power', 'b'); return Math.sign(x) * Math.pow(Math.abs(x), b) * a;
      }
      if (mode === 'root') {
        const a = get('root', 'a'), n = get('root', 'n'); if (x < 0 && n % 2 === 0) return NaN; return a * Math.pow(Math.abs(x), 1 / n) * (x < 0 ? -1 : 1);
      }
      if (mode === 'exp') {
        const a = get('exp', 'a'), base = get('exp', 'base'); return a * Math.pow(base, x);
      }
      if (mode === 'log') {
        const a = get('log', 'a'), base = get('log', 'base'), c = get('log', 'c'); if (x <= 0) return NaN; return a * (Math.log(x) / Math.log(base)) + c;
      }
      if (mode === 'trig') {
        const fn = get('trig', 'fn'), A = get('trig', 'A'), B = get('trig', 'B'), C = get('trig', 'C');
        const arg = B * x + C;
        if (fn === 'sin') return A * Math.sin(arg);
        if (fn === 'cos') return A * Math.cos(arg);
        if (fn === 'tan') return A * Math.tan(arg);
      }
    } catch (err) {
      return NaN;
    }
    return NaN;
  }

  // Draw graph to canvas
  function draw() {
    if (!ctx) return;
    fitCanvas();

    const w = canvas.width, h = canvas.height;
    const clientW = canvas.clientWidth, clientH = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    const pad = 40;
    const plotW = clientW - pad * 2;
    const plotH = clientH - pad * 2;

    const xMin = -10, xMax = 10;
    const samples = 800;

    // Sample function values to determine vertical range
    let yMin = Infinity, yMax = -Infinity;
    const points = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = xMin + (xMax - xMin) * t;
      const y = evalFunc(x);
      points.push({ x, y });
      if (Number.isFinite(y)) {
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }

    if (!isFinite(yMin) || !isFinite(yMax)) { yMin = -10; yMax = 10; }
    if (Math.abs(yMax - yMin) < 1e-6) { yMax = yMin + 1; }
    const yPad = (yMax - yMin) * 0.12;
    yMin -= yPad; yMax += yPad;

    const sx = x => pad + ((x - xMin) / (xMax - xMin)) * plotW;
    const sy = y => pad + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      const xpx = sx(gx);
      ctx.beginPath(); ctx.moveTo(xpx, pad); ctx.lineTo(xpx, pad + plotH); ctx.stroke();
    }

    const yStep = Math.max(1, Math.round((yMax - yMin) / 8));
    for (let gy = Math.floor(yMin); gy <= Math.ceil(yMax); gy += yStep) {
      const ypx = sy(gy);
      ctx.beginPath(); ctx.moveTo(pad, ypx); ctx.lineTo(pad + plotW, ypx); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5;
    if (xMin <= 0 && xMax >= 0) { const x0 = sx(0); ctx.beginPath(); ctx.moveTo(x0, pad); ctx.lineTo(x0, pad + plotH); ctx.stroke(); }
    if (yMin <= 0 && yMax >= 0) { const y0 = sy(0); ctx.beginPath(); ctx.moveTo(pad, y0); ctx.lineTo(pad + plotW, y0); ctx.stroke(); }

    // Plot function curve
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath();
    let started = false;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (!isFinite(p.y)) { started = false; continue; }
      const xpx = sx(p.x); const ypx = sy(p.y);
      if (!started) { ctx.moveTo(xpx, ypx); started = true; } else { ctx.lineTo(xpx, ypx); }
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '12px Inter, sans-serif';
    ctx.fillText('x', pad + plotW - 10, pad + plotH + 18);
    ctx.fillText('y', pad - 18, pad + 10);
  }

  // Animation loop: ease numeric parameters toward their targets
  let rafId = null;
  function startAnimationLoop() {
    if (appState.animating) return;
    appState.animating = true;

    function step() {
      let changed = false;

      for (const key of Object.keys(appState)) {
        if (key === 'mode' || key === 'animating') continue;
        const group = appState[key];
        if (!group || !group.current || !group.target) continue;
        for (const k of Object.keys(group.target)) {
          const t = group.target[k];
          const cur = group.current[k];
          if (typeof t === 'number') {
            const next = cur + (t - cur) * 0.16;
            if (Math.abs(next - cur) > 1e-4) { group.current[k] = next; changed = true; }
            else if (cur !== t) { group.current[k] = t; changed = true; }
          } else if (typeof t === 'string') {
            if (cur !== t) { group.current[k] = t; changed = true; }
          }
        }
      }

      if (changed) {
        updateFormula();
        draw();
        rafId = requestAnimationFrame(step);
      } else {
        appState.animating = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    rafId = requestAnimationFrame(step);
  }

  // Initialize event listeners and set initial UI state
  function init() {
    if (!formulaEl || !canvas || !ctx) return;

    modeButtons.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    sliders.forEach(s => s.addEventListener('input', onSlider));
    if (trigFnSelect) trigFnSelect.addEventListener('change', onTrigFnChange);

    sliders.forEach(s => {
      const lbl = s.parentElement.querySelector('.param-value'); if (lbl) lbl.textContent = s.value;
    });

    if (trigFnSelect) trigFnSelect.value = appState.trig.current.fn;

    setMode(appState.mode);
    draw();
    window.addEventListener('resize', draw);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
