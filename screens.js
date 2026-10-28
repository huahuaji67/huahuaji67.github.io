/* =========================================================
   菜单 / 对手 / 冒险 / 卡组编辑 / 卡包商店
   ========================================================= */
window.Screens = (function () {
  'use strict';

  const D = window.CT;
  const { $, $$, toast, Sound, showScreen, openModal, closeModal, sleep, pick } = window.App;

  const canHover = !window.matchMedia || (window.matchMedia('(hover: hover)').matches && window.innerWidth > 820);

  let deckDraft = null;
  let deckFilter = 'all';
  let detailId = null;
  let packBusy = false;
  let rewardIds = null;

  /* =========================================================
     初始化
     ========================================================= */
  function init() {
    buildBubbles();
    buildTicker();
    renderMenu();
    bind();
    updateSoundUI();
    initThursday();
  }

  function bind() {
    document.addEventListener('click', onClick);
    const thuClaim = $('#thuClaim');
    if (thuClaim) thuClaim.addEventListener('click', claimThursday);
    const thuClose = $('#thuClose');
    if (thuClose) thuClose.addEventListener('click', closeThursdayEgg);
    const thuBadge = $('#thuBadge');
    if (thuBadge) thuBadge.addEventListener('click', () => openThursdayEgg());
    const thuEgg = $('#thuEgg');
    if (thuEgg) {
      thuEgg.addEventListener('click', (ev) => {
        if (ev.target.id === 'thuEgg') closeThursdayEgg();
      });
    }
    document.addEventListener('pointerover', (ev) => {
      if (window.App.currentScreen() !== 'screen-deck' || !deckDraft) return;
      const el = ev.target.closest('.col-card');
      if (el && el.dataset.card) renderDetail(el.dataset.card);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
    const packClose = $('#packClose');
    if (packClose) packClose.addEventListener('click', closePack);
  }

  function closeAll() {
    if ($('#packOverlay').classList.contains('is-open')) { closePack(); return; }
    if ($('#bagPanel').classList.contains('is-open')) { closeBagPanel(); return; }
    const modal = $('#modal');
    if (modal.classList.contains('is-open')) {
      if (modal.dataset.lock !== '1') closeModal('modal');
      return;
    }
    if ($('#rewardPanel').classList.contains('is-open')) return;
    if ($('#runPanel').classList.contains('is-open')) { closeRunPanel(); return; }
  }

  function onClick(ev) {
    const actEl = ev.target.closest('[data-act]');
    if (actEl) { handleAct(actEl.dataset.act); return; }

    const oppEl = ev.target.closest('[data-opp]');
    if (oppEl) {
      Sound.unlock();
      const id = oppEl.dataset.opp;
      const tier = Number(oppEl.dataset.tier || 0);
      if (tier && !Store.tierUnlocked(tier)) {
        toast(`赢 ${tier === 2 ? 2 : 5} 场解锁这一档对手`);
        Sound.deny();
        return;
      }
      closeModal('modal');
      window.Battle.start(id);
      return;
    }

    const cardEl = ev.target.closest('[data-card]');
    if (cardEl) { onCollectionCard(cardEl.dataset.card); return; }

    const detailAct = ev.target.closest('[data-detail-act]');
    if (detailAct) { detailAction(); return; }

    const slotEl = ev.target.closest('[data-deck-slot]');
    if (slotEl) { removeFromDeck(Number(slotEl.dataset.deckSlot)); return; }

    const fEl = ev.target.closest('[data-filter]');
    if (fEl) { deckFilter = fEl.dataset.filter; renderDeckScreen(); return; }

    if (ev.target.closest('[data-run-start]')) { startNewRun(); return; }

    const bagDrop = ev.target.closest('[data-bag-drop]');
    if (bagDrop) {
      ev.stopPropagation();
      const i = Number(bagDrop.dataset.bagDrop);
      const id = Store.bagRemoveAt(i);
      if (id) { Sound.deny(); toast(`丢弃了「${D.CARD_DEFS[id].name}」`); refreshRunViews(); }
      return;
    }

    const bagAdd = ev.target.closest('[data-bag-add]');
    if (bagAdd) {
      const r = Store.bagToDeck(Number(bagAdd.dataset.bagAdd));
      if (r.ok) { Sound.click(); toast(r.msg); } else { Sound.deny(); toast(r.msg); }
      refreshRunViews();
      return;
    }

    const bagRemove = ev.target.closest('[data-bag-remove]');
    if (bagRemove) {
      const r = Store.deckToBag(Number(bagRemove.dataset.bagRemove));
      if (r.ok) { Sound.click(); toast(r.msg); } else { Sound.deny(); toast(r.msg); }
      refreshRunViews();
      return;
    }

    if (ev.target.id === 'bagPanel') { closeBagPanel(); return; }
    if (ev.target.id === 'bagClose') { closeBagPanel(); return; }

    const nodeEl = ev.target.closest('[data-node]');
    if (nodeEl) { enterMapNode(nodeEl.dataset.node); return; }

    const rewardEl = ev.target.closest('[data-reward]');
    if (rewardEl) { pickReward(rewardEl.dataset.reward); return; }

    if (ev.target.id === 'modal') { closeModalSafe(); return; }
    if (ev.target.id === 'runPanel') { closeRunPanel(); return; }
    if (ev.target.id === 'rewardPanel') { return; }
  }

  function handleAct(act) {
    Sound.unlock();
    switch (act) {
      case 'adventure': Sound.click(); openRun(); break;
      case 'versus': Sound.click(); openOpponents(); break;
      case 'deck': Sound.click(); openDeckScreen(); break;
      case 'shop': Sound.click(); openShop(); break;
      case 'howto': Sound.click(); openHelp(); break;
      case 'sound': { const on = Sound.toggle(); if (on) Sound.click(); updateSoundUI(); break; }
      case 'menu': Sound.click(); leaveDeck(); showScreen('screen-menu'); renderMenu(); break;
      case 'save-deck': saveDeck(); break;
      case 'auto-deck': autoDeck(); break;
      case 'clear-deck': deckDraft = []; Sound.click(); renderDeckScreen(); break;
      case 'reset-data': confirmReset(); break;
      case 'run-bag': Sound.click(); openBagPanel(); break;
      case 'resume-battle': {
        const pend = Store.runPending();
        if (!pend) { openRun(); break; }
        Sound.click();
        window.Battle.start(pend.enemyId, { run: true, nodeType: pend.nodeType });
        if (window.App.currentScreen() === 'screen-battle') closeRunPanel();
        break;
      }
      case 'run-abandon': confirmAbandon(); break;
      default: break;
    }
  }

  /* =========================================================
     菜单
     ========================================================= */
  function buildBubbles() {
    const wrap = $('#chatBg');
    if (!wrap) return;
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('div');
      el.className = 'bubble' + (Math.random() > 0.66 ? ' alt' : '');
      el.textContent = pick(D.BUBBLE_TEXTS);
      el.style.left = 3 + Math.random() * 78 + '%';
      el.style.top = 55 + Math.random() * 55 + '%';
      el.style.fontSize = 11 + Math.random() * 7 + 'px';
      el.style.animationDuration = 22 + Math.random() * 24 + 's';
      el.style.animationDelay = -Math.random() * 34 + 's';
      wrap.appendChild(el);
    }
  }

  function buildTicker() {
    const track = $('#tickerTrack');
    if (!track) return;
    const line = D.MEME_LINES.map((t) => `<span>${t}</span>`).join('');
    track.innerHTML = line + line;
  }

  /* =========================================================
     星期四彩蛋：只有真的星期四才出现
     ========================================================= */
  const THU_KEY = 'v50.thursday.claim';

  function isThursday() {
    return new Date().getDay() === 4;
  }

  function dayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function thuClaimed() {
    try { return localStorage.getItem(THU_KEY) === dayKey(); } catch (e) { return false; }
  }

  function buildThuRain() {
    const wrap = $('#thuRain');
    if (!wrap) return;
    wrap.innerHTML = '';
    const icons = ['🍗', '🍔', '🍟', '💰', '🧧', '🍗'];
    for (let i = 0; i < 26; i++) {
      const el = document.createElement('i');
      el.textContent = icons[i % icons.length];
      el.style.left = Math.random() * 100 + '%';
      el.style.animationDelay = -(Math.random() * 7) + 's';
      el.style.animationDuration = (4 + Math.random() * 4) + 's';
      el.style.fontSize = (13 + Math.random() * 20) + 'px';
      wrap.appendChild(el);
    }
  }

  function renderThursdayBadge() {
    const badge = $('#thuBadge');
    if (!badge) return;
    const on = isThursday();
    badge.hidden = !on;
    if (!on) {
      const tag = $('#tagline');
      if (tag) tag.textContent = '今天星期四，群友集体装死。打一场，谁赢谁请客。';
      return;
    }
    badge.textContent = thuClaimed() ? '🗓 今天已经 V 到 50 了' : '🗓 今天真的是星期四';
    const tag = $('#tagline');
    if (tag) tag.textContent = '今天真的是星期四。群里 24 个人，没有一个人 V 你 50。';
  }

  function openThursdayEgg(force) {
    if (!force && !isThursday()) return false;
    const egg = $('#thuEgg');
    if (!egg) return false;
    renderThursdayBadge();
    buildThuRain();
    const claimed = thuClaimed();
    const text = $('#thuText');
    const claim = $('#thuClaim');
    if (claimed) {
      text.textContent = '你点开群聊，24 个人在线，没有一个人说话。\n\n你：“V我50。”\n\n系统：今天已经领过了。\n（明天是星期五，这里什么都不会发生）';
      claim.textContent = '今天已经 V 到了 ✓';
      claim.disabled = true;
    } else {
      text.textContent = '你点开群聊，24 个人在线，没有一个人说话。\n\n你：“V我50。”\n\n群里：“哈哈哈哈哈哈哈哈”\n\n—— 但系统悄悄塞给你 50 疯狂币。';
      claim.textContent = 'V 我 50（+50 🪙）';
      claim.disabled = false;
    }
    egg.classList.add('is-open');
    egg.setAttribute('aria-hidden', 'false');
    return true;
  }

  function closeThursdayEgg() {
    const egg = $('#thuEgg');
    if (!egg) return;
    egg.classList.remove('is-open');
    egg.setAttribute('aria-hidden', 'true');
  }

  function claimThursday() {
    if (thuClaimed()) { toast('今天已经 V 过了'); Sound.deny(); return; }
    if (!isThursday()) { toast('今天不是星期四'); Sound.deny(); return; }
    markThuClaimed();
    const total = Store.addCoins(50);
    Sound.coin();
    const coins = $('#menuCoins');
    if (coins) coins.textContent = total;
    renderThursdayBadge();
    const claim = $('#thuClaim');
    if (claim) { claim.textContent = '今天已经 V 到了 ✓'; claim.disabled = true; }
    const text = $('#thuText');
    if (text) text.textContent = '「支付宝到账 50 元。」\n\n……才怪，这是游戏币。\n\n今天的 50 已经到手，明天就是星期五了。';
    buildThuRain();
    toast('+50 疯狂币，星期四快乐');
  }

  function markThuClaimed() {
    try { localStorage.setItem(THU_KEY, dayKey()); } catch (e) { /* ignore */ }
  }

  function initThursday() {
    renderThursdayBadge();
    if (isThursday() && !thuClaimed()) {
      setTimeout(() => {
        // 只在主菜单且没有其它浮层时弹，避免打断玩家
        const idle = window.App.currentScreen() === 'screen-menu'
          && !$('#runPanel').classList.contains('is-open')
          && !$('#modal').classList.contains('is-open')
          && !$('#packOverlay').classList.contains('is-open');
        if (idle) openThursdayEgg();
      }, 900);
    }
  }

  function renderMenu() {
    renderThursdayBadge();
    const p = Store.get();
    $('#menuCoins').textContent = p.coins;
    $('#menuWins').textContent = p.wins;
    $('#menuBest').textContent = p.best;
    $('#menuPacks').textContent = p.packs;
    const adv = $('#advBtn');
    const sub = $('#advSub');
    const run = Store.currentRun();
    if (adv && sub) {
      if (run) {
        adv.textContent = '继续冒险';
        sub.textContent = `第 ${Math.max(1, run.row)} / ${D.MAP.rows - 1} 层 · 牌库 ${run.deck.length}`;
      } else {
        adv.textContent = '开始冒险';
        sub.textContent = '随机地图 · 肉鸽';
      }
    }
  }

  function updateSoundUI() {
    const btn = $('#soundBtn');
    if (btn) {
      btn.textContent = Sound.enabled ? '🔊' : '🔇';
      btn.classList.toggle('is-off', !Sound.enabled);
    }
  }

  /* =========================================================
     自由对战
     ========================================================= */
  function openOpponents() {
    const tiers = [1, 2, 3];
    const html = tiers.map((tier) => {
      const list = D.OPPONENTS.filter((o) => o.tier === tier);
      const unlocked = Store.tierUnlocked(tier);
      const need = tier === 1 ? 0 : tier === 2 ? 2 : 5;
      return `<div class="opp-tier">
        <div class="opp-tier-head">
          <b>${tier === 1 ? '简单' : tier === 2 ? '普通' : '困难'}</b>
          <span>${unlocked ? '已解锁' : `赢 ${need} 场解锁`}</span>
        </div>
        <div class="opp-grid">
          ${list.map((o) => `<button class="opp-card${unlocked ? '' : ' is-locked'}" data-opp="${o.id}" data-tier="${tier}">
            <div class="opp-face">${o.emoji}</div>
            <div class="opp-main">
              <div class="opp-name">${o.name}</div>
              <div class="opp-tag">${o.tag}</div>
              <div class="opp-meta"><span>❤️ ${o.hp}</span><span>🪙 +${o.reward}</span></div>
            </div>
          </button>`).join('')}
        </div>
      </div>`;
    }).join('');
    openModalHtml('自由对战 · 选择对手', html);
  }

  function openModalHtml(title, html, opts) {
    const locked = !!(opts && opts.lock);
    const modal = $('#modal');
    modal.dataset.lock = locked ? '1' : '';
    modal.dataset.title = title;
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = html;
    const closeBtn = $('#modalClose');
    if (closeBtn) closeBtn.style.visibility = locked ? 'hidden' : 'visible';
    openModal('modal');
  }

  function closeModalSafe() {
    const modal = $('#modal');
    if (modal.dataset.lock === '1') return;
    closeModal('modal');
  }

  /* =========================================================
     冒险：随机地图（杀戮尖塔式）
     ========================================================= */
  function openRun() {
    renderRun();
    $('#runPanel').classList.add('is-open');
  }

  function closeRunPanel() {
    $('#runPanel').classList.remove('is-open');
  }

  function startNewRun() {
    Store.startRun();
    Sound.click();
    renderRun();
    toast('新的冒险开始了');
  }

  function renderRun() {
    const run = Store.currentRun();
    const stats = $('#runStats');
    const mapEl = $('#runMap');
    const foot = $('#runFoot');
    if (!stats || !mapEl) return;

    if (!run) {
      stats.innerHTML = '';
      foot.innerHTML = '';
      mapEl.innerHTML = `<div class="map-start">
        <div class="ms-face">🎲</div>
        <div class="ms-title">随机地图 · 肉鸽冒险</div>
        <div class="ms-text">每次进入都是一张新的分支地图：战斗、精英、事件、商店、休息随机分布。<br>
          血量一路带到下一层，卡牌越拿越多，一路爬到顶端的 BOSS。</div>
        <div class="ms-stats">历史最深 ${Store.get().bestRun} 层 · 已挑战 ${Store.get().runs} 次</div>
        <button class="btn-primary" data-run-start="1">开始新的冒险</button>
      </div>`;
      return;
    }

    const hpPct = Math.round((run.hp / run.maxHp) * 100);
    stats.innerHTML = `
      <div class="rs-hp"><span>❤️ ${run.hp} / ${run.maxHp}</span><i><b style="width:${hpPct}%"></b></i></div>
      <div class="rs-meta">${run.row === 0 ? '起点' : `第 ${run.row} / ${D.MAP.rows - 1} 层`} · 卡组 ${run.deck.length} 张 · 背包 ${run.bag.length}/${Store.bagMax()} · 已通过 ${run.cleared}${run.pending ? ' · <b class="rs-fight">⚔️ 战斗中</b>' : ''}</div>`;

    renderMap(run);
    if (run.pending) {
      const opp = D.OPPONENTS.find((o) => o.id === run.pending.enemyId) || {};
      foot.innerHTML = `<div class="run-pending">
        <span class="rp-text">⚔️ 这场战斗还没打完：<b>${opp.emoji || '⚔️'} ${opp.name || '对手'}</b></span>
        <span class="rp-actions">
          <button class="btn-primary small" data-act="resume-battle">继续战斗</button>
          <button class="btn-ghost small" data-act="run-abandon">放弃冒险</button>
        </span>
      </div>`;
      return;
    }

    foot.innerHTML = `<div class="run-foot-row">
      <button class="btn-ghost small${run.bag.length ? ' is-hot' : ''}" data-act="run-bag">🎒 背包 ${run.bag.length}/${Store.bagMax()}${run.bag.length ? ' · 待装配' : ''}</button>
      <div class="map-legend">
        <span>⚔️ 战斗</span><span>💀 精英</span><span>❓ 事件</span><span>🛒 商店</span>
        <span>🩺 回血房</span><span>💤 休息</span><span>👑 BOSS</span>
      </div>
    </div>`;
  }

  function renderMap(run) {
    const mapEl = $('#runMap');
    const rows = run.map;
    const rowCount = rows.length;
    const H = 760;
    const yOf = (ri) => 34 + (ri / (rowCount - 1)) * (H - 68);

    const all = [];
    rows.forEach((row) => row.forEach((n) => all.push(n)));
    const byId = {};
    all.forEach((n) => { byId[n.id] = n; });

    const lines = [];
    all.forEach((n) => {
      n.next.forEach((id) => {
        const t = byId[id];
        if (!t) return;
        const done = run.visited.indexOf(n.id) >= 0 && run.visited.indexOf(id) >= 0;
        lines.push(`<line x1="${n.x}" y1="${yOf(n.row)}" x2="${t.x}" y2="${yOf(t.row)}" class="${done ? 'done' : ''}"/>`);
      });
    });

    const reachIds = Store.reachable().map((n) => n.id);
    const nodesHtml = all.map((node) => {
      const meta = D.NODE_META[node.type] || D.NODE_META.battle;
      const isCur = node.id === run.nodeId;
      const isVisited = run.visited.indexOf(node.id) >= 0;
      const isOpen = reachIds.indexOf(node.id) >= 0;
      let cls = 'map-node type-' + node.type;
      if (isCur) cls += ' is-current';
      else if (isOpen) cls += ' is-open';
      else if (isVisited) cls += ' is-visited';
      else cls += ' is-locked';

      let sub = '';
      if (node.enemyId && (isOpen || isCur || isVisited)) {
        const opp = D.OPPONENTS.find((o) => o.id === node.enemyId);
        if (opp) sub = opp.name;
      }
      const title = node.enemyId
        ? `${meta.name} · ${(D.OPPONENTS.find((o) => o.id === node.enemyId) || {}).name || ''}`
        : meta.name;
      return `<button class="${cls}" style="left:${node.x}%;top:${yOf(node.row)}px" data-node="${node.id}"
        title="${title}" ${isOpen ? '' : 'disabled'}>
        <span class="mn-icon">${meta.icon}</span>
        <span class="mn-name">${sub || meta.name}</span>
      </button>`;
    }).join('');

    mapEl.innerHTML = `<div class="map-canvas" style="height:${H}px">
      <svg class="map-links" viewBox="0 0 100 ${H}" preserveAspectRatio="none">${lines.join('')}</svg>
      ${nodesHtml}
    </div>`;
    const cur = mapEl.querySelector('.is-current');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }

  function enterMapNode(id) {
    const node = Store.runEnter(id);
    if (!node) return;
    Sound.click();
    if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
      Store.runBeginBattle(node.id);
      window.Battle.start(node.enemyId, { run: true, nodeType: node.type });
      // 只有战斗成功开启后才收起地图，避免开局失败时卡在半空
      if (window.App.currentScreen() === 'screen-battle') closeRunPanel();
      return;
    }
    if (node.type === 'heal') { resolveHeal(); return; }
    if (node.type === 'rest') { resolveRest(); return; }
    if (node.type === 'shop') { resolveShop(); return; }
    if (node.type === 'event') { resolveEvent(); return; }
    renderRun();
  }

  function confirmAbandon() {
    openModalHtml('放弃冒险', `
      <div class="event-box">
        <div class="ev-face">🚪</div>
        <div class="ev-text">放弃这次冒险？当前生命、局内背包和运行中的牌库都会清空，已经拿到的收藏不会丢。</div>
      </div>
      <div class="confirm-actions">
        <button class="btn-primary" id="abandonYes">放弃冒险</button>
        <button class="btn-ghost" id="abandonNo">再想想</button>
      </div>
    `, { lock: true });
    $('#abandonYes').addEventListener('click', () => {
      Store.abandonRun();
      closeModal('modal');
      Sound.deny();
      toast('已放弃这次冒险');
      renderRun();
    });
    $('#abandonNo').addEventListener('click', () => closeModal('modal'));
  }

  function resolveHeal() {
    const run = Store.currentRun();
    if (!run) return;
    const heal = Math.round(run.maxHp * D.RUN.healRoomPct);
    const missing = run.maxHp - run.hp;
    openModalHtml('回血房', `
      <div class="event-box">
        <div class="ev-face">🩺</div>
        <div class="ev-text">群友把折叠床支了起来，说今天不 V 钱了，先给你挂一瓶葡萄糖。<br>
          回复 <b>${heal}</b> 点生命（当前 ${run.hp}/${run.maxHp}，还差 ${missing} 点满血）。</div>
      </div>
      <div class="confirm-actions">
        <button class="btn-primary" id="healRoom">挂水（+${heal} 血）</button>
        <button class="btn-ghost" id="healSkip">不挂了，赶路</button>
      </div>
    `, { lock: true });
    $('#healRoom').addEventListener('click', () => {
      const g = Store.runHeal(heal);
      closeModal('modal');
      toast(`回复 ${g} 点生命`);
      Sound.heal();
      openRun();
    });
    $('#healSkip').addEventListener('click', () => {
      closeModal('modal');
      openRun();
    });
  }

  function resolveRest() {
    const run = Store.currentRun();
    if (!run) return;
    const heal = Math.round(run.maxHp * D.MAP.healPct);
    openModalHtml('休息', `
      <div class="event-box">
        <div class="ev-face">💤</div>
        <div class="ev-text">这一层没有战斗。你可以睡一觉，也可以继续赶路。</div>
      </div>
      <div class="confirm-actions">
        <button class="btn-primary" id="restHeal">睡一觉（+${heal} 血）</button>
        <button class="btn-ghost" id="restSkip">继续赶路</button>
      </div>
    `, { lock: true });
    $('#restHeal').addEventListener('click', () => {
      const g = Store.runHeal(heal);
      closeModal('modal');
      toast(`回复 ${g} 点生命`);
      openRun();
    });
    $('#restSkip').addEventListener('click', () => {
      closeModal('modal');
      openRun();
    });
  }

  function resolveEvent() {
    const ev = D.EVENTS[Math.floor(Math.random() * D.EVENTS.length)];
    openModalHtml(ev.title, `
      <div class="event-box">
        <div class="ev-face">${ev.emoji}</div>
        <div class="ev-text">${ev.text}</div>
      </div>
      <div class="confirm-actions">
        ${ev.options.map((o, i) => `<button class="${i === 0 ? 'btn-primary' : 'btn-ghost'}" data-ev="${i}">${o.label}</button>`).join('')}
      </div>
    `, { lock: true });
    $$('#modalBody [data-ev]').forEach((btn) => {
      btn.addEventListener('click', () => applyEventOption(ev, ev.options[Number(btn.dataset.ev)]));
    });
  }

  function applyEventOption(ev, opt) {
    const e = opt.effect || {};
    const msgs = [];
    if (e.coins) { Store.runAddCoins(e.coins); msgs.push(`${e.coins > 0 ? '+' : ''}${e.coins} 币`); }
    if (e.type === 'coins') { Store.runAddCoins(e.value); msgs.push(`+${e.value} 币`); }
    if (e.type === 'heal') { const g = Store.runHeal(e.value); msgs.push(`回血 ${g}`); }
    if (e.hp) { Store.runDamage(e.hp); msgs.push(`-${e.hp} 血`); }
    if (e.type === 'card') {
      const n = e.value || 1;
      const picks = Store.rollRewardChoices(n);
      const got = [];
      picks.forEach((id) => {
        const r = Store.runAddCard(id);
        if (r && r.ok) got.push(D.CARD_DEFS[id].name);
        else { Store.addCoins(40); got.push(`${D.CARD_DEFS[id].name}（背包满，+40 币）`); }
      });
      msgs.push(`背包 + ${got.join('、')}`);
    }
    closeModal('modal');
    toast(msgs.length ? msgs.join(' · ') : '什么也没发生');
    if (e.type === 'heal' || e.coins || e.hp || e.type === 'card') Sound.coin();
    openRun();
  }

  function resolveShop() {
    const offers = Store.rollRewardChoices(3);
    const priceOf = (id) => ({ common: 60, rare: 110, epic: 190, legendary: 320 }[Store.rarity(id)] || 60);
    let mode = 'main';

    const typeLine = (c) => (c.type === 'minion' ? `${c.atk} 攻 / ${c.hp} 血` : c.type === 'field' ? '场地 · 一次性' : c.type === 'item' ? '道具 · 一次性' : '法术');

    const render = () => {
      const run = Store.currentRun();
      if (!run) { closeModal('modal'); return; }
      const coins = Store.coins();
      const bag = Store.bag();
      const bagFull = bag.length >= Store.bagMax();

      if (mode === 'remove') {
        const cards = run.deck.map((id, i) => {
          const c = D.CARD_DEFS[id];
          return `<button class="svc-card rar-${c.rarity}" data-remove="${i}">
            <span class="bc-cost">${c.cost}</span>
            <span class="sc-art">${c.emoji}</span>
            <span class="sc-name">${c.name}</span>
          </button>`;
        }).join('');
        $('#modalBody').innerHTML = `
          <p class="confirm-text">选择一张要从卡组里删掉的牌（删掉的牌会<strong>进入背包</strong>，背包满了则直接消失）。</p>
          <div class="svc-grid">${cards}</div>
          <div class="confirm-actions"><button class="btn-ghost" id="shopBack">返回</button></div>`;
        $$('#modalBody [data-remove]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.remove);
            const id = run.deck[idx];
            if (!id) return;
            if (coins < 60) { toast('币不够'); Sound.deny(); return; }
            Store.runAddCoins(-60);
            const moved = Store.deckToBag(idx);
            if (!moved.ok) Store.runDeckDelete(idx);
            Sound.coin();
            toast(`删掉了「${D.CARD_DEFS[id].name}」`);
            mode = 'main';
            render();
          });
        });
        $('#shopBack').addEventListener('click', () => { mode = 'main'; render(); });
        return;
      }

      const cardsHtml = offers.map((id, i) => {
        if (!id) return '<div class="shop-item is-sold">已售出</div>';
        const c = D.CARD_DEFS[id];
        const price = priceOf(id);
        const can = coins >= price && !bagFull;
        return `<button class="shop-item rar-${c.rarity}" data-buy="${i}" ${can ? '' : 'disabled'}>
          <span class="si-top"><span class="si-rar">${D.RARITY[c.rarity].name}</span><span class="si-price">🪙 ${price}</span></span>
          <span class="si-art">${c.emoji}</span>
          <span class="si-name">${c.name}</span>
          <span class="si-type">${c.cost} 费 · ${typeLine(c)}</span>
          <span class="si-text">${c.text || ''}</span>
          <span class="si-foot">${bagFull ? '背包已满' : (coins < price ? '币不够' : '买入 → 背包')}</span>
        </button>`;
      }).join('');

      const svcHtml = D.SHOP.services.map((s) => {
        const disabled = coins < s.price || (s.id === 'remove' && run.deck.length <= 1);
        return `<button class="svc-item" data-svc="${s.id}" ${disabled ? 'disabled' : ''}>
          <span class="sv-art">${s.emoji}</span>
          <span class="sv-body">
            <b>${s.name}</b>
            <em>${s.desc}</em>
          </span>
          <span class="sv-price">🪙 ${s.price}</span>
        </button>`;
      }).join('');

      $('#modalBody').innerHTML = `
        <div class="shop-head">
          <span>🪙 ${coins}</span>
          <span>🎒 背包 ${bag.length}/${Store.bagMax()}</span>
          <span>🃏 卡组 ${run.deck.length}</span>
        </div>
        <div class="shop-cards">${cardsHtml}</div>
        <h4 class="shop-sub">额外服务</h4>
        <div class="shop-services">${svcHtml}</div>
        <p class="confirm-text">买到的卡会进入<strong>局内背包</strong>，在地图界面点「🎒 背包」就能把它们加进卡组。</p>
        <div class="confirm-actions"><button class="btn-ghost" id="shopLeave">离开</button></div>`;

      $$('#modalBody [data-buy]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.buy);
          const id = offers[idx];
          if (!id) return;
          const price = priceOf(id);
          if (Store.coins() < price) { Sound.deny(); toast('币不够'); return; }
          if (Store.bag().length >= Store.bagMax()) { Sound.deny(); toast('背包满了，先丢弃一张'); return; }
          Store.runAddCoins(-price);
          const r = Store.runAddCard(id, false);
          if (!r.ok) { Store.runAddCoins(price); Sound.deny(); toast(r.msg); return; }
          offers[idx] = null;
          Sound.coin();
          toast(`买到「${D.CARD_DEFS[id].name}」，已放入背包`);
          render();
        });
      });

      $$('#modalBody [data-svc]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const svc = D.SHOP.services.find((x) => x.id === btn.dataset.svc);
          if (!svc) return;
          if (Store.coins() < svc.price) { Sound.deny(); toast('币不够'); return; }
          if (svc.id === 'heal') {
            Store.runAddCoins(-svc.price);
            const g = Store.runHeal(Math.round(run.maxHp * svc.healPct));
            Sound.heal();
            toast(`群友代付了医药费，回复 ${g} 点生命`);
            render();
            return;
          }
          if (svc.id === 'remove') {
            mode = 'remove';
            render();
          }
        });
      });

      $('#shopLeave').addEventListener('click', () => {
        closeModal('modal');
        openRun();
      });
    };

    openModalHtml('群友小卖部', '', { lock: true });
    render();
  }

  /* =========================================================
     局内背包 / 卡组调整
     ========================================================= */
  function openBagPanel() {
    if (!Store.currentRun()) { toast('先开始一次冒险'); return; }
    renderBagPanel();
    $('#bagPanel').classList.add('is-open');
  }

  function closeBagPanel() {
    $('#bagPanel').classList.remove('is-open');
  }

  function bagTile(id, where, i) {
    const c = D.CARD_DEFS[id];
    const attr = where === 'deck' ? `data-bag-remove="${i}"` : `data-bag-add="${i}"`;
    const drop = where === 'bag' ? `<span class="bag-drop" data-bag-drop="${i}" title="丢弃这张牌">✕</span>` : '';
    const kind = c.type === 'minion' ? `${c.atk}/${c.hp}` : c.type === 'field' ? '场地' : c.type === 'item' ? '道具' : '法术';
    return `<button class="bag-card rar-${c.rarity}${c.once ? ' is-once' : ''}" ${attr} title="${c.text}">
      <span class="bc-cost">${c.cost}</span>
      ${c.once ? '<span class="bc-once">一次</span>' : ''}
      ${drop}
      <span class="bc-art">${c.emoji}</span>
      <span class="bc-name">${c.name}</span>
      <span class="bc-type">${kind}</span>
    </button>`;
  }

  function renderBagPanel() {
    const run = Store.currentRun();
    if (!run) { closeBagPanel(); return; }
    const statsEl = $('#bagStats');
    if (statsEl) {
      statsEl.innerHTML = `<span>❤️ ${run.hp}/${run.maxHp}</span><span>🃏 卡组 ${run.deck.length}/${D.RUN.deckSize}</span><span>🎒 背包 ${run.bag.length}/${Store.bagMax()}</span>`;
    }
    $('#bagDeckCount').textContent = `${run.deck.length}/${D.RUN.deckSize}`;
    $('#bagBagCount').textContent = `${run.bag.length}/${Store.bagMax()}`;
    $('#bagDeck').innerHTML = run.deck.map((id, i) => bagTile(id, 'deck', i)).join('');
    $('#bagBag').innerHTML = run.bag.length
      ? run.bag.map((id, i) => bagTile(id, 'bag', i)).join('')
      : '<div class="bag-empty">背包空空如也。<br>赢下战斗、逛商店、做事件都会往里面塞卡。</div>';
    const validation = Store.runDeckValidate(run.deck);
    const hint = $('#bagHint');
    if (hint) {
      hint.textContent = validation.ok
        ? '点背包里的卡 → 加入卡组；点卡组里的卡 → 放回背包；背包卡右上角 ✕ 丢弃。'
        : validation.msg;
      hint.classList.toggle('is-warn', !validation.ok);
    }
  }

  function refreshRunViews() {
    renderBagPanel();
    renderRun();
  }

  /* =========================================================
     冒险奖励
     ========================================================= */
  function openRunRewards() {
    rewardIds = Store.rollRewardChoices(D.RUN.rewardChoices);
    const wrap = $('#rewardList');
    wrap.innerHTML = rewardIds.map((id) => {
      const c = D.CARD_DEFS[id];
      const owned = Store.owns(id);
      return `<button class="rw-item rar-${c.rarity}" data-reward="${id}">
        <span class="rw-rar">${D.RARITY[c.rarity].name}</span>
        <span class="rw-art">${c.emoji}</span>
        <span class="rw-name">${c.name}</span>
        <span class="rw-cost">${c.cost} 费</span>
        <span class="rw-text">${c.text || ''}</span>
        <span class="rw-dup">${owned ? '重复 → 进背包' : '新卡 → 进背包'}</span>
      </button>`;
    }).join('');
    $('#rewardPanel').classList.add('is-open');
  }

  function pickReward(id) {
    if (!rewardIds || rewardIds.indexOf(id) < 0) return;
    const run = Store.currentRun();
    const name = D.CARD_DEFS[id].name;
    let msg = '';
    if (run) {
      const r = Store.runAddCard(id);
      if (!r.ok) {
        Store.addCoins(40);
        msg = `背包已满，「${name}」折算 +40 🪙`;
      } else {
        msg = r.dup ? `「${name}」进了背包（重复卡，收藏折算 +${r.refund} 🪙）` : `「${name}」已放入背包`;
      }
    } else {
      const g = Store.grantCard(id);
      msg = g.dup ? `重复卡，折算 +${g.refund} 🪙` : `获得【${name}】`;
    }
    Sound.coin();
    toast(msg);
    rewardIds = null;
    closeReward();
    renderMenu();
    setTimeout(() => openRun(), 300);
  }

  function closeReward() {
    $('#rewardPanel').classList.remove('is-open');
    rewardIds = null;
  }

  /* =========================================================
     玩法说明
     ========================================================= */
  function openHelp() {
    openModalHtml('玩法说明', `
      <div class="rules">
        <div class="rule"><i>⚔️</i><div><b>回合顺序</b>
          <p>敌方部署 → 我方部署 → 开战 → 下一回合。开战时双方随从同时进攻：同线互殴，没人拦路就直接打英雄；伤害全部结算完才一起碎。</p></div></div>
        <div class="rule"><i>⚡</i><div><b>能量与抽牌</b>
          <p>每回合抽 1 张；能量回满，第 1 回合 2 点，之后每回合 +1，上限 10 点。卡牌左上角是费用。</p></div></div>
        <div class="rule"><i>🔑</i><div><b>关键词</b>
          <p>🛡护甲 X：受伤 -X　🔰护盾：抵消伤害　➤穿透：打随从也打英雄　☠致命：伤害到的随从直接倒下　✷溅射 X：溅到相邻战线　♻转世：倒下时召唤随从　🎯抗英雄 X：打英雄 +X　🩸吸血：造成伤害时回血　⚰️亡语：倒下时触发。</p></div></div>
        <div class="rule"><i>🗑️</i><div><b>弃牌</b>
          <p>手牌上限 10 张，超过 10 张时，结束回合前必须点手牌弃到 10 张。「断舍离」这类牌会主动弃牌换取爆发。</p></div></div>
        <div class="rule"><i>🎲</i><div><b>冒险模式</b>
          <p>每次生成一张 8 行随机地图：战斗 / 精英 / 事件 / 商店 / 回血房 / 休息，最后打 BOSS。血量一路带走，赢一场三选一拿卡。</p></div></div>
        <div class="rule"><i>🎒</i><div><b>局内背包</b>
          <p>冒险里拿到的卡（重复也算）先进背包，背包最多 ${D.RUN.bagMax} 张。在地图界面点「🎒 背包」可以把卡装进卡组、把卡组里的牌放回背包，或者丢弃；卡组上限 ${D.RUN.deckSize} 张。</p></div></div>
        <div class="rule"><i>🃏</i><div><b>卡组与收藏</b>
          <p>20 张卡组，传说最多 1 张、其他最多 2 张。场地 / 道具是一次性卡，每种最多带 1 张，整套最多 6 张。未拥有的卡可以合成，重复卡自动折算。</p></div></div>
      </div>
      <div class="rules-foot">
        <button class="btn-ghost small" data-act="reset-data">重置存档</button>
      </div>
    `);
  }

  function confirmReset() {
    openModalHtml('重置存档', `
      <p class="confirm-text">会清空收藏、卡组、胜场、冒险进度和疯狂币。确定吗？</p>
      <div class="confirm-actions">
        <button class="btn-primary" id="resetYes">确定重置</button>
        <button class="btn-ghost" id="resetNo">算了</button>
      </div>
    `);
    $('#resetYes').addEventListener('click', () => {
      Store.reset();
      closeModal('modal');
      renderMenu();
      toast('存档已重置');
    });
    $('#resetNo').addEventListener('click', () => closeModal('modal'));
  }

  /* =========================================================
     卡组编辑
     ========================================================= */
  function openDeckScreen() {
    deckDraft = Store.deck();
    deckFilter = 'all';
    detailId = null;
    renderDeckScreen();
    showScreen('screen-deck');
  }

  function leaveDeck() {
    if (!deckDraft) return;
    const check = Store.setDeck(deckDraft);
    toast(check.ok ? '卡组已保存' : `${check.msg}，已保留原卡组`);
    deckDraft = null;
  }

  function saveDeck() {
    const check = Store.setDeck(deckDraft);
    toast(check.ok ? '卡组已保存' : check.msg);
    if (check.ok) Sound.click();
    else Sound.deny();
    renderDeckScreen();
  }

  function removeFromDeck(index) {
    if (!deckDraft[index]) return;
    const id = deckDraft[index];
    deckDraft.splice(index, 1);
    detailId = id;
    Sound.click();
    renderDeckScreen();
  }

  function onCollectionCard(id) {
    const def = D.CARD_DEFS[id];
    if (!def) return;
    detailId = id;
    if (!canHover) { renderDeckScreen(); return; }  // 手机：先看详情，点按钮再加入
    toggleCard(id);
  }

  function toggleCard(id) {
    const def = D.CARD_DEFS[id];
    if (!Store.owns(id)) { askCraft(id); return; }
    const owned = Store.owned(id);
    const inDeck = deckDraft.filter((x) => x === id).length;
    const max = Math.min(def.once ? 1 : Store.MAX_COPIES(id), owned);

    if (inDeck < max && deckDraft.length < 20) {
      deckDraft.push(id);
      Sound.click();
      renderDeckScreen();
      return;
    }
    if (inDeck > 0) {
      deckDraft.splice(deckDraft.lastIndexOf(id), 1);
      Sound.click();
      renderDeckScreen();
      return;
    }
    if (deckDraft.length >= 20) { toast('卡组已经 20 张了，先移出一张'); Sound.deny(); }
    else { toast(`「${def.name}」最多带 ${max} 张`); Sound.deny(); }
  }

  function detailAction() {
    const id = detailId;
    if (!id || !deckDraft) return;
    if (!Store.owns(id)) { askCraft(id); return; }
    toggleCard(id);
  }

  function askCraft(id) {
    const def = D.CARD_DEFS[id];
    const cost = Store.craftCost(id);
    openModalHtml('合成卡牌', `
      <div class="craft-box">
        <div class="craft-face rar-${def.rarity}">${def.emoji}</div>
        <div class="craft-info">
          <b>${def.name}</b>
          <span>${D.RARITY[def.rarity].name} · ${def.role || ''}</span>
          <span>${def.text || ''}</span>
        </div>
      </div>
      <p class="confirm-text">花 <b class="gold">🪙 ${cost}</b> 合成 1 张？当前持有 🪙 ${Store.coins()}。</p>
      <div class="confirm-actions">
        <button class="btn-primary" id="craftYes">合成</button>
        <button class="btn-ghost" id="craftNo">算了</button>
      </div>
    `);
    $('#craftYes').addEventListener('click', () => {
      const res = Store.craft(id);
      toast(res.msg);
      if (res.ok) { Sound.coin(); closeModal('modal'); renderDeckScreen(); renderMenu(); }
      else Sound.deny();
    });
    $('#craftNo').addEventListener('click', () => closeModal('modal'));
  }

  function autoDeck() {
    const pool = Store.collection().filter((id) => Store.owns(id) > 0);
    const score = (id) => {
      const c = D.CARD_DEFS[id];
      return c.cost * 1.6 + (c.atk || 0) * 1.3 + (c.hp || 0) + ['common', 'rare', 'epic', 'legendary'].indexOf(c.rarity) * 0.6;
    };
    pool.sort((a, b) => score(b) - score(a));
    const out = [];
    let onceUsed = 0;
    for (const id of pool) {
      const def = D.CARD_DEFS[id];
      if (def.once && onceUsed >= 3) continue;
      if (def.once) onceUsed += 1;
      const cap = def.once ? 1 : Store.MAX_COPIES(id);
      const n = Math.min(cap, Store.owned(id), 20 - out.length);
      for (let i = 0; i < n; i++) out.push(id);
      if (out.length >= 20) break;
    }
    deckDraft = out;
    Sound.click();
    renderDeckScreen();
    toast(out.length === 20 ? '已生成推荐卡组' : `手里的卡只够 ${out.length} 张`);
  }

  function renderDeckScreen() {
    if (!deckDraft) return;
    $('#deckCount').textContent = deckDraft.length;
    $('#deckCount').classList.toggle('is-full', deckDraft.length === 20);

    const slots = [];
    for (let i = 0; i < 20; i++) {
      const id = deckDraft[i];
      if (id) {
        const c = D.CARD_DEFS[id];
        slots.push(`<button class="deck-slot is-filled rar-${c.rarity}" data-deck-slot="${i}" title="移出 ${c.name}">
          <span class="ds-cost">${c.cost}</span><span class="ds-emoji">${c.emoji}</span>
        </button>`);
      } else {
        slots.push('<div class="deck-slot"></div>');
      }
    }
    $('#deckSlots').innerHTML = slots.join('');

    const costs = deckDraft.map((id) => D.CARD_DEFS[id].cost);
    const avg = deckDraft.length ? (costs.reduce((a, b) => a + b, 0) / deckDraft.length).toFixed(1) : '—';
    const minions = deckDraft.filter((id) => D.CARD_DEFS[id].type === 'minion').length;
    const onceCnt = deckDraft.filter((id) => D.CARD_DEFS[id].once).length;
    $('#deckStats').innerHTML = `
      <div><span>随从</span><b>${minions}</b></div>
      <div><span>法术</span><b>${deckDraft.length - minions}</b></div>
      <div><span>平均费用</span><b>${avg}</b></div>
      <div><span>一次性</span><b>${onceCnt}/6</b></div>`;

    $$('#deckFilters [data-filter]').forEach((el) => {
      el.classList.toggle('is-on', el.dataset.filter === deckFilter);
    });

    const list = Store.collection()
      .filter((id) => deckFilter === 'all' || (deckFilter === 'owned' ? Store.owns(id) : Store.rarity(id) === deckFilter))
      .sort((a, b) => {
        const oa = Store.owns(a) ? 0 : 1;
        const ob = Store.owns(b) ? 0 : 1;
        if (oa !== ob) return oa - ob;
        const ra = ['legendary', 'epic', 'rare', 'common'].indexOf(Store.rarity(a));
        const rb = ['legendary', 'epic', 'rare', 'common'].indexOf(Store.rarity(b));
        if (ra !== rb) return ra - rb;
        return D.CARD_DEFS[a].cost - D.CARD_DEFS[b].cost;
      });

    $('#collectionGrid').innerHTML = list.map((id) => {
      const c = D.CARD_DEFS[id];
      const owned = Store.owns(id);
      const inDeck = deckDraft.filter((x) => x === id).length;
      const max = Math.min(c.once ? 1 : Store.MAX_COPIES(id), Store.owned(id));
      const typeLabel = c.type === 'spell' ? '法术' : c.type === 'field' ? '场地' : c.type === 'item' ? '道具' : `${c.atk} / ${c.hp}`;
      return `<button class="col-card rar-${c.rarity}${c.once ? ' is-once' : ''}${owned ? '' : ' is-locked'}${inDeck ? ' is-in-deck' : ''}" data-card="${id}">
        <span class="col-cost">${c.cost}</span>
        ${c.once ? '<span class="col-once">一次</span>' : ''}
        <span class="col-art">${c.emoji}</span>
        <span class="col-name">${c.name}</span>
        <span class="col-stats">${typeLabel}</span>
        <span class="col-owned">${owned ? `×${Store.owned(id)}` : `🪙${Store.craftCost(id)}`}</span>
        ${inDeck ? `<span class="col-badge">${inDeck}/${max}</span>` : ''}
        ${owned ? '' : '<span class="col-lock">未拥有</span>'}
      </button>`;
    }).join('');

    renderDetail(detailId);
  }

  function renderDetail(id) {
    const el = $('#cardDetail');
    if (!el) return;
    if (!id || !D.CARD_DEFS[id]) {
      el.innerHTML = '<div class="cd-empty">把光标停在卡牌上，或点一下卡牌查看详情</div>';
      return;
    }
    const c = D.CARD_DEFS[id];
    const owned = Store.owns(id);
    const inDeck = deckDraft ? deckDraft.filter((x) => x === id).length : 0;
    const max = Math.min(c.once ? 1 : Store.MAX_COPIES(id), Store.owned(id));
    const kws = D.keywordsOf(c);
    const typeLabel = c.type === 'spell' ? '法术' : c.type === 'field' ? '场地' : c.type === 'item' ? '道具' : '随从';
    const sizeLabel = c.type === 'minion' ? `${c.atk} 攻 / ${c.hp} 血` : typeLabel;

    let action = '';
    let actionCls = 'btn-primary small';
    if (!owned) {
      action = `合成 🪙${Store.craftCost(id)}`;
    } else if (inDeck >= max) {
      action = inDeck > 0 ? '移出 1 张' : '加入卡组';
      if (inDeck === 0 && deckDraft.length >= 20) { action = '卡组已满'; actionCls = 'btn-ghost small'; }
    } else {
      action = '加入卡组';
    }

    el.innerHTML = `
      <div class="cd-face rar-${c.rarity}">${c.emoji}</div>
      <div class="cd-main">
        <div class="cd-name">${c.name}<em style="color:${D.RARITY[c.rarity].color}">${D.RARITY[c.rarity].name}</em></div>
        <div class="cd-meta">${c.cost} 费 · ${sizeLabel}${c.once ? ' · 一次性' : ''}${c.role ? ` · ${c.role}` : ''}</div>
        ${kws.length ? `<div class="cd-kw">${kws.map((k) => `<i>${k}</i>`).join('')}</div>` : ''}
        <div class="cd-text">${c.text || '—'}</div>
        <div class="cd-owned">${owned ? `已拥有 ×${Store.owned(id)} · 卡组中 ${inDeck}/${max}` : '未拥有'}</div>
      </div>
      <button class="${actionCls} cd-act" data-detail-act="1">${action}</button>`;
  }

  /* =========================================================
     卡包商店
     ========================================================= */
  function openShop() {
    renderShop();
    showScreen('screen-shop');
  }

  function renderShop() {
    $('#shopCoins').textContent = Store.coins();
    const all = Store.collection();
    const ownDistinct = all.filter((id) => Store.owns(id)).length;
    const pct = all.length ? Math.round((ownDistinct / all.length) * 100) : 0;
    const bar = $('#collectBar');
    if (bar) bar.style.width = pct + '%';
    const txt = $('#collectText');
    if (txt) txt.innerHTML = `收集进度 <b>${ownDistinct}</b> / ${all.length}`;

    $('#packGrid').innerHTML = D.PACKS.map((p) => {
      const afford = Store.coins() >= p.price;
      const odds = Object.keys(p.weights).map((k) => `<span>${D.RARITY[k].name} ${p.weights[k]}%</span>`).join('');
      return `<div class="pack-card">
        <div class="pack-art">${p.emoji}</div>
        <div class="pack-name">${p.name}</div>
        <div class="pack-desc">${p.desc}</div>
        <div class="pack-odds">${odds}</div>
        <button class="btn-primary pack-buy${afford ? '' : ' is-poor'}" data-pack="${p.id}" ${afford ? '' : 'disabled'}>🪙 ${p.price}</button>
      </div>`;
    }).join('');

    $('#packGrid').onclick = (ev) => {
      const btn = ev.target.closest('[data-pack]');
      if (!btn) return;
      doOpenPack(btn.dataset.pack);
    };
  }

  async function doOpenPack(packId) {
    if (packBusy) return;
    const res = Store.openPack(packId);
    if (!res.ok) { toast(res.msg); Sound.deny(); return; }
    packBusy = true;
    Sound.pack();

    $('#packCards').innerHTML = res.cards.map((c) => {
      const def = D.CARD_DEFS[c.id];
      return `<div class="reveal-card rar-${def.rarity}">
        <div class="rv-inner">
          <div class="rv-cost">${def.cost}</div>
          <div class="rv-art">${def.emoji}</div>
          <div class="rv-name">${def.name}</div>
          <div class="rv-rarity">${D.RARITY[def.rarity].name}</div>
          ${c.dup ? `<div class="rv-dup">重复 · +${c.refund} 🪙</div>` : ''}
        </div>
      </div>`;
    }).join('');
    $('#packRefund').textContent = res.refund > 0 ? `重复卡牌折算 +${res.refund} 🪙` : '';
    $('#packOverlay').classList.add('is-open');

    const cards = $$('#packCards .reveal-card');
    for (let i = 0; i < cards.length; i++) {
      await sleep(180);
      cards[i].classList.add('is-in');
      if (D.CARD_DEFS[res.cards[i].id].rarity === 'legendary') Sound.win();
      else Sound.click();
    }
    packBusy = false;
    renderShop();
    renderMenu();
  }

  function closePack() {
    $('#packOverlay').classList.remove('is-open');
    renderShop();
    renderMenu();
  }

  /* =========================================================
     对外
     ========================================================= */
  function refresh() {
    renderMenu();
    if (document.getElementById('screen-deck').classList.contains('is-active')) renderDeckScreen();
    if (document.getElementById('screen-shop').classList.contains('is-active')) renderShop();
  }

  function onBattleEnd() {
    renderMenu();
  }

  return {
    init, refresh, onBattleEnd, openOpponents, openDeckScreen, openShop, renderMenu,
    openRun, closeRunPanel, openRunRewards, closeReward, renderRun, startNewRun, enterMapNode,
    isThursday, openThursdayEgg, claimThursday, closeThursdayEgg, thuClaimed,
    openBagPanel, closeBagPanel, renderBagPanel
  };
})();
