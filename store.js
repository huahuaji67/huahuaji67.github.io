/* =========================================================
   存档 / 经济 / 卡池 / 冒险地图 —— localStorage
   ========================================================= */
window.Store = (function () {
  'use strict';

  const D = window.CT;
  const KEY = 'v50.profile.v5';
  const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

  const COLLECTIBLE = Object.keys(D.CARD_DEFS).filter((id) => {
    const c = D.CARD_DEFS[id];
    return c.faction === 'kfc' && !c.token;
  });

  const maxCopies = (id) => (D.CARD_DEFS[id] && D.CARD_DEFS[id].rarity === 'legendary' ? 1 : 2);
  const rarity = (id) => (D.CARD_DEFS[id] || {}).rarity || 'common';
  const rarityIndex = (id) => RARITY_ORDER.indexOf(rarity(id));

  function defaults() {
    const owned = {};
    D.STARTER_DECK.forEach((id) => { owned[id] = (owned[id] || 0) + 1; });
    return {
      v: 5, coins: 150, owned, deck: D.STARTER_DECK.slice(),
      wins: 0, losses: 0, streak: 0, best: 0, packs: 0,
      runs: 0, bestRun: 0, run: null
    };
  }

  function save(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p || profile)); } catch (e) { /* ignore */ }
  }

  function sanitize(raw) {
    const base = defaults();
    const p = Object.assign({}, base, raw);
    p.owned = {};
    Object.keys(raw.owned || {}).forEach((id) => {
      if (D.CARD_DEFS[id] && !D.CARD_DEFS[id].token) {
        const n = Math.max(0, Math.min(9, Number(raw.owned[id]) || 0));
        if (n > 0) p.owned[id] = n;
      }
    });
    p.deck = Array.isArray(raw.deck)
      ? raw.deck.filter((id) => D.CARD_DEFS[id] && D.CARD_DEFS[id].faction === 'kfc' && !D.CARD_DEFS[id].token)
      : base.deck.slice();
    if (p.deck.length !== 20) p.deck = base.deck.slice();
    ['coins', 'wins', 'losses', 'streak', 'best', 'packs', 'runs', 'bestRun'].forEach((k) => {
      p[k] = Math.max(0, Number(raw[k]) || 0);
    });
    if (raw.run && Array.isArray(raw.run.map) && raw.run.map.length === D.MAP.rows) {
      p.run = raw.run;
    }
    return p;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v === 5) return sanitize(parsed);
      }
    } catch (e) { /* ignore */ }
    const fresh = defaults();
    save(fresh);
    return fresh;
  }

  let profile = load();

  const get = () => profile;
  const coins = () => profile.coins;
  const owned = (id) => (profile.owned[id] || 0);
  const owns = (id) => (profile.owned[id] || 0) > 0;
  const isCollectible = (id) => COLLECTIBLE.indexOf(id) >= 0;
  const collection = () => COLLECTIBLE.slice();
  const deck = () => profile.deck.slice();
  const deckCount = (id) => profile.deck.filter((x) => x === id).length;

  function validateDeck(list) {
    if (!Array.isArray(list)) return { ok: false, msg: '卡组数据异常' };
    if (list.length !== 20) return { ok: false, msg: `卡组需要正好 20 张（当前 ${list.length} 张）` };
    const onceCount = list.filter((id) => D.CARD_DEFS[id] && D.CARD_DEFS[id].once).length;
    if (onceCount > 6) return { ok: false, msg: `一次性卡牌最多 6 张（当前 ${onceCount} 张）` };
    const seen = {};
    for (const id of list) {
      const def = D.CARD_DEFS[id];
      if (!def || def.faction !== 'kfc' || def.token) return { ok: false, msg: '卡组里有非法卡牌' };
      seen[id] = (seen[id] || 0) + 1;
      if (seen[id] > maxCopies(id)) return { ok: false, msg: `「${def.name}」最多带 ${maxCopies(id)} 张` };
      if (owned(id) < seen[id]) return { ok: false, msg: `你没有足够的「${def.name}」` };
    }
    return { ok: true, msg: '' };
  }

  function setDeck(list) {
    const check = validateDeck(list);
    if (!check.ok) return check;
    profile.deck = list.slice();
    save();
    return check;
  }

  function craftCost(id) {
    return D.RARITY[rarity(id)].craft;
  }

  function craft(id) {
    if (!isCollectible(id)) return { ok: false, msg: '这张卡不能合成' };
    if (owned(id) >= maxCopies(id)) return { ok: false, msg: '已经拥有足够的张数' };
    const cost = craftCost(id);
    if (profile.coins < cost) return { ok: false, msg: `疯狂币不够，还差 ${cost - profile.coins}` };
    profile.coins -= cost;
    profile.owned[id] = (profile.owned[id] || 0) + 1;
    save();
    return { ok: true, msg: `合成「${D.CARD_DEFS[id].name}」成功` };
  }

  /* ---------------- 开卡包 ---------------- */
  function rollRarity(weights) {
    const keys = Object.keys(weights);
    const total = keys.reduce((s, k) => s + weights[k], 0);
    let r = Math.random() * total;
    for (const k of keys) {
      r -= weights[k];
      if (r <= 0) return k;
    }
    return 'common';
  }

  function randomCardOfRarity(r) {
    const pool = COLLECTIBLE.filter((id) => rarity(id) === r);
    if (!pool.length) return COLLECTIBLE[0];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function grantCard(id) {
    const cur = profile.owned[id] || 0;
    if (cur < maxCopies(id)) {
      profile.owned[id] = cur + 1;
      return { dup: false, refund: 0 };
    }
    const back = D.RARITY[rarity(id)].refund;
    profile.coins += back;
    return { dup: true, refund: back };
  }

  function openPack(packId) {
    const pack = D.PACKS.find((p) => p.id === packId);
    if (!pack) return { ok: false, msg: '卡包不存在' };
    if (profile.coins < pack.price) return { ok: false, msg: `疯狂币不够，还差 ${pack.price - profile.coins}` };

    profile.coins -= pack.price;
    const rolled = [];
    for (let i = 0; i < pack.count; i++) rolled.push(randomCardOfRarity(rollRarity(pack.weights)));
    const needIdx = RARITY_ORDER.indexOf(pack.guarantee);
    if (needIdx > 0 && !rolled.some((id) => rarityIndex(id) >= needIdx)) {
      rolled[rolled.length - 1] = randomCardOfRarity(pack.guarantee);
    }

    let refund = 0;
    const cards = rolled.map((id) => {
      const g = grantCard(id);
      refund += g.refund;
      return { id, dup: g.dup, refund: g.refund };
    });
    profile.packs += 1;
    save();
    return { ok: true, cards, refund, price: pack.price, pack };
  }

  /* ---------------- 战绩 ---------------- */
  function recordBattle(win, opponent) {
    if (win) {
      profile.wins += 1;
      profile.streak += 1;
      profile.best = Math.max(profile.best, profile.streak);
    } else {
      profile.losses += 1;
      profile.streak = 0;
    }
    const gain = win ? opponent.reward : 20;
    profile.coins += gain;
    save();
    return { gain, win };
  }

  function tierUnlocked(tier) {
    if (tier <= 1) return true;
    if (tier === 2) return profile.wins >= 2;
    return profile.wins >= 5;
  }

  /* =========================================================
     冒险：杀戮尖塔式随机地图
     ========================================================= */
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };

  function pickWeighted(weights) {
    const keys = Object.keys(weights);
    const total = keys.reduce((s, k) => s + weights[k], 0);
    let r = Math.random() * total;
    for (const k of keys) {
      r -= weights[k];
      if (r <= 0) return k;
    }
    return keys[0];
  }

  function tierForRow(row) {
    if (row <= 2) return 1;
    if (row <= 4) return 2;
    return 3;
  }

  function generateMap() {
    const rowsCount = D.MAP.rows;
    const counts = D.MAP.rowCounts;
    const slots = D.MAP.slots;
    const usedEnemies = new Set();
    const rows = [];
    let seq = 0;

    for (let r = 0; r < rowsCount; r++) {
      const count = counts[r] || 1;
      const nodes = [];
      if (r === 0) {
        nodes.push({ id: 'start', row: r, x: 50, type: 'start', enemyId: null, next: [] });
      } else if (r === rowsCount - 1) {
        nodes.push({ id: 'boss', row: r, x: 50, type: 'boss', enemyId: D.MAP.bossId, next: [] });
      } else {
        const xs = shuffle(slots.slice()).slice(0, Math.min(count, slots.length)).sort((a, b) => a - b);
        const types = assignTypes(r, xs.length);
        xs.forEach((x, i) => {
          let enemyId = null;
          if (types[i] === 'battle' || types[i] === 'elite') {
            enemyId = pickEnemy(tierForRow(r), usedEnemies);
          }
          nodes.push({ id: 'r' + r + 'n' + (seq++), row: r, x, type: types[i], enemyId, next: [] });
        });
      }
      rows.push(nodes);
    }

    // 连边
    for (let r = 0; r < rows.length - 1; r++) {
      const cur = rows[r];
      const next = rows[r + 1];
      cur.forEach((a) => {
        const sorted = next.slice().sort((p, q) => Math.abs(p.x - a.x) - Math.abs(q.x - a.x));
        if (sorted[0]) a.next.push(sorted[0].id);
        if (sorted[1] && Math.abs(sorted[1].x - a.x) < 40 && Math.random() < 0.55) a.next.push(sorted[1].id);
      });
      next.forEach((b) => {
        if (!cur.some((a) => a.next.indexOf(b.id) >= 0)) {
          const near = cur.slice().sort((p, q) => Math.abs(p.x - b.x) - Math.abs(q.x - b.x))[0];
          if (near) near.next.push(b.id);
        }
      });
      cur.forEach((a) => { a.next = Array.from(new Set(a.next)); });
    }
    return rows;
  }

  function assignTypes(row, count) {
    const weights = D.MAP.typeWeights[row] || { battle: 1 };
    let types = [];
    for (let i = 0; i < count; i++) types.push(pickWeighted(weights));
    if (row <= 5 && types.indexOf('battle') < 0) types[0] = 'battle';
    if (row === 6 && types.indexOf('rest') < 0) types[0] = 'rest';
    let elite = 0;
    types = types.map((t) => {
      if (t === 'elite') {
        elite += 1;
        if (elite > 1) return 'battle';
      }
      return t;
    });
    return types;
  }

  function pickEnemy(tier, used) {
    let pool = D.OPPONENTS.filter((o) => o.tier === tier && !o.boss && !used.has(o.id));
    if (!pool.length) pool = D.OPPONENTS.filter((o) => o.tier === tier && !o.boss);
    if (!pool.length) pool = D.OPPONENTS.filter((o) => !o.boss);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    used.add(pick.id);
    return pick.id;
  }

  function startRun() {
    profile.run = {
      hp: D.HERO_DEFS.player.hp,
      maxHp: D.HERO_DEFS.player.hp,
      deck: profile.deck.slice(),
      map: generateMap(),
      row: 0,
      nodeId: 'start',
      visited: ['start'],
      cleared: 0
    };
    profile.runs += 1;
    save();
    return profile.run;
  }

  function currentRun() {
    return profile.run;
  }

  function findNode(run, id) {
    if (!run) return null;
    for (const row of run.map) {
      for (const n of row) if (n.id === id) return n;
    }
    return null;
  }

  function currentNode() {
    return profile.run ? findNode(profile.run, profile.run.nodeId) : null;
  }

  function reachable() {
    const run = profile.run;
    if (!run) return [];
    const cur = findNode(run, run.nodeId);
    if (!cur) return [];
    return cur.next.map((id) => findNode(run, id)).filter(Boolean);
  }

  function canEnter(id) {
    return reachable().some((n) => n.id === id);
  }

  function runEnter(id) {
    const run = profile.run;
    if (!run || !canEnter(id)) return null;
    const node = findNode(run, id);
    run.nodeId = id;
    run.row = node.row;
    if (run.visited.indexOf(id) < 0) run.visited.push(id);
    save();
    return node;
  }

  function runDeck() {
    return profile.run ? profile.run.deck.slice() : [];
  }

  function runAddCard(id, alsoCollection) {
    if (!profile.run) return null;
    profile.run.deck.push(id);
    const g = alsoCollection === false ? null : grantCard(id);
    save();
    return g;
  }

  function runHeal(n) {
    const run = profile.run;
    if (!run) return 0;
    const before = run.hp;
    run.hp = Math.min(run.maxHp, run.hp + n);
    save();
    return run.hp - before;
  }

  function runDamage(n) {
    const run = profile.run;
    if (!run) return 0;
    run.hp = Math.max(1, run.hp - n);
    save();
    return run.hp;
  }

  function addCoins(n) {
    profile.coins = Math.max(0, profile.coins + n);
    save();
    return profile.coins;
  }

  function runAddCoins(n) {
    return addCoins(n);
  }

  function runWin(hpLeft, nodeType) {
    const run = profile.run;
    if (!run) return { finished: false };
    run.hp = Math.min(run.maxHp, Math.max(1, hpLeft) + 4);
    run.cleared += 1;

    if (nodeType === 'boss') {
      profile.coins += D.RUN.completeBonus + D.MAP.bossCoins;
      profile.bestRun = Math.max(profile.bestRun, run.row);
      profile.run = null;
      save();
      return { finished: true, bonus: D.RUN.completeBonus + D.MAP.bossCoins };
    }
    let bonus = 0;
    if (nodeType === 'elite') {
      bonus = D.MAP.eliteCoins;
      profile.coins += bonus;
    }
    profile.bestRun = Math.max(profile.bestRun, run.row);
    save();
    return { finished: false, bonus };
  }

  function runLose() {
    const run = profile.run;
    const cleared = run ? run.cleared : 0;
    const row = run ? run.row : 0;
    profile.bestRun = Math.max(profile.bestRun, row);
    profile.run = null;
    save();
    return { cleared, row };
  }

  function abandonRun() {
    profile.run = null;
    save();
  }

  function rollRewardChoices(n) {
    const out = [];
    const weights = { common: 40, rare: 38, epic: 18, legendary: 4 };
    let guard = 0;
    while (out.length < (n || D.RUN.rewardChoices) && guard++ < 40) {
      const id = randomCardOfRarity(rollRarity(weights));
      if (out.indexOf(id) < 0) out.push(id);
    }
    return out;
  }

  function reset() {
    profile = defaults();
    save();
    return profile;
  }

  return {
    MAX_COPIES: maxCopies,
    get, coins, owned, owns, collection, isCollectible, rarity,
    deck, deckCount, validateDeck, setDeck,
    craft, craftCost,
    openPack, grantCard,
    recordBattle, tierUnlocked,
    startRun, currentRun, currentNode, findNode, reachable, canEnter, runEnter,
    runDeck, runAddCard, runHeal, runDamage, runAddCoins, addCoins,
    runWin, runLose, abandonRun, rollRewardChoices,
    reset
  };
})();
