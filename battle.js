/* =========================================================
   战斗引擎：5 条战线 / 能量 / 关键词 / 弃牌 / 群友 AI
   ========================================================= */
window.Battle = (function () {
  'use strict';

  const D = window.CT;
  const { $, $$, sleep, rand, shuffle, toast, Sound, showScreen } = window.App;
  const other = (side) => (side === 'player' ? 'enemy' : 'player');
  const nameOf = (side) => (side === 'player' ? '你' : (state ? state.opponent.name : '对手'));

  const HAND_SOFT = 10;
  const HAND_HARD = 12;

  let state = null;
  let seenMinions = new Set();
  let pendingFloats = [];
  let hurtFlags = { player: false, enemy: false };
  let shakeTimer = 0;
  let logSeq = 0;
  let resultTimer = 0;
  let UID = 0;
  let tipEl = null;
  let tipUid = null;

  const RARITY_COLOR = {
    common: '#7C8794', rare: '#5AA6E0', epic: '#A87BE0', legendary: '#DCAE62'
  };

  /* =========================================================
     开局
     ========================================================= */
  function start(opponentId, opts) {
    const opp = D.OPPONENTS.find((o) => o.id === opponentId) || D.OPPONENTS[0];
    const runMode = !!(opts && opts.run);
    const run = runMode ? Store.currentRun() : null;
    const dedupeOnce = (list) => {
      const seen = new Set();
      return list.filter((id) => {
        const def = D.CARD_DEFS[id];
        if (!def || !def.once) return true;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    };
    const rawDeck = runMode ? Store.runDeck() : Store.deck();
    if (!rawDeck.length) {
      toast(runMode ? '冒险牌库为空' : '卡组需要 20 张，先去整理一下');
      return;
    }
    if (!runMode && rawDeck.length !== 20) {
      toast('卡组需要 20 张，先去整理一下');
      return;
    }
    const playerDeck = dedupeOnce(rawDeck);
    const startHp = run ? run.hp : D.HERO_DEFS.player.hp;
    const nodeType = (opts && opts.nodeType) || (runMode ? 'battle' : null);
    const hpScale = runMode ? ((D.MAP.hpScale && D.MAP.hpScale[nodeType]) || 1) : 1;
    const enemyDef = Object.assign({}, opp, { hp: Math.max(8, Math.round(opp.hp * hpScale)) });

    state = {
      turn: 1, phase: 'player', phaseText: '你的回合',
      busy: false, over: false, overKind: '', selected: null,
      opponent: opp, reward: 0, log: [], stats: { played: 0, dealt: 0, taken: 0, power: 0, discarded: 0 },
      runMode, nodeType, runFinished: false, discardReq: null,
      player: createSide('player', playerDeck, null, startHp),
      enemy: createSide('enemy', D.ENEMY_DECKS[opp.deckId] || D.ENEMY_DECKS.noob, enemyDef)
    };

    seenMinions = new Set();
    pendingFloats = [];
    hurtFlags = { player: false, enemy: false };
    logSeq = 0;
    $('#log').innerHTML = '';
    $('#sidePanel').classList.remove('is-open');
    document.body.classList.remove('log-open');
    hideTip();
    hideResult();
    showScreen('screen-battle');

    drawCards('player', 4);
    drawCards('enemy', 4);
    beginPlayerTurn();
    log(`🍗 ${opp.name} 在群里发了一句：下次一定。`, 'muted');
    log('💡 出牌 → 结束回合 → 对手出牌 → 双方随从对撞 → 判定死亡 → 下一回合。', 'muted');
    render();
  }

  function createCard(defId) {
    const d = D.CARD_DEFS[defId];
    return {
      uid: ++UID, defId, name: d.name, emoji: d.emoji, cost: d.cost, type: d.type,
      rarity: d.rarity, effect: d.effect || null, draw: d.draw || 0, text: d.text || '',
      atk: d.atk || 0, hp: d.hp || 0, maxHp: d.hp || 0,
      armor: d.armor || 0, pierce: !!d.pierce, deadly: !!d.deadly,
      splash: d.splash || 0, afterlife: d.afterlife || null, antiHero: d.antiHero || 0,
      shield: d.shield || 0, target: d.target || null,
      lifesteal: !!d.lifesteal, deathHeal: d.deathHeal || 0,
      once: !!d.once, field: d.field || null
    };
  }

  function createSide(key, deckIds, opp, hpOverride) {
    const hero = key === 'player'
      ? Object.assign({}, D.HERO_DEFS.player)
      : { name: opp.name, tag: opp.tag, emoji: opp.emoji, hp: opp.hp, power: opp.power };
    hero.maxHp = hero.hp;
    const hp = key === 'player' ? (hpOverride || hero.hp) : hero.hp;
    return {
      hero, hp, energy: 0, shield: 0, fields: [],
      deck: shuffle(deckIds.map((id) => createCard(id))),
      hand: [], board: [null, null, null, null, null], powerUsed: false
    };
  }

  const energyFor = (turn) => Math.min(turn + 1, 10);

  /* =========================================================
     战报（增量渲染）
     ========================================================= */
  function log(text, cls) {
    if (!state) return;
    state.log.unshift({ id: ++logSeq, text, cls: cls || '' });
    if (state.log.length > 90) state.log.pop();
    renderLog();
  }

  function renderLog() {
    const el = $('#log');
    if (!el || !state) return;
    const existing = new Set();
    for (const child of el.children) existing.add(Number(child.dataset.id));
    for (let i = state.log.length - 1; i >= 0; i--) {
      const entry = state.log[i];
      if (existing.has(entry.id)) continue;
      const div = document.createElement('div');
      div.className = 'log-line is-new ' + entry.cls;
      div.dataset.id = entry.id;
      div.textContent = entry.text;
      el.insertBefore(div, el.firstChild);
      setTimeout(() => div.classList.remove('is-new'), 300);
    }
    while (el.children.length > 90) el.removeChild(el.lastChild);
  }

  /* =========================================================
     渲染
     ========================================================= */
  function render() {
    if (!state) return;
    renderHeroes();
    renderBoard();
    renderHand();
    renderEnergy();
    renderStatus();
    renderHint();
    renderFields();
    flushFloats();
  }

  function renderHeroes() {
    const pHurt = hurtFlags.player;
    const eHurt = hurtFlags.enemy;
    hurtFlags.player = false;
    hurtFlags.enemy = false;
    const pCard = $('#playerHeroCard');
    const eCard = $('#enemyHeroCard');
    pCard.className = 'hero-card' + (pHurt ? ' is-hurt' : '');
    eCard.className = 'hero-card' + (eHurt ? ' is-hurt' : '');
    pCard.innerHTML = heroHTML('player');
    eCard.innerHTML = heroHTML('enemy');
  }

  function heroHTML(side) {
    const s = state[side];
    const isP = side === 'player';
    const pct = Math.max(0, (s.hp / s.hero.maxHp) * 100);
    const power = s.hero.power;
    const ready = isP && !s.powerUsed && s.energy >= power.cost && !state.busy && state.phase === 'player' && !state.over;
    return `
      <div class="hero-face" data-hero="${side}">
        <span>${s.hero.emoji}</span>
        <i class="hero-hp">${s.hp}</i>
        ${s.shield > 0 ? `<i class="hero-shield" title="护盾：抵消伤害">🔰${s.shield}</i>` : ''}
      </div>
      <div class="hero-body">
        <div class="hero-line">
          <b class="hero-name">${s.hero.name}</b>
          <span class="hero-tag">${s.hero.tag || ''}</span>
        </div>
        <div class="hpbar"><i style="width:${pct}%"></i><b>${s.hp} / ${s.hero.maxHp}</b></div>
        <div class="hero-bottom">
          <button class="power${ready ? ' is-ready' : ''}" ${isP ? 'data-power="player"' : 'disabled'} title="${power.text}">
            <span>${power.emoji}</span><b>${power.name}</b><em>${power.cost}⚡</em>
          </button>
          <span class="hero-count">手 ${s.hand.length} · 牌 ${s.deck.length}</span>
        </div>
      </div>`;
  }

  function kwChips(m) {
    const out = [];
    if (m.armor) out.push(`<i class="kw" title="护甲：受到伤害 -${m.armor}">🛡${m.armor}</i>`);
    if (m.pierce) out.push('<i class="kw" title="穿透：打随从时也打英雄">➤</i>');
    if (m.deadly) out.push('<i class="kw" title="致命：伤害到的随从直接倒下">☠</i>');
    if (m.splash) out.push(`<i class="kw" title="溅射：攻击时对相邻战线造成 ${m.splash} 点伤害">✷${m.splash}</i>`);
    if (m.afterlife) out.push('<i class="kw" title="转世：倒下时召唤随从">♻</i>');
    if (m.antiHero) out.push(`<i class="kw" title="抗英雄：攻击英雄 +${m.antiHero}">🎯${m.antiHero}</i>`);
    if (m.shield) out.push(`<i class="kw" title="护盾：抵消下一次伤害">🔰${m.shield}</i>`);
    if (m.lifesteal) out.push('<i class="kw" title="吸血：造成伤害时回复等量生命">🩸</i>');
    if (m.deathHeal) out.push(`<i class="kw" title="亡语：倒下时回复生命">⚰️${m.deathHeal}</i>`);
    return out.length ? `<span class="m-kw">${out.join('')}</span>` : '';
  }

  function minionHTML(m, side) {
    const isNew = !seenMinions.has(m.uid);
    if (isNew) seenMinions.add(m.uid);
    return `<div class="minion ${side} rar-${m.rarity}${isNew ? ' is-new' : ''}" data-uid="${m.uid}">
      <span class="m-atk">${m.atk}</span>
      <span class="m-art">${m.emoji}</span>
      <span class="m-body">
        <span class="m-name">${m.name}</span>
        ${kwChips(m)}
      </span>
      <span class="m-hp${m.hp < m.maxHp ? ' is-hurt' : ''}">${Math.max(0, m.hp)}</span>
    </div>`;
  }

  function renderBoard() {
    const board = $('#board');
    if (!board) return;
    const sel = getSelected();
    const casting = !!sel && sel.type !== 'minion' && !sel.target;
    board.classList.toggle('is-casting', casting);

    let html = '';
    for (let i = 0; i < 5; i++) {
      const pm = state.player.board[i];
      const em = state.enemy.board[i];
      const canPlace = !!sel && sel.type === 'minion' && !pm;
      const aimEnemy = !!sel && sel.target === 'enemyMinion' && !!em;
      const aimAlly = !!sel && sel.target === 'allyMinion' && !!pm;
      html += `<div class="lane${canPlace ? ' is-live' : ''}">
        <div class="slot slot-p${canPlace ? ' is-active' : ''}${aimAlly ? ' is-target' : ''}" data-side="player" data-lane="${i}">
          ${pm ? minionHTML(pm, 'player') : '<span class="slot-ghost"></span>'}
        </div>
        <div class="lane-num">${i + 1}</div>
        <div class="slot slot-e${casting && !sel.target ? ' is-active' : ''}${aimEnemy ? ' is-target' : ''}" data-side="enemy" data-lane="${i}">
          ${em ? minionHTML(em, 'enemy') : '<span class="slot-ghost"></span>'}
        </div>
      </div>`;
    }
    board.innerHTML = html;
    if (tipUid != null && !document.querySelector(`.minion[data-uid="${tipUid}"]`)) hideTip();
  }

  function renderHand() {
    const wrap = $('#hand');
    if (!wrap) return;
    const hand = state.player.hand;
    wrap.classList.toggle('is-discarding', !!state.discardReq);
    if (!hand.length) {
      wrap.innerHTML = `<div class="hand-empty">${state.discardReq ? '手牌已空' : '手牌打完了，等着被 V 吧…'}</div>`;
      return;
    }
    wrap.innerHTML = `<div class="hand-inner">${hand.map(cardHTML).join('')}</div>`;
  }

  function kwTextOf(c) {
    return D.keywordsOf(c).join(' · ');
  }

  function cardHTML(c) {
    const sel = state.selected === c.uid;
    const poor = c.cost > state.player.energy;
    const kw = kwTextOf(c);
    const kind = c.type === 'spell' ? '法术' : c.type === 'field' ? '场地' : c.type === 'item' ? '道具' : '';
    const isCast = c.type !== 'minion';
    return `<button class="card rar-${c.rarity}${c.type === 'spell' ? ' is-spell' : ''}${c.type === 'field' ? ' is-field' : ''}${c.type === 'item' ? ' is-item' : ''}${sel ? ' is-selected' : ''}${poor ? ' is-poor' : ''}"
              data-uid="${c.uid}" title="${c.text}">
      <span class="c-cost">${c.cost}</span>
      ${c.once ? '<span class="c-once">一次</span>' : ''}
      <span class="c-art">${c.emoji}</span>
      <span class="c-name">${c.name}</span>
      ${kw ? `<span class="c-kw">${kw}</span>` : ''}
      <span class="c-text">${c.text}</span>
      ${isCast ? `<span class="c-kind">${kind}</span>` : `<span class="c-atk">${c.atk}</span><span class="c-hp">${c.hp}</span>`}
    </button>`;
  }

  function renderEnergy() {
    const el = $('#energyBar');
    if (!el) return;
    const en = state.player.energy;
    let pips = '';
    for (let i = 0; i < 10; i++) pips += `<i class="${i < en ? 'on' : ''}"></i>`;
    el.innerHTML = `<span class="en-orb">⚡</span><b class="en-num">${en}</b><span class="en-max">/10</span><span class="en-pips">${pips}</span>`;
  }

  function renderFields() {
    const el = $('#fieldBar');
    if (!el) return;
    const p = state.player.fields || [];
    const e = state.enemy.fields || [];
    if (!p.length && !e.length) { el.innerHTML = ''; el.classList.remove('is-on'); return; }
    const chip = (f, side) => {
      const parts = [];
      if (f.field && f.field.atk) parts.push(`+${f.field.atk}攻`);
      if (f.field && f.field.hp) parts.push(`+${f.field.hp}血`);
      return `<span class="field-chip ${side}" title="${f.name}">${f.emoji}<b>${parts.join(' ')}</b></span>`;
    };
    el.innerHTML = `<div class="field-side left">${p.map((f) => chip(f, 'p')).join('')}</div>
      <div class="field-side right">${e.map((f) => chip(f, 'e')).join('')}</div>`;
    el.classList.add('is-on');
  }

  function renderStatus() {
    const num = $('#turnNum');
    if (!num) return;
    num.textContent = state.turn;
    $('#turnPhase').textContent = state.phaseText || '';
    const btn = $('#endTurnBtn');
    btn.disabled = state.busy || state.phase !== 'player' || state.over || !!state.discardReq;
    btn.classList.toggle('is-waiting', state.busy);

    const banner = $('#discardBanner');
    if (banner) {
      if (state.discardReq) {
        const left = state.discardReq.need - state.discardReq.done;
        banner.innerHTML = `手牌超过 10 张 · 点手牌弃掉 <b>${left}</b> 张`;
        banner.classList.add('is-on');
      } else {
        banner.classList.remove('is-on');
      }
    }
  }

  function renderHint() {
    const hint = $('#boardHint');
    if (!hint) return;
    const sel = getSelected();
    if (!sel) {
      hint.classList.remove('is-on');
      return;
    }
    hint.innerHTML = sel.target
      ? `点击一个${sel.target === 'enemyMinion' ? '敌方' : '己方'}随从释放 <b>${sel.name}</b>`
      : (sel.type === 'minion'
        ? `选择一条空战线召唤 <b>${sel.name}</b>`
        : `点击战场施放 <b>${sel.name}</b>`);
    hint.classList.add('is-on');
  }

  function flushFloats() {
    if (!pendingFloats.length) return;
    const list = pendingFloats;
    pendingFloats = [];
    list.forEach((f) => {
      const host = document.querySelector(f.selector);
      if (!host) return;
      const el = document.createElement('span');
      el.className = 'float-text ' + (f.cls || '');
      el.textContent = f.text;
      host.appendChild(el);
      setTimeout(() => el.remove(), 900);
    });
  }

  function getSelected() {
    if (!state || state.selected == null) return null;
    return state.player.hand.find((c) => c.uid === state.selected) || null;
  }

  /* =========================================================
     单位提示（tooltip）
     ========================================================= */
  function unitByUid(uid) {
    if (!state) return null;
    for (const side of ['player', 'enemy']) {
      for (let i = 0; i < 5; i++) {
        const m = state[side].board[i];
        if (m && m.uid === uid) return { m, side, lane: i };
      }
    }
    return null;
  }

  function showTip(el) {
    const uid = Number(el.dataset.uid);
    const found = unitByUid(uid);
    if (!found || !state) return;
    const m = found.m;
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.className = 'unit-tip';
      document.getElementById('app').appendChild(tipEl);
    }
    const kws = D.keywordsOf(m);
    const role = D.CARD_DEFS[m.defId] ? (D.CARD_DEFS[m.defId].role || '') : '';
    tipEl.innerHTML = `
      <div class="ut-head">
        <span class="ut-emoji">${m.emoji}</span>
        <b>${m.name}</b>
        <em style="color:${RARITY_COLOR[m.rarity]}">${D.RARITY[m.rarity].name}</em>
      </div>
      <div class="ut-stats"><span class="ut-atk">⚔ ${m.atk}</span><span class="ut-hp">❤ ${m.hp}/${m.maxHp}</span></div>
      ${kws.length ? `<div class="ut-kw">${kws.map((k) => `<i>${k}</i>`).join('')}</div>` : ''}
      <div class="ut-text">${m.text || ''}</div>
      ${role ? `<div class="ut-role">定位：${role}</div>` : ''}`;
    tipEl.classList.add('is-on');
    tipUid = uid;

    const r = el.getBoundingClientRect();
    const tw = 212;
    const th = tipEl.offsetHeight || 110;
    let left = Math.min(Math.max(8, r.left + r.width / 2 - tw / 2), window.innerWidth - tw - 8);
    let top = r.top - th - 10;
    if (top < 8) top = r.bottom + 10;
    tipEl.style.left = left + 'px';
    tipEl.style.top = top + 'px';
  }

  function hideTip() {
    if (tipEl) tipEl.classList.remove('is-on');
    tipUid = null;
  }

  /* =========================================================
     交互
     ========================================================= */
  function selectCard(uid) {
    if (!state || state.over) return;
    if (state.discardReq) { discardOne(uid); return; }
    if (state.busy || state.phase !== 'player') return;
    const card = state.player.hand.find((c) => c.uid === uid);
    if (!card) return;
    if (card.cost > state.player.energy) {
      toast('能量不够，先 V 我 50');
      Sound.deny();
      return;
    }
    if (card.target) {
      const list = card.target === 'enemyMinion' ? state.enemy.board.filter(Boolean) : state.player.board.filter(Boolean);
      if (!list.length) {
        toast(card.target === 'enemyMinion' ? '对面没有随从可以点名' : '先放一个随从再上盾');
        Sound.deny();
        return;
      }
    }
    state.selected = state.selected === uid ? null : uid;
    Sound.click();
    render();
  }

  function onSlotClick(side, lane) {
    if (!state || state.busy || state.over || state.phase !== 'player') return;
    const sel = getSelected();
    if (!sel) return;
    if (sel.type !== 'minion') {
      playCard('player', sel.uid, -1);
      return;
    }
    if (side !== 'player') {
      toast('随从只能放在自己的战线');
      Sound.deny();
      return;
    }
    if (state.player.board[lane]) {
      toast('这条战线已经有人了');
      Sound.deny();
      return;
    }
    playCard('player', sel.uid, lane);
  }

  function onBoardClick() {
    if (!state || state.busy || state.over || state.phase !== 'player') return;
    const sel = getSelected();
    if (!sel) return;
    if (sel.target) { toast('请点击一个随从作为目标'); return; }
    if (sel.type !== 'minion') playCard('player', sel.uid, -1);
    else toast('请选择一条空战线');
  }

  function onDocClick(ev) {
    const powerEl = ev.target.closest('[data-power]');
    if (powerEl) { usePower(powerEl.dataset.power); return; }

    const minionEl = ev.target.closest('.minion');
    const selNow = getSelected();
    if (minionEl && selNow && selNow.target) {
      const found = unitByUid(Number(minionEl.dataset.uid));
      const needSide = selNow.target === 'enemyMinion' ? 'enemy' : 'player';
      if (found && found.side === needSide) {
        playCard('player', selNow.uid, -1, found.m);
      } else {
        toast(needSide === 'enemy' ? '请选择一个敌方随从' : '请选择一个己方随从');
        Sound.deny();
      }
      return;
    }
    if (minionEl && !selNow) {
      showTip(minionEl);
      return;
    }

    const cardEl = ev.target.closest('.card[data-uid]');
    if (cardEl) { selectCard(Number(cardEl.dataset.uid)); return; }

    const slotEl = ev.target.closest('.slot');
    if (slotEl) { onSlotClick(slotEl.dataset.side, Number(slotEl.dataset.lane)); return; }

    if (ev.target.closest('#board')) { onBoardClick(); return; }

    if (state && state.selected != null && !ev.target.closest('.hand')) {
      state.selected = null;
      render();
    }
    if (!ev.target.closest('.unit-tip')) hideTip();
  }

  function onPointerOver(ev) {
    const el = ev.target.closest('.minion');
    if (el) showTip(el);
  }
  function onPointerOut(ev) {
    if (ev.target.closest('.minion')) hideTip();
  }

  function onKeyDown(ev) {
    if (window.App.currentScreen() !== 'screen-battle') return;
    if (ev.key === 'Escape') {
      if (state && state.selected != null) { state.selected = null; render(); }
      hideTip();
      return;
    }
    if (ev.key === 'Enter' || ev.key === ' ') {
      if (!state || state.busy || state.over || state.discardReq) return;
      ev.preventDefault();
      const sel = getSelected();
      if (sel && sel.type === 'spell') { playCard('player', sel.uid, -1); return; }
      if (state.phase === 'player') endTurn();
    }
  }

  /* =========================================================
     弃牌
     ========================================================= */
  function discardOne(uid) {
    if (!state.discardReq) return;
    const idx = state.player.hand.findIndex((c) => c.uid === uid);
    if (idx < 0) return;
    const card = state.player.hand.splice(idx, 1)[0];
    state.discardReq.done += 1;
    state.stats.discarded += 1;
    log(`🗑️ 弃掉【${card.name}】`, 'muted');
    Sound.deny();
    render();
    if (state.discardReq.done >= state.discardReq.need) {
      const resolve = state.discardReq.resolve;
      state.discardReq = null;
      render();
      Sound.click();
      resolve();
    }
  }

  /** 回合结束强制弃牌，返回 Promise */
  function discardToLimit() {
    return new Promise((resolve) => {
      const excess = state.player.hand.length - HAND_SOFT;
      if (excess <= 0) { resolve(); return; }
      state.discardReq = { need: excess, done: 0, resolve };
      state.phase = 'discard';
      state.phaseText = `弃牌 ${excess} 张`;
      render();
    });
  }

  function discardRandom(side, n) {
    const s = state[side];
    const out = [];
    for (let i = 0; i < n && s.hand.length; i++) {
      const idx = rand(s.hand.length);
      const c = s.hand.splice(idx, 1)[0];
      out.push(c);
      if (side === 'player') state.stats.discarded += 1;
      log(`🗑️ ${nameOf(side)} 弃掉【${c.name}】`, 'muted');
    }
    return out;
  }

  function aiDiscardToLimit() {
    while (state.enemy.hand.length > HAND_SOFT) discardRandom('enemy', 1);
  }

  /* =========================================================
     伤害 / 治疗
     ========================================================= */
  function damageHero(side, amount) {
    const s = state[side];
    if (s.hp <= 0) return 0;
    let incoming = Math.max(0, amount);
    if (!incoming) return 0;
    if (s.shield > 0) {
      const absorbed = Math.min(s.shield, incoming);
      s.shield -= absorbed;
      incoming -= absorbed;
      pendingFloats.push({ selector: `.hero-face[data-hero="${side}"]`, text: `护盾 -${absorbed}`, cls: 'shield' });
      Sound.heal();
      if (incoming <= 0) return 0;
    }
    const real = Math.min(s.hp, incoming);
    if (!real) return 0;
    s.hp -= real;
    if (side === 'enemy') state.stats.dealt += real;
    else state.stats.taken += real;
    hurtFlags[side] = true;
    pendingFloats.push({ selector: `.hero-face[data-hero="${side}"]`, text: `-${real}`, cls: '' });
    shake();
    Sound.hit();
    return real;
  }

  function healHero(side, amount) {
    const s = state[side];
    if (s.hp <= 0) return;
    const before = s.hp;
    s.hp = Math.min(s.hero.maxHp, s.hp + amount);
    const gain = s.hp - before;
    if (gain > 0) {
      pendingFloats.push({ selector: `.hero-face[data-hero="${side}"]`, text: `+${gain}`, cls: 'heal' });
      Sound.heal();
      log(`🧧 ${nameOf(side)} 回复 ${gain} 点生命`, 'good');
    }
  }

  function damageMinion(m, amount, source) {
    if (!m || m.hp <= 0) return 0;
    if (m.shield > 0) {
      m.shield -= 1;
      pendingFloats.push({ selector: `.minion[data-uid="${m.uid}"]`, text: '格挡', cls: 'block' });
      Sound.click();
      return 0;
    }
    let real;
    if (source && source.deadly) real = m.hp;
    else real = Math.min(Math.max(0, amount - (m.armor || 0)), m.hp);
    if (real <= 0) {
      pendingFloats.push({ selector: `.minion[data-uid="${m.uid}"]`, text: '0', cls: 'block' });
      return 0;
    }
    m.hp -= real;
    pendingFloats.push({ selector: `.minion[data-uid="${m.uid}"]`, text: `-${real}`, cls: '' });
    return real;
  }

  function splashDamage(side, lane, amount) {
    for (const l of [lane - 1, lane + 1]) {
      const t = state[side].board[l];
      if (t) damageMinion(t, amount, null);
    }
  }

  function shatterFX(el, rarity) {
    if (!el) return;
    const wrap = document.querySelector('.board-wrap');
    if (!wrap) return;
    const r = el.getBoundingClientRect();
    const wr = wrap.getBoundingClientRect();
    const cx = r.left - wr.left + r.width / 2;
    const cy = r.top - wr.top + r.height / 2;
    const color = RARITY_COLOR[rarity] || '#D9A94E';
    for (let i = 0; i < 11; i++) {
      const s = document.createElement('i');
      s.className = 'shard';
      const ang = (Math.PI * 2 * i) / 11 + Math.random() * 0.6;
      const dist = 24 + Math.random() * 52;
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      s.style.background = color;
      s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      s.style.setProperty('--rot', (Math.random() * 320 - 160) + 'deg');
      s.style.width = 4 + Math.random() * 5 + 'px';
      s.style.height = 4 + Math.random() * 5 + 'px';
      wrap.appendChild(s);
      setTimeout(() => s.remove(), 700);
    }
    const ring = document.createElement('i');
    ring.className = 'shatter-ring';
    ring.style.left = cx + 'px';
    ring.style.top = cy + 'px';
    ring.style.borderColor = color;
    wrap.appendChild(ring);
    setTimeout(() => ring.remove(), 520);
  }

  async function cleanupDeaths() {
    const dead = [];
    for (const side of ['player', 'enemy']) {
      for (let i = 0; i < 5; i++) {
        const m = state[side].board[i];
        if (m && m.hp <= 0) {
          dead.push([side, i, m]);
          state[side].board[i] = null;
        }
      }
    }
    if (!dead.length) return;
    dead.forEach(([side, , m]) => {
      const el = document.querySelector(`.minion[data-uid="${m.uid}"]`);
      if (el) {
        shatterFX(el, m.rarity);
        el.classList.add('is-dead');
      }
      log(`☠️ ${m.name} 碎了一地`, 'muted');
      if (m.deathHeal) {
        healHero(side, m.deathHeal);
        log(`🧓 ${m.name} 的亡语：己方英雄回复 ${m.deathHeal} 点`, 'good');
      }
    });
    render();
    await sleep(320);
    dead.forEach(([side, i, m]) => {
      if (m.afterlife && !state[side].board[i]) {
        const token = createCard(m.afterlife);
        buffByField(side, token);
        state[side].board[i] = token;
        log(`♻️ ${m.name} 转世：召唤了 ${D.CARD_DEFS[m.afterlife].name}`, 'good');
      }
    });
    render();
  }

  function shake() {
    document.body.classList.add('is-shaking');
    clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => document.body.classList.remove('is-shaking'), 300);
  }

  /* =========================================================
     出牌
     ========================================================= */
  function drawCards(side, n) {
    const s = state[side];
    for (let i = 0; i < n; i++) {
      if (!s.deck.length) { log('牌库空了，抽不到牌', 'muted'); return; }
      if (s.hand.length >= HAND_HARD) {
        log(`🖐 手牌已满（${HAND_HARD} 张），抽不到更多了`, 'muted');
        return;
      }
      s.hand.push(s.deck.pop());
    }
  }

  function fieldBonus(side) {
    const list = (state[side] && state[side].fields) || [];
    let atk = 0;
    let hp = 0;
    list.forEach((f) => { atk += (f.field && f.field.atk) || 0; hp += (f.field && f.field.hp) || 0; });
    return { atk, hp };
  }

  function buffByField(side, m) {
    const b = fieldBonus(side);
    if (!b.atk && !b.hp) return;
    m.atk += b.atk;
    m.hp += b.hp;
    m.maxHp += b.hp;
  }

  function applyField(side, card) {
    const st = state[side];
    if (!st.fields) st.fields = [];
    st.fields.push({ defId: card.defId, name: card.name, emoji: card.emoji, field: card.field || {} });
    st.board.filter(Boolean).forEach((m) => {
      m.atk += (card.field && card.field.atk) || 0;
      m.hp += (card.field && card.field.hp) || 0;
      m.maxHp += (card.field && card.field.hp) || 0;
    });
  }

  function summonMinion(side, defId, buff) {
    const s = state[side];
    const lane = s.board.findIndex((x) => !x);
    if (lane < 0) return false;
    const m = createCard(defId);
    if (buff) { m.atk += buff.atk || 0; m.hp += buff.hp || 0; m.maxHp += buff.hp || 0; }
    buffByField(side, m);
    s.board[lane] = m;
    return true;
  }

  function playCard(side, uid, lane, target) {
    const s = state[side];
    const idx = s.hand.findIndex((c) => c.uid === uid);
    if (idx < 0) return false;
    const card = s.hand[idx];
    if (card.cost > s.energy) return false;

    if (card.type === 'minion') {
      if (lane == null || lane < 0 || s.board[lane]) return false;
      s.hand.splice(idx, 1);
      s.energy -= card.cost;
      buffByField(side, card);
      s.board[lane] = card;
      state.stats.played++;
      log(`${card.emoji} ${nameOf(side)} 打出【${card.name}】`, side === 'player' ? 'player' : 'enemy');
      battlecry(side, card);
      Sound.play();
      if (side === 'player') state.selected = null;
      render();
      cleanupDeaths();
      checkOver();
      return true;
    }

    if (card.target && !target) return false;

    if (card.type === 'field') {
      s.hand.splice(idx, 1);
      s.energy -= card.cost;
      state.stats.played++;
      log(`${card.emoji} ${nameOf(side)} 布置场地【${card.name}】`, side === 'player' ? 'player' : 'enemy');
      showSpellCast(side, card);
      applyField(side, card);
      Sound.play();
      if (side === 'player') state.selected = null;
      render();
      checkOver();
      return true;
    }

    s.hand.splice(idx, 1);
    s.energy -= card.cost;
    state.stats.played++;
    log(`${card.emoji} ${nameOf(side)} 使用【${card.name}】`, side === 'player' ? 'player' : 'enemy');
    showSpellCast(side, card);
    resolveSpell(side, card, target);
    if (side === 'player') state.selected = null;
    Sound.play();
    render();
    cleanupDeaths();
    checkOver();
    return true;
  }

  function showSpellCast(side, card) {
    const wrap = document.querySelector('.board-wrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'spell-cast ' + side;
    el.innerHTML = `<span class="sc-side">${nameOf(side)}</span>
      <b class="sc-name">${card.emoji} ${card.name}</b>
      <em class="sc-text">${(card.text || '').split('。')[0]}</em>`;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-on'));
    setTimeout(() => { el.classList.remove('is-on'); setTimeout(() => el.remove(), 260); }, 1400);
  }

  function battlecry(side, m) {
    const e = m.effect;
    if (!e) return;
    if (e.type === 'battlecryDamageHero') {
      damageHero(other(side), e.value);
      log(`💥 ${m.name} 入场：直击英雄 -${e.value}`, 'dmg');
    } else if (e.type === 'battlecryHealHero') {
      healHero(side, e.value);
    } else if (e.type === 'battlecryDraw') {
      drawCards(side, e.value || 1);
      if (e.heal) healHero(side, e.heal);
      log(`🃏 ${m.name} 入场：抽 ${e.value || 1} 张牌`, 'good');
    } else if (e.type === 'battlecryDamageAllEnemies') {
      state[other(side)].board.filter(Boolean).forEach((t) => damageMinion(t, e.value, null));
      log(`💥 ${m.name} 入场：全体敌方随从 -${e.value}`, 'dmg');
    } else if (e.type === 'battlecrySummon') {
      const ok = summonMinion(side, e.token);
      log(ok ? `📦 ${m.name} 入场：召唤 ${D.CARD_DEFS[e.token].name}` : '战线已满，召唤失败', ok ? 'good' : 'muted');
    } else if (e.type === 'battlecryGainEnergy') {
      state[side].energy = Math.min(10, state[side].energy + e.value);
      log(`🔋 ${m.name} 入场：本回合 +${e.value} 能量`, 'good');
    } else if (e.type === 'battlecryDiscard') {
      const got = discardRandom(side, e.value || 1);
      if (e.draw) drawCards(side, e.draw);
      log(`🗑️ ${m.name} 入场：弃 ${got.length} 张${e.draw ? `，抽 ${e.draw} 张` : ''}`, 'muted');
    }
  }

  function resolveSpell(side, card, target) {
    const foe = other(side);
    const e = card.effect || {};
    switch (e.type) {
      case 'damageHero':
        log(`🎯 ${card.name} 命中 ${nameOf(foe)}，-${e.value}`, 'dmg');
        damageHero(foe, e.value);
        break;
      case 'healHero':
        healHero(side, e.value);
        break;
      case 'drain':
        log(`🍜 ${card.name}：吸 ${e.value} 点血`, 'dmg');
        damageHero(foe, e.value);
        healHero(side, e.value);
        break;
      case 'damageBothHeroes':
        log(`📞 ${card.name}：双方英雄都跑不掉`, 'dmg');
        damageHero(foe, e.value);
        damageHero(side, e.self || 0);
        break;
      case 'summon': {
        let n = 0;
        for (let i = 0; i < (e.count || 1); i++) if (summonMinion(side, e.summonId, e.buff)) n++;
        log(n ? `🍗 召唤了 ${n} 个随从` : '战线已满，召唤失败', n ? 'good' : 'muted');
        break;
      }
      case 'damageAllEnemies':
        state[foe].board.filter(Boolean).forEach((t) => damageMinion(t, e.value, null));
        log(`🌊 ${card.name}：全体敌方随从 -${e.value}`, 'dmg');
        break;
      case 'destroyStrongest': {
        const targets = state[foe].board.filter(Boolean);
        if (!targets.length) { log('❌ 没有可撤回的目标', 'muted'); break; }
        const best = targets.reduce((a, b) => (b.atk > a.atk ? b : a));
        best.hp = 0;
        log(`⏪ ${card.name} 带走了 ${best.name}`, 'dmg');
        break;
      }
      case 'rage':
        log(`😤 ${card.name} 开始发威`, 'dmg');
        damageHero(foe, e.value);
        state[foe].board.filter(Boolean).forEach((t) => damageMinion(t, e.splash, null));
        break;
      case 'discardAllBurn': {
        const n = state[side].hand.length;
        discardRandom(side, n);
        if (n > 0) {
          log(`📦 ${card.name}：弃 ${n} 张，造成 ${n * e.value} 点伤害`, 'dmg');
          damageHero(foe, n * e.value);
        } else {
          log('📦 手牌是空的，什么也没发生', 'muted');
        }
        break;
      }
      case 'discardAllSummon': {
        const n = state[side].hand.length;
        discardRandom(side, n);
        let made = 0;
        for (let i = 0; i < n; i++) if (summonMinion(side, e.token)) made++;
        log(`♻️ ${card.name}：弃 ${n} 张，召唤 ${made} 个纸团`, made ? 'good' : 'muted');
        break;
      }
      case 'discardAllDamage': {
        const n = state[side].hand.length;
        discardRandom(side, n);
        const dmg = (e.flat || 0) + n * (e.value || 0);
        log(`🍗 ${card.name}：弃 ${n} 张，合计 ${dmg} 点伤害`, 'dmg');
        damageHero(foe, dmg);
        break;
      }
      case 'discardDestroy': {
        const got = discardRandom(side, e.value || 1);
        const targets = state[foe].board.filter(Boolean);
        if (!targets.length) { log('❌ 没有可撤回的目标', 'muted'); break; }
        const best = targets.reduce((a, b) => (b.atk > a.atk ? b : a));
        best.hp = 0;
        log(`⏪ ${card.name}：弃 ${got.length} 张，带走 ${best.name}`, 'dmg');
        break;
      }
      case 'healMinion':
        if (!target) break;
        {
          const before = target.hp;
          target.hp = Math.min(target.maxHp, target.hp + e.value);
          const gain = target.hp - before;
          if (gain > 0) pendingFloats.push({ selector: `.minion[data-uid="${target.uid}"]`, text: `+${gain}`, cls: 'heal' });
          log(`🩹 ${card.name}：${target.name} 回复 ${gain} 点`, 'good');
          Sound.heal();
        }
        break;
      case 'healAll': {
        healHero(side, e.value);
        let count = 0;
        state[side].board.filter(Boolean).forEach((m) => {
          const before = m.hp;
          m.hp = Math.min(m.maxHp, m.hp + e.value);
          if (m.hp > before) {
            count += 1;
            pendingFloats.push({ selector: `.minion[data-uid="${m.uid}"]`, text: `+${m.hp - before}`, cls: 'heal' });
          }
        });
        log(`🍵 ${card.name}：${count} 个随从回复 ${e.value} 点`, 'good');
        Sound.heal();
        break;
      }
      case 'healOverflowShield': {
        const st = state[side];
        const before = st.hp;
        st.hp = Math.min(st.hero.maxHp, st.hp + e.value);
        const healed = st.hp - before;
        if (healed > 0) pendingFloats.push({ selector: `.hero-face[data-hero="${side}"]`, text: `+${healed}`, cls: 'heal' });
        const overflow = e.value - healed;
        if (overflow > 0) {
          st.shield += overflow;
          log(`🥣 ${card.name}：回复 ${healed}，溢出 ${overflow} 转为护盾`, 'good');
        } else {
          log(`🥣 ${card.name}：回复 ${healed} 点`, 'good');
        }
        Sound.heal();
        break;
      }
      case 'damageMinion':
        if (!target) break;
        log(`📢 ${card.name} 命中 ${target.name}，-${e.value}`, 'dmg');
        damageMinion(target, e.value, null);
        break;
      case 'shieldMinion':
        if (!target) break;
        target.shield = (target.shield || 0) + e.value;
        log(`🧿 ${target.name} 获得 ${e.value} 层护盾`, 'good');
        break;
      case 'heroShield':
        state[side].shield = (state[side].shield || 0) + e.value;
        log(`🥇 ${nameOf(side)} 获得 ${e.value} 点护盾`, 'good');
        break;
      case 'gainEnergy':
        state[side].energy = Math.min(10, state[side].energy + e.value);
        log(`🔌 ${card.name}：本回合 +${e.value} 能量`, 'good');
        break;
      case 'buffAllies':
        state[side].board.filter(Boolean).forEach((m) => {
          m.atk += e.atk || 0;
          m.hp += e.hp || 0;
          m.maxHp += e.hp || 0;
        });
        log(`📌 ${card.name}：己方所有随从 +${e.atk || 0}/+${e.hp || 0}`, 'good');
        break;
      case 'healAllies':
        state[side].board.filter(Boolean).forEach((m) => {
          const before = m.hp;
          m.hp = Math.min(m.maxHp, m.hp + e.value);
          if (m.hp > before) {
            pendingFloats.push({ selector: `.minion[data-uid="${m.uid}"]`, text: `+${m.hp - before}`, cls: 'heal' });
          }
        });
        log(`🍜 ${card.name}：己方所有随从回复 ${e.value}`, 'good');
        break;
      case 'damageRandomEnemy': {
        for (let i = 0; i < (e.times || 1); i++) {
          const targets = state[foe].board.filter(Boolean);
          if (!targets.length) break;
          const target = targets[rand(targets.length)];
          damageMinion(target, e.value, null);
        }
        log(`🎯 ${card.name}：随机命中 ${e.times || 1} 次，每次 ${e.value} 点`, 'dmg');
        break;
      }
      case 'drawWithLife':
        drawCards(side, e.value || 1);
        damageHero(side, e.self || 0);
        log(`🌙 ${card.name}：抽 ${e.value} 张，自身 -${e.self}`, 'muted');
        break;
      case 'drawThenDiscard':
        drawCards(side, e.value || 1);
        discardRandom(side, e.discard || 1);
        log(`🏷️ ${card.name}：抽 ${e.value} 张，随机弃 ${e.discard} 张`, 'muted');
        break;
      default:
        break;
    }
    if (card.draw) drawCards(side, card.draw);
  }

  /* =========================================================
     英雄技能
     ========================================================= */
  function powerReady(side) {
    const s = state[side];
    const p = s.hero.power;
    if (s.powerUsed || s.energy < p.cost) return false;
    if (p.kind === 'summon' && !s.board.some((x) => !x)) return false;
    if (p.kind === 'damageStrongest' && !state[other(side)].board.some(Boolean)) return false;
    return true;
  }

  function usePower(side) {
    if (!state || state.over) return;
    const s = state[side];
    if (side === 'player' && (state.busy || state.phase !== 'player')) return;
    if (s.powerUsed) return;
    if (s.energy < s.hero.power.cost) {
      if (side === 'player') { toast('能量不够，攒攒再 V'); Sound.deny(); }
      return;
    }
    const p = s.hero.power;
    if (p.kind === 'summon' && !s.board.some((x) => !x)) {
      if (side === 'player') toast('战线满了，先别摇人');
      return;
    }

    s.energy -= p.cost;
    s.powerUsed = true;

    if (side === 'player') {
      state.stats.power++;
      log('💸 你深吸一口气：「V 我 50！」', 'player');
      Sound.play();
    }

    switch (p.kind) {
      case 'damageHero':
        damageHero(other(side), p.value);
        log(`${p.emoji} ${s.hero.name} 的「${p.name}」命中 ${nameOf(other(side))}，-${p.value}`, side === 'player' ? 'player' : 'enemy');
        break;
      case 'heal':
        healHero(side, p.value);
        log(`${p.emoji} ${s.hero.name} 使用「${p.name}」`, 'good');
        break;
      case 'summon': {
        const ok = summonMinion(side, p.token);
        log(ok ? `${p.emoji} ${s.hero.name} 使用「${p.name}」召唤了 ${D.CARD_DEFS[p.token].name}` : '战线满了，技能没生效', ok ? 'enemy' : 'muted');
        break;
      }
      case 'damageDraw':
        damageHero(other(side), p.value);
        drawCards(side, 1);
        log(`${p.emoji} ${s.hero.name} 使用「${p.name}」：-${p.value} 并抽牌`, 'enemy');
        break;
      case 'healDraw':
        healHero(side, p.value);
        drawCards(side, 1);
        log(`${p.emoji} ${s.hero.name} 使用「${p.name}」并抽牌`, 'good');
        break;
      case 'damageHeal':
        damageHero(other(side), p.value);
        healHero(side, p.value);
        log(`${p.emoji} ${s.hero.name} 使用「${p.name}」：-${p.value} 并回复 ${p.value}`, 'enemy');
        break;
      case 'damageStrongest': {
        const targets = state[other(side)].board.filter(Boolean);
        if (targets.length) {
          const best = targets.reduce((a, b) => (b.atk > a.atk ? b : a));
          damageMinion(best, p.value, null);
          log(`${p.emoji} ${s.hero.name} 使用「${p.name}」：${best.name} -${p.value}`, 'enemy');
        }
        break;
      }
      default:
        break;
    }
    render();
    cleanupDeaths();
    checkOver();
  }

  /* =========================================================
     战斗流程
     ========================================================= */
  /* =========================================================
     一个回合：我方出牌 → 敌方出牌 → 双方随从攻击 → 判定死亡 → 下一回合
     ========================================================= */
  async function combatPhase() {
    const lanes = [0, 1, 2, 3, 4];
    let any = false;

    lanes.forEach((i) => {
      const p = state.player.board[i];
      const e = state.enemy.board[i];
      if (p) {
        any = true;
        const el = document.querySelector(`.minion[data-uid="${p.uid}"]`);
        if (el) el.classList.add('lunge-r');
      }
      if (e) {
        any = true;
        const el = document.querySelector(`.minion[data-uid="${e.uid}"]`);
        if (el) el.classList.add('lunge-l');
      }
    });

    if (!any) {
      log('这一回合双方都没有随从能出手', 'muted');
      return;
    }

    Sound.swing();
    await sleep(230);

    // 同时结算：先把所有伤害算完，再统一判定死亡
    for (const i of lanes) {
      const p = state.player.board[i];
      const e = state.enemy.board[i];
      if (p && e) {
        log(`⚔️ ${p.name} 与 ${e.name} 对撞`, 'battle');
        const dmgE = damageMinion(e, p.atk, p);
        const dmgP = damageMinion(p, e.atk, e);
        if (p.lifesteal && dmgE > 0) { healHero('player', dmgE); log(`🩸 ${p.name} 吸血 ${dmgE} 点`, 'good'); }
        if (e.lifesteal && dmgP > 0) { healHero('enemy', dmgP); log(`🩸 ${e.name} 吸血 ${dmgP} 点`, 'enemy'); }
        if (p.pierce) { damageHero('enemy', p.atk); log(`➤ ${p.name} 穿透命中英雄`, 'battle'); }
        if (e.pierce) { damageHero('player', e.atk); log(`➤ ${e.name} 穿透命中你`, 'dmg'); }
        if (p.splash) splashDamage('enemy', i, p.splash);
        if (e.splash) splashDamage('player', i, e.splash);
      } else if (p) {
        const dmg = p.atk + (p.antiHero || 0);
        log(`💥 ${p.name} 直接命中 ${nameOf('enemy')}，-${dmg}`, 'player');
        const dealt = damageHero('enemy', dmg);
        if (p.lifesteal && dealt > 0) { healHero('player', dealt); log(`🩸 ${p.name} 吸血 ${dealt} 点`, 'good'); }
        if (p.splash) splashDamage('enemy', i, p.splash);
      } else if (e) {
        const dmg = e.atk + (e.antiHero || 0);
        log(`💥 ${e.name} 直接命中你，-${dmg}`, 'dmg');
        const dealt = damageHero('player', dmg);
        if (e.lifesteal && dealt > 0) { healHero('enemy', dealt); log(`🩸 ${e.name} 吸血 ${dealt} 点`, 'enemy'); }
        if (e.splash) splashDamage('player', i, e.splash);
      }
    }
    Sound.hit();
    render();
    await sleep(420);

    state.phaseText = '判定倒下';
    render();
    await sleep(140);
    await cleanupDeaths();
  }

  async function endTurn() {
    if (!state || state.busy || state.over || state.phase !== 'player' || state.discardReq) return;
    state.busy = true;
    state.phase = 'end';
    state.phaseText = '结算中';
    state.selected = null;
    hideTip();
    render();

    await discardToLimit();
    if (state.over) return;

    Sound.turn();

    /* ① 敌方出牌 */
    await enemyActionPhase();
    if (state.over) return;

    /* ② 双方随从攻击 */
    state.phase = 'combat';
    state.phaseText = '双方随从进攻';
    render();
    await sleep(200);
    await combatPhase();
    if (checkOver()) return;

    /* ③ 死亡判定已在 combatPhase 内完成，进入下一回合 */
    state.turn++;
    beginPlayerTurn();
    state.busy = false;
    Sound.turn();
    render();
  }

  async function enemyActionPhase() {
    const s = state.enemy;
    state.phase = 'enemy';
    state.phaseText = '对手出牌';
    s.energy = energyFor(state.turn);
    s.powerUsed = false;
    drawCards('enemy', 1);
    aiDiscardToLimit();
    render();
    await sleep(460);

    await enemyAI();
  }

  function beginPlayerTurn() {
    const s = state.player;
    s.energy = energyFor(state.turn);
    s.powerUsed = false;
    state.phase = 'player';
    state.phaseText = '你的回合';
    state.selected = null;
    drawCards('player', 1);
    log(`—— 第 ${state.turn} 回合 ——`, 'turn');
    render();
  }

  /* =========================================================
     AI
     ========================================================= */
  function isUseful(side, card) {
    const s = state[side];
    const foe = state[other(side)];
    if (card.type === 'minion') return s.board.some((x) => !x);
    if (card.target === 'enemyMinion') return foe.board.some(Boolean);
    if (card.target === 'allyMinion') return s.board.some(Boolean);
    if (card.type === 'field') return true;
    const e = card.effect || {};
    if (e.type === 'destroyStrongest' || e.type === 'discardDestroy') return foe.board.some(Boolean);
    if (e.type === 'healHero') return s.hp <= s.hero.maxHp - 4;
    if (e.type === 'summon') return s.board.some((x) => !x);
    if (e.type === 'damageAllEnemies') return foe.board.some(Boolean);
    if (e.type === 'discardAllBurn' || e.type === 'discardAllSummon' || e.type === 'discardAllDamage') {
      return s.hand.length >= 2;
    }
    return true;
  }

  function scoreEnemyCard(card) {
    const s = state.enemy;
    const foe = state.player;
    if (card.type === 'minion') return 10 + card.cost * 2 + (card.atk + card.hp) * 0.2;
    const e = card.effect || {};
    if (e.type === 'destroyStrongest' || e.type === 'discardDestroy') {
      const best = foe.board.filter(Boolean).sort((a, b) => b.atk - a.atk)[0];
      return best ? 30 + best.atk * 2 : -99;
    }
    if (e.type === 'damageHero') {
      if (foe.hp <= e.value) return 90;
      return 8 + card.cost;
    }
    if (e.type === 'healHero') return s.hp <= s.hero.maxHp - 6 ? 16 : -99;
    if (e.type === 'discardAllBurn' || e.type === 'discardAllDamage') return 6 + s.hand.length * 3;
    return 5;
  }

  function chooseLane(side) {
    const s = state[side];
    const foe = state[other(side)];
    const empty = [0, 1, 2, 3, 4].filter((i) => !s.board[i]);
    if (!empty.length) return -1;
    const free = empty.filter((i) => !foe.board[i]);
    const pool = free.length ? free : empty;
    pool.sort((a, b) => {
      const ha = foe.board[a] ? foe.board[a].hp : 99;
      const hb = foe.board[b] ? foe.board[b].hp : 99;
      return ha - hb;
    });
    return pool[0];
  }

  async function enemyAI() {
    let guard = 0;
    while (guard++ < 12 && !state.over) {
      const s = state.enemy;
      const options = s.hand.filter((c) => c.cost <= s.energy && isUseful('enemy', c));
      if (!options.length) break;
      options.sort((a, b) => scoreEnemyCard(b) - scoreEnemyCard(a));
      const card = options[0];
      if (!card || scoreEnemyCard(card) < 0) break;
      const lane = card.type === 'minion' ? chooseLane('enemy') : -1;
      if (card.type === 'minion' && lane < 0) break;
      let target = null;
      if (card.target === 'enemyMinion') {
        const list = state.player.board.filter(Boolean).sort((a, b) => b.atk - a.atk);
        target = list[0] || null;
        if (!target) break;
      } else if (card.target === 'allyMinion') {
        target = state.enemy.board.filter(Boolean)[0] || null;
        if (!target) break;
      }

      state.phaseText = '对手出牌';
      render();
      await sleep(430);
      if (!playCard('enemy', card.uid, lane, target)) break;
      if (state.over) return;
      await sleep(220);
    }

    if (!state.over && powerReady('enemy')) {
      state.phaseText = '对手使用技能';
      render();
      await sleep(380);
      usePower('enemy');
    }
  }

  /* =========================================================
     胜负
     ========================================================= */
  function checkOver() {
    if (!state || state.over) return !!state && state.over;
    if (state.enemy.hp <= 0) { endGame('win'); return true; }
    if (state.player.hp <= 0) { endGame('lose'); return true; }
    return false;
  }

  function endGame(kind) {
    if (state.over) return;
    state.over = true;
    state.overKind = kind;
    state.busy = true;
    state.phase = 'over';
    state.phaseText = kind === 'win' ? 'V 到 50 了' : '群友装死';
    const win = kind === 'win';
    const res = Store.recordBattle(win, state.opponent);
    state.reward = res.gain;

    if (state.runMode) {
      if (win) {
        const rr = Store.runWin(state.player.hp, state.nodeType);
        state.runFinished = rr.finished;
        state.runBonus = rr.bonus || 0;
        if (rr.finished) state.reward += rr.bonus || 0;
      } else {
        const rr = Store.runLose();
        state.runCleared = rr.cleared;
        state.runRow = rr.row;
      }
    }

    if (win) {
      log('🏆 你成功 V 到了 50！', 'good big');
      Sound.win();
    } else {
      log('💀 群友全体装死，你被白嫖了', 'dmg big');
      Sound.lose();
    }
    render();
    clearTimeout(resultTimer);
    resultTimer = setTimeout(() => showResult(kind), 800);
  }

  function showResult(kind) {
    if (window.App.currentScreen() !== 'screen-battle') return;
    const win = kind === 'win';
    $('#resultEmoji').textContent = win ? '🍗' : '🫥';
    $('#resultTitle').textContent = win ? 'V 到 50 了' : '群友集体装死';
    $('#resultDesc').textContent = win
      ? `${state.opponent.name} 终于把 50 块转给了你。`
      : '群友说了无数次「下次一定」，这 50 块至今没到账。';
    $('#resultReward').innerHTML = `🪙 +${state.reward} <span>疯狂币</span>`;
    $('#resultStats').innerHTML = `
      <div>回合<b>${state.turn}</b></div>
      <div>出牌<b>${state.stats.played}</b></div>
      <div>伤害<b>${state.stats.dealt}</b></div>
      <div>弃牌<b>${state.stats.discarded}</b></div>`;

    const again = $('#resultAgain');
    const menu = $('#resultMenu');
    if (state.runMode) {
      menu.textContent = '返回群聊';
      if (win && !state.runFinished) {
        again.textContent = '领取奖励';
      } else if (win && state.runFinished) {
        again.textContent = '再来一次';
        $('#resultTitle').textContent = '冒险通关';
        $('#resultDesc').textContent = `一路打到 BOSS 并赢了下来，额外奖励 ${state.runBonus} 疯狂币！`;
      } else {
        again.textContent = '重新冒险';
        $('#resultTitle').textContent = '冒险结束';
        $('#resultDesc').textContent = `倒在第 ${state.runRow || 1} 层，这次冒险到此为止。`;
      }
    } else {
      again.textContent = '再来一局';
      menu.textContent = '回主菜单';
    }
    $('#result').classList.add('is-open');
    Screens.onBattleEnd();
  }

  function hideResult() {
    clearTimeout(resultTimer);
    const el = $('#result');
    if (el) el.classList.remove('is-open');
  }

  /* =========================================================
     事件绑定
     ========================================================= */
  function bindOnce() {
    document.addEventListener('click', onDocClick);
    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);
    document.addEventListener('keydown', onKeyDown);

    $('#endTurnBtn').addEventListener('click', () => endTurn());
    $('#restartBtn').addEventListener('click', () => {
      if (state && state.busy && !state.over) { toast('这一回合还没结算完'); return; }
      Sound.click();
      start(state.opponent.id, { run: state.runMode, nodeType: state.nodeType });
    });
    $('#menuBtn').addEventListener('click', () => {
      if (state && state.busy && !state.over) { toast('这一回合还没结算完'); return; }
      Sound.click();
      hideResult();
      showScreen('screen-menu');
      Screens.onBattleEnd();
    });
    const logToggle = $('#logToggle');
    if (logToggle) logToggle.addEventListener('click', () => toggleLog());
    const logClose = $('#logClose');
    if (logClose) logClose.addEventListener('click', () => toggleLog(false));
    const logBackdrop = $('#logBackdrop');
    if (logBackdrop) logBackdrop.addEventListener('click', () => toggleLog(false));
    $('#resultAgain').addEventListener('click', () => {
      Sound.click();
      hideResult();
      if (state && state.runMode) {
        if (state.overKind === 'win' && !state.runFinished) Screens.openRunRewards();
        else Screens.openRun();
      } else {
        Screens.openOpponents();
      }
    });
    $('#resultMenu').addEventListener('click', () => {
      Sound.click();
      hideResult();
      showScreen('screen-menu');
      Screens.onBattleEnd();
    });
  }

  function toggleLog(force) {
    const panel = $('#sidePanel');
    const backdrop = $('#logBackdrop');
    if (!panel) return;
    const open = typeof force === 'boolean' ? force : !panel.classList.contains('is-open');
    panel.classList.toggle('is-open', open);
    if (backdrop) backdrop.classList.toggle('is-on', open);
    document.body.classList.toggle('log-open', open);
  }

  bindOnce();

  return {
    start,
    getState: () => state,
    play: (uid, lane, target) => playCard('player', uid, lane, target),
    power: () => usePower('player'),
    endTurn: () => endTurn(),
    spawn: (defId, side, lane) => {
      if (!state) return null;
      const m = createCard(defId);
      buffByField(side, m);
      state[side].board[lane] = m;
      render();
      return m.uid;
    },
    pushCard: (defId) => {
      if (!state) return null;
      const m = createCard(defId);
      state.player.hand.push(m);
      render();
      return m.uid;
    }
  };
})();
