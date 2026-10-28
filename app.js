/* =========================================================
   公共层：DOM 工具、音效、Toast、页面切换
   ========================================================= */
window.App = (function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  /* ---------------- 音效 ---------------- */
  const Sound = (function () {
    let ctx = null;
    let enabled = true;
    try {
      enabled = localStorage.getItem('v50.sound') !== 'off';
    } catch (e) { /* ignore */ }

    function ac() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      return ctx;
    }

    function tone(opt) {
      if (!enabled) return;
      const c = ac();
      if (!c) return;
      const { freq = 220, type = 'sine', dur = 0.12, gain = 0.045, slideTo = null, delay = 0 } = opt || {};
      const t0 = c.currentTime + delay;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    return {
      get enabled() { return enabled; },
      toggle() {
        enabled = !enabled;
        try { localStorage.setItem('v50.sound', enabled ? 'on' : 'off'); } catch (e) {}
        if (enabled) this.unlock();
        return enabled;
      },
      unlock() {
        const c = ac();
        if (c && c.state === 'suspended') c.resume();
      },
      click() { tone({ freq: 520, type: 'triangle', dur: 0.05, gain: 0.04 }); },
      deny() { tone({ freq: 180, type: 'sine', dur: 0.14, gain: 0.04, slideTo: 110 }); },
      play() { tone({ freq: 400, type: 'triangle', dur: 0.09, gain: 0.045, slideTo: 640 }); },
      swing() { tone({ freq: 240, type: 'sine', dur: 0.08, gain: 0.03, slideTo: 150 }); },
      hit() { tone({ freq: 120, type: 'sine', dur: 0.12, gain: 0.035, slideTo: 60 }); },
      heal() { tone({ freq: 520, type: 'sine', dur: 0.18, gain: 0.035, slideTo: 800 }); },
      turn() { tone({ freq: 320, type: 'triangle', dur: 0.1, gain: 0.035, slideTo: 460 }); },
      shuffle() {
        tone({ freq: 300, type: 'triangle', dur: 0.06, gain: 0.03 });
        tone({ freq: 420, type: 'triangle', dur: 0.06, gain: 0.03, delay: 0.05 });
        tone({ freq: 560, type: 'triangle', dur: 0.08, gain: 0.03, delay: 0.1 });
      },
      coin() {
        tone({ freq: 880, type: 'triangle', dur: 0.07, gain: 0.04 });
        tone({ freq: 1320, type: 'triangle', dur: 0.09, gain: 0.035, delay: 0.06 });
      },
      pack() {
        [392, 523, 659, 784].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.22, gain: 0.04, delay: i * 0.08 }));
      },
      win() { [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.2, gain: 0.045, delay: i * 0.11 })); },
      lose() { [392, 311, 233].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.26, gain: 0.04, delay: i * 0.14 })); }
    };
  })();

  /* ---------------- Toast ---------------- */
  let toastTimer = 0;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 1600);
  }

  /* ---------------- 页面切换 ---------------- */
  function showScreen(id) {
    $$('.screen').forEach((el) => el.classList.toggle('is-active', el.id === id));
    document.body.classList.toggle('in-battle', id === 'screen-battle');
    window.scrollTo(0, 0);
  }
  function currentScreen() {
    const el = $('.screen.is-active');
    return el ? el.id : '';
  }

  /* ---------------- 通用弹窗 ---------------- */
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('is-open');
      el.setAttribute('aria-hidden', 'false');
    }
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
    }
  }

  return { $, $$, sleep, rand, pick, clamp, shuffle, Sound, toast, showScreen, currentScreen, openModal, closeModal };
})();
