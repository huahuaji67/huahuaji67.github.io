/* =========================================================
   疯狂星期四：V我50 —— 卡牌 / 敌人 / 冒险 数据
   ---------------------------------------------------------
   关键词（借《植物大战僵尸：英雄》的蓝字能力）：
     armor      护甲 X：受到的伤害 -X
     pierce     穿透：攻击随从时同时命中敌方英雄
     deadly     致命：被它伤害的随从直接倒下
     splash     溅射 X：攻击时对相邻战线敌方随从造成 X 伤害
     afterlife  转世：倒下时召唤 token
     antiHero   抗英雄 X：攻击敌方英雄时 +X 伤害
   ========================================================= */
window.CT = (function () {
  'use strict';

  const RARITY = {
    common:    { key: 'common',    name: '普通', color: '#93A0AC', craft: 40,  refund: 10 },
    rare:      { key: 'rare',      name: '稀有', color: '#5AA6E0', craft: 100, refund: 25 },
    epic:      { key: 'epic',      name: '史诗', color: '#A87BE0', craft: 220, refund: 60 },
    legendary: { key: 'legendary', name: '传说', color: '#DCAE62', craft: 500, refund: 150 }
  };

  const HERO_DEFS = {
    player: {
      name: '你', tag: '疯狂星期四信徒', emoji: '🫵', hp: 30,
      power: { name: 'V我50', emoji: '💸', cost: 2, text: '对敌方英雄造成 3 点伤害', kind: 'damageHero', value: 3 }
    }
  };

  /* ---------------- 卡牌 ---------------- */
  const CARD_DEFS = {
    /* ===== 普通 ===== */
    chicken: {
      name: '疯狂星期四炸鸡', emoji: '🍗', cost: 1, type: 'minion', atk: 2, hp: 2,
      rarity: 'common', faction: 'kfc', role: '站场 / 抢节奏', text: '今天星期四，谁请我？'
    },
    meme: {
      name: '熊猫头表情包', emoji: '🐼', cost: 1, type: 'minion', atk: 1, hp: 3,
      rarity: 'common', faction: 'kfc', role: '站场 / 挡刀', text: '一张图顶一万句。'
    },
    smile: {
      name: '群友的假笑', emoji: '🙂', cost: 1, type: 'minion', atk: 1, hp: 2,
      rarity: 'common', faction: 'kfc', role: '直伤 / 抢血',
      effect: { type: 'battlecryDamageHero', value: 1 },
      text: '入场：对敌方英雄造成 1 点伤害。'
    },
    pat: {
      name: '拍一拍', emoji: '👋', cost: 1, type: 'spell', rarity: 'common', faction: 'kfc',
      role: '直伤 / 补刀', effect: { type: 'damageHero', value: 2 },
      text: '对敌方英雄造成 2 点伤害。'
    },
    tank: {
      name: '铁憨憨', emoji: '🛡️', cost: 2, type: 'minion', atk: 1, hp: 4, armor: 1,
      rarity: 'common', faction: 'kfc', role: '护甲 / 站场', text: '护甲 1，谁来都先挨一下。'
    },
    cactus: {
      name: '仙人掌', emoji: '🌵', cost: 3, type: 'minion', atk: 3, hp: 2, pierce: true,
      rarity: 'common', faction: 'kfc', role: '穿透 / 拆塔', text: '穿透：打随从的同时也打英雄。'
    },
    shroom: {
      name: '毒蘑菇', emoji: '🍄', cost: 2, type: 'minion', atk: 1, hp: 2, deadly: true,
      rarity: 'common', faction: 'kfc', role: '致命 / 换大怪', text: '致命：被它伤害的随从直接倒下。'
    },
    fries: {
      name: '黄金薯条', emoji: '🍟', cost: 2, type: 'minion', atk: 3, hp: 1,
      rarity: 'common', faction: 'kfc', role: '抢节奏', text: '趁热。'
    },
    doge: {
      name: '神烦狗', emoji: '🐶', cost: 2, type: 'minion', atk: 3, hp: 1,
      rarity: 'common', faction: 'kfc', role: '抢节奏', text: '汪汪，V我50。'
    },
    worker: {
      name: '打工人', emoji: '💼', cost: 2, type: 'minion', atk: 2, hp: 3,
      rarity: 'common', faction: 'kfc', role: '站场 / 交换', text: '为了这 50 块。'
    },
    coin: {
      name: '拼多多助力', emoji: '🔗', cost: 2, type: 'minion', atk: 2, hp: 2,
      rarity: 'common', faction: 'kfc', role: '过牌 / 站场',
      effect: { type: 'battlecryDraw' }, text: '入场：抽一张牌。'
    },
    cola: {
      name: '冰可乐', emoji: '🥤', cost: 2, type: 'spell', rarity: 'common', faction: 'kfc',
      role: '续航', effect: { type: 'healHero', value: 4 }, text: '己方英雄回复 4 点生命。'
    },
    parrot: {
      name: '复读机', emoji: '🦜', cost: 3, type: 'minion', atk: 3, hp: 4,
      rarity: 'common', faction: 'kfc', role: '站场', text: '+1 +1 +1 +1'
    },

    /* ===== 稀有 ===== */
    redpacket: {
      name: '抢红包', emoji: '🧧', cost: 2, type: 'spell', rarity: 'rare', faction: 'kfc',
      role: '续航 / 过牌', effect: { type: 'healHero', value: 4 }, draw: 1,
      text: '回复 4 点生命，抽一张牌。'
    },
    melon: {
      name: '西瓜投手', emoji: '🍉', cost: 4, type: 'minion', atk: 3, hp: 4, splash: 1,
      rarity: 'rare', faction: 'kfc', role: '溅射 / 清场',
      text: '溅射 1：攻击时对相邻战线敌方随从各造成 1 点伤害。'
    },
    carrot: {
      name: '复活萝卜', emoji: '🥕', cost: 3, type: 'minion', atk: 2, hp: 3, afterlife: 'radish',
      rarity: 'rare', faction: 'kfc', role: '转世 / 站场', text: '转世：倒下时召唤一个 1/1 小萝卜。'
    },
    pepper: {
      name: '火爆辣椒', emoji: '🌶️', cost: 3, type: 'minion', atk: 4, hp: 2, pierce: true,
      rarity: 'rare', faction: 'kfc', role: '穿透 / 抢血', text: '穿透：打随从的同时也打英雄。'
    },
    trash: {
      name: '垃圾桶', emoji: '🗑️', cost: 2, type: 'minion', atk: 2, hp: 3,
      rarity: 'rare', faction: 'kfc', role: '弃牌 / 站场',
      effect: { type: 'battlecryDiscard', value: 1 }, text: '入场：随机弃 1 张手牌。'
    },
    declutter: {
      name: '断舍离', emoji: '📦', cost: 2, type: 'spell', rarity: 'rare', faction: 'kfc',
      role: '弃牌 / 爆发', effect: { type: 'discardAllBurn', value: 2 },
      text: '弃光手牌，每弃 1 张对敌方英雄造成 2 点伤害。'
    },
    recycle: {
      name: '清空聊天记录', emoji: '♻️', cost: 3, type: 'spell', rarity: 'rare', faction: 'kfc',
      role: '弃牌 / 铺场', effect: { type: 'discardAllSummon', token: 'paper' },
      text: '弃光手牌，每弃 1 张召唤一个 1/1 小纸团。'
    },
    voice: {
      name: '60秒语音方阵', emoji: '🎙️', cost: 3, type: 'minion', atk: 4, hp: 2,
      rarity: 'rare', faction: 'kfc', role: '抢节奏', text: '你根本不想点开。'
    },
    burger: {
      name: '香辣鸡腿堡', emoji: '🍔', cost: 3, type: 'minion', atk: 3, hp: 4,
      rarity: 'rare', faction: 'kfc', role: '站场', text: '管饱。'
    },
    drumstick: {
      name: '吮指原味鸡', emoji: '🍖', cost: 3, type: 'minion', atk: 4, hp: 2,
      rarity: 'rare', faction: 'kfc', role: '抢节奏', text: '十一味秘制。'
    },
    triple: {
      name: '表情包三连', emoji: '🐸', cost: 3, type: 'minion', atk: 3, hp: 3,
      rarity: 'rare', faction: 'kfc', role: '直伤 / 站场',
      effect: { type: 'battlecryDamageHero', value: 1 }, text: '入场：对敌方英雄造成 1 点伤害。'
    },
    v50: {
      name: 'V我50', emoji: '💸', cost: 3, type: 'spell', rarity: 'rare', faction: 'kfc',
      role: '直伤 / 斩杀', effect: { type: 'damageHero', value: 6 }, text: '对敌方英雄造成 6 点伤害。'
    },
    notice2: {
      name: '深夜打卡', emoji: '📅', cost: 3, type: 'spell', rarity: 'rare', faction: 'kfc',
      role: '直伤 / 过牌', effect: { type: 'damageHero', value: 3 }, draw: 1,
      text: '对敌方英雄造成 3 点伤害，抽一张牌。'
    },
    atall: {
      name: '@全体成员', emoji: '📢', cost: 4, type: 'minion', atk: 5, hp: 5,
      rarity: 'rare', faction: 'kfc', role: '站场 / 大哥', text: '全体目光向我看齐！'
    },
    bucket: {
      name: '炸鸡全家桶', emoji: '🪣', cost: 4, type: 'minion', atk: 5, hp: 4,
      rarity: 'rare', faction: 'kfc', role: '站场 / 大哥', text: '八块鸡，一个人吃。'
    },

    /* ===== 史诗 ===== */
    corn: {
      name: '玉米加农炮', emoji: '🌽', cost: 5, type: 'minion', atk: 5, hp: 5, splash: 2,
      rarity: 'epic', faction: 'kfc', role: '溅射 / 清场',
      text: '溅射 2：攻击时对相邻战线敌方随从各造成 2 点伤害。'
    },
    undelete: {
      name: '撤回消息', emoji: '⏪', cost: 3, type: 'spell', rarity: 'epic', faction: 'kfc',
      role: '弃牌 / 解场', effect: { type: 'discardDestroy', value: 1 },
      text: '随机弃 1 张手牌，消灭敌方攻击力最高的随从。'
    },
    dumpster: {
      name: '捡漏王', emoji: '🧤', cost: 3, type: 'minion', atk: 2, hp: 2,
      rarity: 'epic', faction: 'kfc', role: '弃牌 / 过牌',
      effect: { type: 'battlecryDiscard', value: 1, draw: 2 }, text: '入场：随机弃 1 张，抽 2 张。'
    },
    groupbuy: {
      name: '拼团成功', emoji: '🛒', cost: 5, type: 'minion', atk: 4, hp: 4,
      rarity: 'epic', faction: 'kfc', role: '铺场',
      effect: { type: 'battlecrySummon', token: 'box' }, text: '入场：召唤一个 2/2 纸箱。'
    },
    overtime: {
      name: '老板来电', emoji: '📞', cost: 4, type: 'spell', rarity: 'epic', faction: 'kfc',
      role: '直伤 / 风险', effect: { type: 'damageBothHeroes', value: 5, self: 2 },
      text: '对敌方英雄造成 5 点伤害，己方英雄受到 2 点。'
    },
    copywriting: {
      name: '疯狂星期四文案', emoji: '📜', cost: 4, type: 'spell', rarity: 'epic', faction: 'kfc',
      role: '铺场', effect: { type: 'summon', summonId: 'feast', count: 2 },
      text: '召唤两个 3/3 的文案炸鸡。'
    },
    poison: {
      name: '深夜放毒', emoji: '🍜', cost: 4, type: 'spell', rarity: 'epic', faction: 'kfc',
      role: '吸血 / 斩杀', effect: { type: 'drain', value: 4 },
      text: '对敌方英雄造成 4 点伤害，己方英雄回复 4 点。'
    },
    transfer: {
      name: '转账 50', emoji: '🤑', cost: 5, type: 'spell', rarity: 'epic', faction: 'kfc',
      role: '直伤 / 斩杀', effect: { type: 'damageHero', value: 9 }, text: '对敌方英雄造成 9 点伤害。'
    },
    owner: {
      name: '群主大人', emoji: '👑', cost: 5, type: 'minion', atk: 5, hp: 6,
      rarity: 'epic', faction: 'kfc', role: '站场 / 续航',
      effect: { type: 'battlecryHealHero', value: 3 }, text: '入场：己方英雄回复 3 点生命。'
    },
    mute: {
      name: '全员禁言', emoji: '🤐', cost: 5, type: 'spell', rarity: 'epic', faction: 'kfc',
      role: 'AOE / 清场', effect: { type: 'damageAllEnemies', value: 2 },
      text: '对所有敌方随从造成 2 点伤害。'
    },
    rain: {
      name: '红包雨', emoji: '🎊', cost: 6, type: 'spell', rarity: 'epic', faction: 'kfc',
      role: '铺场', effect: { type: 'summon', summonId: 'gift', count: 3 },
      text: '召唤三个 2/2 的红包小助手。'
    },
    kick: {
      name: '踢出群聊', emoji: '🚪', cost: 6, type: 'spell', rarity: 'epic', faction: 'kfc',
      role: '解场', effect: { type: 'destroyStrongest' }, text: '消灭敌方攻击力最高的随从。'
    },

    /* ===== 传说 ===== */
    sunflower: {
      name: '向日葵女王', emoji: '🌻', cost: 6, type: 'minion', atk: 5, hp: 5,
      rarity: 'legendary', faction: 'kfc', role: '过牌 / 续航',
      effect: { type: 'battlecryDraw', value: 2, heal: 3 }, text: '入场：抽 2 张牌，己方英雄回复 3 点。'
    },
    firewall: {
      name: '防火墙', emoji: '🧱', cost: 4, type: 'minion', atk: 3, hp: 5, armor: 3,
      rarity: 'legendary', faction: 'kfc', role: '护甲 / 防守', text: '护甲 3，一个人堵一条线。'
    },
    colonel: {
      name: '桑德斯上校', emoji: '🧑‍🍳', cost: 7, type: 'minion', atk: 7, hp: 7,
      rarity: 'legendary', faction: 'kfc', role: '站场 / 续航',
      effect: { type: 'battlecryHealHero', value: 5 }, text: '入场：己方英雄回复 5 点生命。'
    },
    rage: {
      name: '群主の愤怒', emoji: '😤', cost: 7, type: 'spell', rarity: 'legendary', faction: 'kfc',
      role: '直伤 / AOE', effect: { type: 'rage', value: 6, splash: 2 },
      text: '对敌方英雄造成 6 点伤害，并对所有敌方随从造成 2 点。'
    },
    god: {
      name: '疯狂星期四之神', emoji: '🐔', cost: 8, type: 'minion', atk: 8, hp: 8,
      rarity: 'legendary', faction: 'kfc', role: '站场 / AOE',
      effect: { type: 'battlecryDamageAllEnemies', value: 2 },
      text: '入场：对所有敌方随从造成 2 点伤害。'
    },
    cash: {
      name: '50 元大钞', emoji: '💵', cost: 9, type: 'spell', rarity: 'legendary', faction: 'kfc',
      role: '直伤 / 终结', effect: { type: 'damageHero', value: 12 }, text: '对敌方英雄造成 12 点伤害。'
    },
    final: {
      name: '最后一顿', emoji: '🍗', cost: 8, type: 'spell', rarity: 'legendary', faction: 'kfc',
      role: '弃牌 / 终结', effect: { type: 'discardAllDamage', value: 3, flat: 6 },
      text: '弃光手牌，对敌方英雄造成 6 点伤害，每弃 1 张额外 +3。'
    },

    /* ===== 召唤物 ===== */
    feast: {
      name: '文案炸鸡', emoji: '🍗', cost: 3, type: 'minion', atk: 3, hp: 3,
      rarity: 'common', faction: 'kfc', token: true, text: '文案召唤物。'
    },
    gift: {
      name: '红包小助手', emoji: '🧧', cost: 2, type: 'minion', atk: 2, hp: 2,
      rarity: 'common', faction: 'kfc', token: true, text: '红包雨召唤物。'
    },
    paper: {
      name: '小纸团', emoji: '📄', cost: 1, type: 'minion', atk: 1, hp: 1,
      rarity: 'common', faction: 'kfc', token: true, text: '弃牌召唤物。'
    },
    radish: {
      name: '小萝卜', emoji: '🥬', cost: 1, type: 'minion', atk: 1, hp: 1,
      rarity: 'common', faction: 'kfc', token: true, text: '转世召唤物。'
    },
    box: {
      name: '纸箱', emoji: '📦', cost: 2, type: 'minion', atk: 2, hp: 2,
      rarity: 'common', faction: 'kfc', token: true, text: '拼团召唤物。'
    },

    /* ===== 团战 / 弃牌 新卡 ===== */
    pin: {
      name: '群公告置顶', emoji: '📌', cost: 3, type: 'spell',
      rarity: 'rare', faction: 'kfc', role: '铺场 / 团战',
      effect: { type: 'buffAllies', atk: 1, hp: 1 },
      text: '所有己方随从 +1/+1。'
    },
    soup2: {
      name: '鸡汤面', emoji: '🍜', cost: 3, type: 'spell',
      rarity: 'rare', faction: 'kfc', role: '团战 / 续航',
      effect: { type: 'healAllies', value: 3 },
      text: '所有己方随从回复 3 点生命。'
    },
    barrage: {
      name: '表情包连发', emoji: '🎯', cost: 2, type: 'spell',
      rarity: 'common', faction: 'kfc', role: '解场 / 随机',
      effect: { type: 'damageRandomEnemy', value: 2, times: 2 },
      text: '随机对敌方随从造成 2 点伤害，共 2 次。'
    },
    keyboard2: {
      name: '键盘', emoji: '⌨️', cost: 3, type: 'minion', atk: 3, hp: 3, deadly: true,
      rarity: 'rare', faction: 'kfc', role: '致命 / 站场',
      text: '致命：被它伤害的随从直接倒下。'
    },
    wok: {
      name: '铁锅', emoji: '🍳', cost: 4, type: 'minion', atk: 4, hp: 4, armor: 2,
      rarity: 'rare', faction: 'kfc', role: '护甲 / 站场', text: '护甲 2。'
    },
    latenight: {
      name: '加班到凌晨', emoji: '🌙', cost: 3, type: 'spell',
      rarity: 'common', faction: 'kfc', role: '过牌 / 风险',
      effect: { type: 'drawWithLife', value: 2, self: 2 },
      text: '抽 2 张牌，己方英雄受到 2 点伤害。'
    },
    groupdeal: {
      name: '拼单成功', emoji: '🛍️', cost: 4, type: 'minion', atk: 3, hp: 3,
      rarity: 'rare', faction: 'kfc', role: '铺场',
      effect: { type: 'battlecrySummon', token: 'box' }, text: '入场：召唤一个 2/2 纸箱。'
    },
    freemeal: {
      name: '免单券', emoji: '🎫', cost: 4, type: 'spell',
      rarity: 'rare', faction: 'kfc', role: '续航',
      effect: { type: 'healHero', value: 6 }, text: '己方英雄回复 6 点生命。'
    },
    chickenwing: {
      name: '炸鸡券', emoji: '🍗', cost: 5, type: 'minion', atk: 5, hp: 5,
      rarity: 'epic', faction: 'kfc', role: '站场 / AOE',
      effect: { type: 'battlecryDamageAllEnemies', value: 1 },
      text: '入场：对所有敌方随从造成 1 点伤害。'
    },
    warning: {
      name: '退群警告', emoji: '🚪', cost: 3, type: 'spell',
      rarity: 'rare', faction: 'kfc', role: 'AOE / 过牌',
      effect: { type: 'damageAllEnemies', value: 1 }, draw: 1,
      text: '对所有敌方随从造成 1 点伤害，抽一张牌。'
    },
    cart: {
      name: '清空购物车', emoji: '🛒', cost: 6, type: 'spell',
      rarity: 'epic', faction: 'kfc', role: '弃牌 / 铺场',
      effect: { type: 'discardAllSummon', token: 'box' },
      text: '弃光手牌，每弃 1 张召唤一个 2/2 纸箱。'
    },
    bigname: {
      name: '群名改成V我50', emoji: '🏷️', cost: 2, type: 'spell',
      rarity: 'common', faction: 'kfc', role: '过牌 / 弃牌',
      effect: { type: 'drawThenDiscard', value: 2, discard: 1 },
      text: '抽 2 张牌，随机弃 1 张。'
    },

    /* ===== 指向性 / 护盾 / 回费 ===== */
    focus: {
      name: '点名批评', emoji: '📢', cost: 2, type: 'spell', target: 'enemyMinion',
      rarity: 'common', faction: 'kfc', role: '解场 / 单体',
      effect: { type: 'damageMinion', value: 4 },
      text: '对一个敌方随从造成 4 点伤害。'
    },
    snipe: {
      name: '精准打击', emoji: '🎯', cost: 3, type: 'spell', target: 'enemyMinion',
      rarity: 'rare', faction: 'kfc', role: '解场 / 单体',
      effect: { type: 'damageMinion', value: 6 },
      text: '对一个敌方随从造成 6 点伤害。'
    },
    glass: {
      name: '防弹玻璃', emoji: '🪟', cost: 2, type: 'minion', atk: 2, hp: 2, shield: 1,
      rarity: 'common', faction: 'kfc', role: '护盾 / 站场',
      text: '护盾：抵消下一次伤害。'
    },
    bell: {
      name: '金钟罩', emoji: '🧿', cost: 2, type: 'spell', target: 'allyMinion',
      rarity: 'common', faction: 'kfc', role: '护盾 / 保护',
      effect: { type: 'shieldMinion', value: 1 },
      text: '给一个己方随从附加 1 层护盾。'
    },
    medal: {
      name: '免死金牌', emoji: '🥇', cost: 5, type: 'spell',
      rarity: 'epic', faction: 'kfc', role: '护盾 / 续航',
      effect: { type: 'heroShield', value: 8 },
      text: '己方英雄获得 8 点护盾。'
    },
    battery: {
      name: '充电宝', emoji: '🔋', cost: 2, type: 'minion', atk: 2, hp: 3,
      rarity: 'common', faction: 'kfc', role: '回费 / 站场',
      effect: { type: 'battlecryGainEnergy', value: 1 },
      text: '入场：本回合获得 1 点能量。'
    },
    saver: {
      name: '省电模式', emoji: '🔌', cost: 1, type: 'spell',
      rarity: 'common', faction: 'kfc', role: '回费',
      effect: { type: 'gainEnergy', value: 2 },
      text: '本回合获得 2 点能量。'
    },
    hoarder: {
      name: '守财奴', emoji: '💰', cost: 4, type: 'minion', atk: 3, hp: 4, shield: 1,
      rarity: 'rare', faction: 'kfc', role: '护盾 / 站场',
      text: '护盾：抵消下一次伤害。'
    },

    /* ===== 恢复 / 吸血 ===== */
    bandage: {
      name: '创可贴', emoji: '🩹', cost: 1, type: 'spell', target: 'allyMinion',
      rarity: 'common', faction: 'kfc', role: '治疗 / 单体',
      effect: { type: 'healMinion', value: 5 },
      text: '给一个己方随从回复 5 点生命。'
    },
    tremella: {
      name: '银耳汤', emoji: '🍲', cost: 2, type: 'spell',
      rarity: 'common', faction: 'kfc', role: '治疗 / 过牌',
      effect: { type: 'healHero', value: 3 }, draw: 1,
      text: '己方英雄回复 3 点生命，抽一张牌。'
    },
    tea: {
      name: '养生茶', emoji: '🍵', cost: 2, type: 'spell',
      rarity: 'common', faction: 'kfc', role: '治疗 / 团战',
      effect: { type: 'healAll', value: 2 },
      text: '己方英雄和所有随从回复 2 点生命。'
    },
    doctor: {
      name: '老中医', emoji: '🧓', cost: 4, type: 'minion', atk: 3, hp: 4, deathHeal: 4,
      rarity: 'rare', faction: 'kfc', role: '治疗 / 亡语',
      text: '亡语：己方英雄回复 4 点生命。'
    },
    ambulance: {
      name: '献血车', emoji: '🚑', cost: 4, type: 'minion', atk: 2, hp: 4, lifesteal: true,
      rarity: 'rare', faction: 'kfc', role: '吸血 / 站场',
      text: '吸血：造成伤害时，为己方英雄回复等量生命。'
    },
    dinner: {
      name: '团建聚餐', emoji: '🍱', cost: 4, type: 'spell',
      rarity: 'rare', faction: 'kfc', role: '治疗 / 团战',
      effect: { type: 'healAll', value: 3 }, draw: 1,
      text: '己方英雄和所有随从回复 3 点，抽一张牌。'
    },
    porridge: {
      name: '药膳', emoji: '🥣', cost: 3, type: 'spell',
      rarity: 'rare', faction: 'kfc', role: '治疗 / 护盾',
      effect: { type: 'healOverflowShield', value: 5 },
      text: '己方英雄回复 5 点生命，溢出部分转化为护盾。'
    },
    nutritionist: {
      name: '营养师', emoji: '👩‍⚕️', cost: 5, type: 'minion', atk: 4, hp: 5, lifesteal: true,
      rarity: 'epic', faction: 'kfc', role: '吸血 / 站场',
      text: '吸血：造成伤害时，为己方英雄回复等量生命。'
    },
    recipe: {
      name: '祖传秘方', emoji: '📜', cost: 5, type: 'spell',
      rarity: 'epic', faction: 'kfc', role: '治疗 / 过牌',
      effect: { type: 'healHero', value: 8 }, draw: 1,
      text: '己方英雄回复 8 点生命，抽一张牌。'
    },
    guru: {
      name: '教主', emoji: '🧙', cost: 7, type: 'minion', atk: 6, hp: 6, lifesteal: true,
      rarity: 'legendary', faction: 'kfc', role: '吸血 / 续航',
      effect: { type: 'battlecryHealHero', value: 3 },
      text: '吸血。入场：己方英雄回复 3 点生命。'
    },

    /* ===== 一次性：场地 ===== */
    field_factory: {
      name: '场地·炸鸡工厂', emoji: '🏭', cost: 4, type: 'field', once: true,
      field: { atk: 1 },
      rarity: 'rare', faction: 'kfc', role: '场地 / 团战',
      text: '一次性。己方所有随从攻击力 +1（含之后上场的）。'
    },
    field_spa: {
      name: '场地·养生会所', emoji: '🧖', cost: 3, type: 'field', once: true,
      field: { hp: 2 },
      rarity: 'rare', faction: 'kfc', role: '场地 / 防守',
      text: '一次性。己方所有随从生命 +2（含之后上场的）。'
    },
    field_kfc: {
      name: '场地·疯狂星期四门店', emoji: '🏪', cost: 6, type: 'field', once: true,
      field: { atk: 1, hp: 1 },
      rarity: 'epic', faction: 'kfc', role: '场地 / 团战',
      text: '一次性。己方所有随从 +1/+1（含之后上场的）。'
    },

    /* ===== 一次性：道具 ===== */
    item_cola: {
      name: '道具·肥宅快乐水', emoji: '🥤', cost: 2, type: 'item', once: true,
      effect: { type: 'healHero', value: 5 }, draw: 1,
      rarity: 'common', faction: 'kfc', role: '道具 / 续航',
      text: '一次性。己方英雄回复 5 点生命，抽一张牌。'
    },
    item_coupon: {
      name: '道具·打折券', emoji: '🎟️', cost: 2, type: 'item', once: true,
      effect: { type: 'gainEnergy', value: 2 },
      rarity: 'common', faction: 'kfc', role: '道具 / 回费',
      text: '一次性。本回合获得 2 点能量。'
    },
    item_bomb: {
      name: '道具·炸鸡桶炸弹', emoji: '🧨', cost: 5, type: 'item', once: true,
      effect: { type: 'damageAllEnemies', value: 3 },
      rarity: 'rare', faction: 'kfc', role: '道具 / 清场',
      text: '一次性。对所有敌方随从造成 3 点伤害。'
    },
    item_charm: {
      name: '道具·护身符', emoji: '🧿', cost: 3, type: 'item', once: true,
      effect: { type: 'heroShield', value: 6 },
      rarity: 'common', faction: 'kfc', role: '道具 / 护盾',
      text: '一次性。己方英雄获得 6 点护盾。'
    },
    item_revive: {
      name: '道具·复活币', emoji: '🪙', cost: 4, type: 'item', once: true,
      effect: { type: 'summon', summonId: 'feast', count: 2 },
      rarity: 'rare', faction: 'kfc', role: '道具 / 铺场',
      text: '一次性。召唤两个 3/3 的文案炸鸡。'
    },

    /* ================= 群友阵营（AI 专用） ================= */
    diver: {
      name: '潜水员', emoji: '🤿', cost: 1, type: 'minion', atk: 1, hp: 2,
      rarity: 'common', faction: 'qun', text: '在群里潜水三年。'
    },
    alt: {
      name: '小号', emoji: '👤', cost: 1, type: 'minion', atk: 1, hp: 1,
      rarity: 'common', faction: 'qun', token: true, text: '摇来的援军。'
    },
    face: {
      name: '小表情', emoji: '🙂', cost: 1, type: 'minion', atk: 1, hp: 2,
      rarity: 'common', faction: 'qun', token: true, text: '小王的表情包。'
    },
    read: {
      name: '已读不回', emoji: '💤', cost: 1, type: 'minion', atk: 0, hp: 4,
      rarity: 'common', faction: 'qun', text: '连“收到”都懒得回。'
    },
    next: {
      name: '下次一定', emoji: '🙏', cost: 2, type: 'minion', atk: 2, hp: 2,
      rarity: 'common', faction: 'qun', text: '下次一定请你。'
    },
    yinyang: {
      name: '阴阳怪气', emoji: '🫠', cost: 2, type: 'minion', atk: 2, hp: 3,
      rarity: 'common', faction: 'qun', text: '“就这？”'
    },
    soup: {
      name: '毒鸡汤', emoji: '🍲', cost: 2, type: 'spell',
      rarity: 'common', faction: 'qun', effect: { type: 'healHero', value: 4 },
      text: '己方英雄回复 4 点生命。'
    },
    run: {
      name: '抢了就跑', emoji: '🏃', cost: 3, type: 'minion', atk: 4, hp: 2,
      rarity: 'common', faction: 'qun', text: '抢完红包立刻退群。'
    },
    notice: {
      name: '群公告', emoji: '📢', cost: 3, type: 'spell',
      rarity: 'common', faction: 'qun', effect: { type: 'damageHero', value: 3 },
      text: '对敌方英雄造成 3 点伤害。'
    },
    spy: {
      name: '截图狂魔', emoji: '📸', cost: 3, type: 'minion', atk: 2, hp: 4,
      rarity: 'rare', faction: 'qun', effect: { type: 'battlecryDraw' }, text: '入场：抽一张牌。'
    },
    recall: {
      name: '撤回', emoji: '⏪', cost: 4, type: 'spell',
      rarity: 'rare', faction: 'qun', effect: { type: 'destroyStrongest' },
      text: '消灭敌方攻击力最高的随从。'
    },
    oldsix: {
      name: '老六', emoji: '🐢', cost: 4, type: 'minion', atk: 4, hp: 5,
      rarity: 'rare', faction: 'qun', text: '一直蹲在角落里。'
    },
    kpi: {
      name: 'KPI 考核', emoji: '📈', cost: 4, type: 'spell',
      rarity: 'rare', faction: 'qun', effect: { type: 'damageHero', value: 2 }, draw: 1,
      text: '对敌方英雄造成 2 点伤害，抽一张牌。'
    },
    warn: {
      name: '群主警告', emoji: '⚠️', cost: 5, type: 'minion', atk: 6, hp: 5,
      rarity: 'rare', faction: 'qun', text: '再发广告就踢了。'
    },
    spam: {
      name: '刷屏机器人', emoji: '🤖', cost: 5, type: 'minion', atk: 4, hp: 4,
      rarity: 'epic', faction: 'qun', effect: { type: 'battlecryDamageAllEnemies', value: 1 },
      text: '入场：对所有敌方随从造成 1 点伤害。'
    },
    black: {
      name: '拉黑', emoji: '🚫', cost: 6, type: 'minion', atk: 7, hp: 7,
      rarity: 'epic', faction: 'qun', text: '从此你的消息全是红色感叹号。'
    },
    king: {
      name: '白嫖王', emoji: '👑', cost: 7, type: 'minion', atk: 8, hp: 8,
      rarity: 'legendary', faction: 'qun', text: '白嫖一辈子，一次没请过。'
    },

    /* 群友新卡 */
    emojiBomb: {
      name: '表情包轰炸', emoji: '🐸', cost: 3, type: 'spell', rarity: 'common', faction: 'qun',
      effect: { type: 'damageHero', value: 2 }, draw: 1, text: '对敌方英雄造成 2 点伤害，抽一张牌。'
    },
    voiceBomb: {
      name: '语音轰炸', emoji: '🎙️', cost: 4, type: 'minion', atk: 3, hp: 3, rarity: 'common', faction: 'qun',
      effect: { type: 'battlecryDamageHero', value: 2 }, text: '入场：对敌方英雄造成 2 点伤害。'
    },
    bot: {
      name: '红包机器人', emoji: '🧧', cost: 3, type: 'minion', atk: 2, hp: 2, rarity: 'common', faction: 'qun',
      afterlife: 'shardgift', text: '转世：倒下时召唤一个 1/1 红包碎片。'
    },
    admin: {
      name: '管理员', emoji: '🥾', cost: 4, type: 'minion', atk: 4, hp: 4, pierce: true, rarity: 'rare', faction: 'qun',
      text: '穿透：打随从的同时也打英雄。'
    },
    bigboss: {
      name: '老板的凝视', emoji: '👁️', cost: 5, type: 'minion', atk: 6, hp: 6, armor: 1, rarity: 'epic', faction: 'qun',
      text: '护甲 1。'
    },
    freeloader: {
      name: '白嫖怪', emoji: '🫳', cost: 2, type: 'minion', atk: 1, hp: 3, antiHero: 2, rarity: 'common', faction: 'qun',
      text: '抗英雄 2：攻击英雄时 +2 伤害。'
    },
    keyboard: {
      name: '键盘侠', emoji: '⌨️', cost: 3, type: 'minion', atk: 2, hp: 2, deadly: true, rarity: 'rare', faction: 'qun',
      text: '致命：被它伤害的随从直接倒下。'
    },
    wechat: {
      name: '微商', emoji: '💄', cost: 3, type: 'minion', atk: 3, hp: 3, rarity: 'common', faction: 'qun',
      effect: { type: 'battlecryHealHero', value: 3 }, text: '入场：己方英雄回复 3 点生命。'
    },
    haggler: {
      name: '砍价高手', emoji: '🔪', cost: 5, type: 'minion', atk: 5, hp: 4, deadly: true, rarity: 'epic', faction: 'qun',
      text: '致命：被它伤害的随从直接倒下。'
    },
    bouncer: {
      name: '保安', emoji: '💂', cost: 3, type: 'minion', atk: 2, hp: 5, armor: 1,
      rarity: 'rare', faction: 'qun', text: '护甲 1，谁都不让进。'
    },
    streamer: {
      name: '主播', emoji: '🎤', cost: 4, type: 'minion', atk: 4, hp: 3,
      rarity: 'rare', faction: 'qun', effect: { type: 'battlecryDraw' }, text: '入场：抽一张牌。'
    },
    client: {
      name: '甲方', emoji: '💼', cost: 5, type: 'minion', atk: 6, hp: 5,
      rarity: 'epic', faction: 'qun', text: '需求永远改不完。'
    },
    tycoon: {
      name: '神秘大佬', emoji: '🕶️', cost: 6, type: 'minion', atk: 7, hp: 7, armor: 1,
      rarity: 'legendary', faction: 'qun', text: '护甲 1，深藏功与名。'
    },
    kfcgod: {
      name: '疯狂星期四之神', emoji: '🐔', cost: 8, type: 'minion', atk: 8, hp: 8,
      rarity: 'legendary', faction: 'qun',
      effect: { type: 'battlecryDamageAllEnemies', value: 3 },
      text: '入场：对所有敌方随从造成 3 点伤害。'
    },
    boom: {
      name: '禁言套餐', emoji: '🔇', cost: 4, type: 'spell',
      rarity: 'rare', faction: 'qun', effect: { type: 'damageHero', value: 4 },
      text: '对敌方英雄造成 4 点伤害。'
    },
    shardgift: {
      name: '红包碎片', emoji: '🧧', cost: 1, type: 'minion', atk: 1, hp: 1, rarity: 'common', faction: 'qun',
      token: true, text: '转世召唤物。'
    }
  };

  /* ---------------- 初始卡组 ---------------- */
  const STARTER_DECK = [
    'chicken', 'chicken', 'meme', 'meme', 'fries', 'fries', 'worker', 'worker',
    'doge', 'doge', 'pat', 'pat', 'parrot', 'parrot', 'coin', 'coin',
    'cola', 'smile', 'redpacket', 'v50'
  ];

  /* ---------------- 敌人 ---------------- */
  const OPPONENTS = [
    {
      id: 'xiaowang', name: '群友·小王', tag: '刚进群', emoji: '🧑', tier: 1, diff: '简单',
      hp: 26, reward: 60, deckId: 'noob', desc: '只会发表情包，适合练手',
      power: { name: '发表情', emoji: '🙂', cost: 2, text: '召唤一个 1/2 的小表情', kind: 'summon', token: 'face' }
    },
    {
      id: 'biaomei', name: '表妹', tag: '表情包十级选手', emoji: '🧒', tier: 1, diff: '简单',
      hp: 26, reward: 65, deckId: 'emoji', desc: '斗图从未输过，嘴很硬',
      power: { name: '斗图', emoji: '🐸', cost: 2, text: '对敌方英雄造成 2 点伤害', kind: 'damageHero', value: 2 }
    },
    {
      id: 'delivery', name: '外卖小哥', tag: '还有 3 分钟', emoji: '🛵', tier: 1, diff: '简单',
      hp: 28, reward: 65, deckId: 'delivery', desc: '一直在赶时间，随从下得飞快',
      power: { name: '加急', emoji: '⏱️', cost: 2, text: '召唤一个 1/1 小号', kind: 'summon', token: 'alt' }
    },
    {
      id: 'neighbor', name: '隔壁老王', tag: '串门爱好者', emoji: '🧔', tier: 1, diff: '简单',
      hp: 30, reward: 70, deckId: 'neighbor', desc: '牌组很肉，喜欢慢慢磨',
      power: { name: '串门', emoji: '🚪', cost: 2, text: '回复 3 点生命', kind: 'heal', value: 3 }
    },
    {
      id: 'laoliu', name: '群友·老六', tag: '已读不回冠军', emoji: '🫥', tier: 2, diff: '普通',
      hp: 32, reward: 100, deckId: 'veteran', desc: '会装死，也会摇人',
      power: { name: '摇人', emoji: '👥', cost: 2, text: '召唤一个 1/1 小号', kind: 'summon', token: 'alt' }
    },
    {
      id: 'keyboardman', name: '键盘侠', tag: '上来就是一套', emoji: '⌨️', tier: 2, diff: '普通',
      hp: 30, reward: 105, deckId: 'keyboard', desc: '满手法术，专打你的脸',
      power: { name: '嘴炮', emoji: '💬', cost: 2, text: '对敌方英雄造成 2 点伤害', kind: 'damageHero', value: 2 }
    },
    {
      id: 'wechat', name: '微商', tag: '最后一件', emoji: '💄', tier: 2, diff: '普通',
      hp: 34, reward: 105, deckId: 'wechat', desc: '一边回血一边刷屏',
      power: { name: '发广告', emoji: '📣', cost: 3, text: '召唤一个 2/2 红包机器人', kind: 'summon', token: 'bot' }
    },
    {
      id: 'monitor', name: '班长', tag: '点名了', emoji: '📋', tier: 2, diff: '普通',
      hp: 32, reward: 110, deckId: 'monitor', desc: '节奏很稳，别让它站住场',
      power: { name: '点名', emoji: '📢', cost: 3, text: '对敌方英雄造成 2 点伤害并抽一张牌', kind: 'damageDraw', value: 2 }
    },
    {
      id: 'date', name: '相亲对象', tag: '已读三年', emoji: '💅', tier: 2, diff: '普通',
      hp: 34, reward: 110, deckId: 'date', desc: '又奶又解场，很能耗',
      power: { name: '已读不回', emoji: '💤', cost: 2, text: '回复 4 点生命', kind: 'heal', value: 4 }
    },
    {
      id: 'owner', name: '群主大人', tag: '禁言管理员', emoji: '👑', tier: 3, diff: '困难',
      hp: 38, reward: 180, deckId: 'owner', desc: '一句话就能让你闭嘴',
      power: { name: '禁言', emoji: '🤐', cost: 3, text: '对敌方英雄造成 3 点伤害并抽一张牌', kind: 'damageDraw', value: 3 }
    },
    {
      id: 'ironfist', name: '管理员·铁拳', tag: '违规就踢', emoji: '🥊', tier: 3, diff: '困难',
      hp: 40, reward: 190, deckId: 'ironfist', desc: '大哥一个接一个，扛不住就没了',
      power: { name: '铁拳', emoji: '👊', cost: 3, text: '对敌方攻击力最高的随从造成 4 点伤害', kind: 'damageStrongest', value: 4 }
    },
    {
      id: 'freeloader', name: '白嫖王本尊', tag: '一次没请过', emoji: '🤑', tier: 3, diff: '困难',
      hp: 42, reward: 200, deckId: 'freeloader', desc: '边白嫖边回血，越拖越难打',
      power: { name: '白嫖', emoji: '🫳', cost: 3, text: '回复 3 点生命并抽一张牌', kind: 'healDraw', value: 3 }
    },
    {
      id: 'courier', name: '快递员', tag: '放门口了', emoji: '📦', tier: 1, diff: '简单',
      hp: 27, reward: 60, deckId: 'courier', desc: '跑得飞快，随从铺得快',
      power: { name: '签收', emoji: '✍️', cost: 2, text: '召唤一个 1/1 小号', kind: 'summon', token: 'alt' }
    },
    {
      id: 'classmate', name: '同学', tag: '作业借我抄抄', emoji: '🎒', tier: 1, diff: '简单',
      hp: 28, reward: 65, deckId: 'classmate', desc: '什么都带一点，什么都不精',
      power: { name: '抄作业', emoji: '📝', cost: 2, text: '抽一张牌并回复 2 点生命', kind: 'healDraw', value: 2 }
    },
    {
      id: 'client', name: '甲方爸爸', tag: '再改一版', emoji: '💼', tier: 2, diff: '普通',
      hp: 34, reward: 115, deckId: 'client', desc: '大哥很多，专拆你的场',
      power: { name: '改需求', emoji: '📝', cost: 3, text: '对敌方攻击力最高的随从造成 4 点伤害', kind: 'damageStrongest', value: 4 }
    },
    {
      id: 'streamer', name: '网红主播', tag: '感谢老板的火箭', emoji: '🎤', tier: 2, diff: '普通',
      hp: 30, reward: 110, deckId: 'streamer', desc: '满手法术，一边打脸一边抽牌',
      power: { name: '求礼物', emoji: '🎁', cost: 2, text: '回复 3 点生命并抽一张牌', kind: 'healDraw', value: 3 }
    },
    {
      id: 'tycoon', name: '神秘大佬', tag: '我全都要', emoji: '🕶️', tier: 3, diff: '困难',
      hp: 42, reward: 210, deckId: 'tycoon', desc: '又肉又能奶，后期几乎无解',
      power: { name: '钞能力', emoji: '💰', cost: 3, text: '对敌方英雄造成 3 点伤害并回复 3 点', kind: 'damageHeal', value: 3 }
    },
    {
      id: 'kfcgod', name: '疯狂星期四之神', tag: '万群之主', emoji: '🐔', tier: 3, diff: 'BOSS', boss: true,
      hp: 50, reward: 320, deckId: 'kfcgod', desc: '群聊的终点，V 了所有人的 50',
      power: { name: '恩赐', emoji: '🍗', cost: 3, text: '召唤一个 2/2 红包机器人', kind: 'summon', token: 'bot' }
    },
    {
      id: 'guard', name: '保安大叔', tag: '站岗十年', emoji: '💂', tier: 1, diff: '简单',
      hp: 29, reward: 65, deckId: 'guard', desc: '满编护甲墙，专治快攻',
      power: { name: '站岗', emoji: '🫡', cost: 3, text: '召唤一个 2/5 保安', kind: 'summon', token: 'bouncer' }
    },
    {
      id: 'coach', name: '健身教练', tag: '再来十组', emoji: '🏋️', tier: 1, diff: '简单',
      hp: 28, reward: 65, deckId: 'coach', desc: '随从一个比一个大',
      power: { name: '加油', emoji: '💪', cost: 2, text: '回复 3 点生命', kind: 'heal', value: 3 }
    },
    {
      id: 'radio', name: '深夜电台', tag: '凌晨两点开播', emoji: '📻', tier: 2, diff: '普通',
      hp: 31, reward: 110, deckId: 'radio', desc: '全是法术，专烧你的脸',
      power: { name: '点歌', emoji: '🎵', cost: 3, text: '对敌方英雄造成 3 点伤害并抽一张牌', kind: 'damageDraw', value: 3 }
    },
    {
      id: 'booster', name: '代练小哥', tag: '上号，包赢', emoji: '🎮', tier: 2, diff: '普通',
      hp: 32, reward: 110, deckId: 'booster', desc: '一回合铺满五条线',
      power: { name: '上号', emoji: '🕹️', cost: 2, text: '召唤一个 1/1 小号', kind: 'summon', token: 'alt' }
    },
    {
      id: 'mystery', name: '神秘女网友', tag: '见过照片', emoji: '💃', tier: 3, diff: '困难',
      hp: 40, reward: 200, deckId: 'mystery', desc: '又奶又解场，拖到后期要你命',
      power: { name: '撒娇', emoji: '💋', cost: 3, text: '回复 3 点生命并抽一张牌', kind: 'healDraw', value: 3 }
    },
    {
      id: 'altaccount', name: '群主的小号', tag: '我换个号来', emoji: '🕵️', tier: 3, diff: '困难',
      hp: 39, reward: 195, deckId: 'altaccount', desc: '小号无穷无尽，永远杀不完',
      power: { name: '潜伏', emoji: '🫥', cost: 3, text: '对敌方攻击力最高的随从造成 4 点伤害', kind: 'damageStrongest', value: 4 }
    }
  ];

  /* ---------------- 敌人牌库 ---------------- */
  const ENEMY_DECKS = {
    noob: [
      'diver', 'diver', 'diver', 'read', 'read', 'next', 'next', 'next',
      'yinyang', 'yinyang', 'soup', 'soup', 'run', 'run', 'notice', 'notice',
      'alt', 'alt', 'oldsix', 'oldsix'
    ],
    emoji: [
      'diver', 'next', 'next', 'yinyang', 'yinyang', 'yinyang', 'face', 'face',
      'emojiBomb', 'emojiBomb', 'voiceBomb', 'notice', 'notice', 'run', 'run',
      'spy', 'spy', 'bot', 'bot', 'alt', 'alt'
    ],
    delivery: [
      'diver', 'diver', 'alt', 'alt', 'run', 'run', 'run', 'next', 'next',
      'notice', 'notice', 'notice', 'keyboard', 'keyboard', 'admin', 'admin',
      'emojiBomb', 'bot', 'bot', 'soup'
    ],
    neighbor: [
      'read', 'read', 'diver', 'soup', 'soup', 'yinyang', 'yinyang', 'oldsix',
      'oldsix', 'oldsix', 'warn', 'warn', 'bot', 'bot', 'admin', 'admin',
      'bigboss', 'voiceBomb', 'spy', 'spy'
    ],
    veteran: [
      'diver', 'diver', 'read', 'read', 'next', 'next', 'yinyang', 'yinyang',
      'soup', 'soup', 'run', 'run', 'notice', 'notice', 'spy', 'oldsix',
      'oldsix', 'warn', 'recall', 'black'
    ],
    keyboard: [
      'notice', 'notice', 'notice', 'emojiBomb', 'emojiBomb', 'emojiBomb',
      'kpi', 'kpi', 'spy', 'spy', 'yinyang', 'yinyang', 'keyboard', 'keyboard',
      'read', 'read', 'soup', 'soup', 'run', 'run'
    ],
    wechat: [
      'soup', 'soup', 'soup', 'wechat', 'wechat', 'wechat', 'read', 'read',
      'bot', 'bot', 'next', 'next', 'oldsix', 'oldsix', 'bigboss', 'bigboss',
      'admin', 'admin', 'kpi', 'kpi'
    ],
    monitor: [
      'diver', 'diver', 'next', 'next', 'spy', 'spy', 'spy', 'kpi', 'kpi',
      'notice', 'notice', 'admin', 'admin', 'oldsix', 'oldsix', 'warn', 'warn',
      'emojiBomb', 'emojiBomb', 'soup'
    ],
    date: [
      'read', 'read', 'read', 'soup', 'soup', 'soup', 'yinyang', 'yinyang',
      'freeloader', 'freeloader', 'freeloader', 'oldsix', 'oldsix', 'warn',
      'warn', 'black', 'black', 'recall', 'recall', 'bot', 'bot', 'haggler'
    ],
    owner: [
      'alt', 'alt', 'next', 'next', 'yinyang', 'yinyang', 'soup', 'soup',
      'spy', 'spy', 'run', 'oldsix', 'oldsix', 'warn', 'warn', 'kpi',
      'recall', 'recall', 'black', 'black', 'king', 'spam', 'spam'
    ],
    ironfist: [
      'admin', 'admin', 'admin', 'black', 'black', 'bigboss', 'bigboss',
      'haggler', 'haggler', 'warn', 'warn', 'oldsix', 'oldsix', 'run', 'run',
      'spam', 'spam', 'bot', 'bot', 'recall'
    ],
    freeloader: [
      'freeloader', 'freeloader', 'freeloader', 'bot', 'bot', 'bot', 'soup',
      'soup', 'soup', 'read', 'read', 'oldsix', 'oldsix', 'black', 'black',
      'king', 'haggler', 'haggler', 'admin', 'admin', 'yinyang', 'yinyang'
    ],
    courier: [
      'diver', 'diver', 'diver', 'alt', 'alt', 'run', 'run', 'run', 'next', 'next',
      'notice', 'notice', 'notice', 'keyboard', 'keyboard', 'emojiBomb', 'emojiBomb', 'bot', 'bot', 'soup'
    ],
    classmate: [
      'diver', 'diver', 'next', 'next', 'yinyang', 'yinyang', 'yinyang', 'read', 'read',
      'spy', 'spy', 'notice', 'notice', 'soup', 'soup', 'oldsix', 'oldsix', 'bouncer', 'bouncer', 'bot'
    ],
    client: [
      'read', 'read', 'yinyang', 'yinyang', 'oldsix', 'oldsix', 'oldsix', 'client', 'client',
      'bouncer', 'bouncer', 'bouncer', 'admin', 'admin', 'warn', 'warn', 'soup', 'soup', 'recall', 'black'
    ],
    streamer: [
      'notice', 'notice', 'notice', 'emojiBomb', 'emojiBomb', 'emojiBomb', 'voiceBomb', 'voiceBomb',
      'spy', 'spy', 'kpi', 'kpi', 'streamer', 'streamer', 'soup', 'soup', 'yinyang', 'yinyang', 'bot', 'boom'
    ],
    tycoon: [
      'read', 'read', 'soup', 'soup', 'soup', 'bouncer', 'bouncer', 'bouncer', 'client', 'client',
      'tycoon', 'tycoon', 'black', 'black', 'king', 'recall', 'recall', 'admin', 'admin', 'haggler', 'boom'
    ],
    kfcgod: [
      'bouncer', 'bouncer', 'bouncer', 'client', 'client', 'client', 'tycoon', 'tycoon', 'tycoon',
      'black', 'black', 'king', 'king', 'kfcgod', 'boom', 'boom', 'boom', 'admin', 'admin',
      'recall', 'recall', 'spam', 'spam', 'soup', 'soup'
    ],
    guard: [
      'read', 'read', 'read', 'bouncer', 'bouncer', 'bouncer', 'oldsix', 'oldsix',
      'warn', 'warn', 'black', 'black', 'bigboss', 'bigboss', 'admin', 'admin',
      'soup', 'soup', 'notice', 'notice', 'recall', 'recall'
    ],
    coach: [
      'diver', 'diver', 'next', 'next', 'next', 'yinyang', 'yinyang', 'run', 'run',
      'oldsix', 'oldsix', 'oldsix', 'warn', 'warn', 'black', 'black', 'spam', 'spam',
      'soup', 'soup', 'bot', 'bot'
    ],
    radio: [
      'notice', 'notice', 'notice', 'emojiBomb', 'emojiBomb', 'emojiBomb', 'boom', 'boom',
      'kpi', 'kpi', 'spy', 'spy', 'streamer', 'streamer', 'soup', 'soup', 'yinyang',
      'yinyang', 'run', 'run', 'bot', 'bot'
    ],
    booster: [
      'diver', 'diver', 'diver', 'alt', 'alt', 'alt', 'run', 'run', 'run', 'next',
      'next', 'spy', 'spy', 'oldsix', 'oldsix', 'admin', 'admin', 'notice', 'notice',
      'soup', 'soup', 'emojiBomb'
    ],
    mystery: [
      'read', 'read', 'soup', 'soup', 'soup', 'bouncer', 'bouncer', 'client', 'client',
      'tycoon', 'black', 'black', 'king', 'recall', 'recall', 'admin', 'admin',
      'haggler', 'haggler', 'boom', 'boom'
    ],
    altaccount: [
      'diver', 'diver', 'diver', 'alt', 'alt', 'alt', 'run', 'run', 'next', 'next',
      'spy', 'spy', 'keyboard', 'keyboard', 'black', 'black', 'warn', 'warn',
      'king', 'boom', 'boom'
    ]
  };

  /* ---------------- 冒险模式 ---------------- */
  const RUN = {
    completeBonus: 300,
    rewardChoices: 3,
    title: '疯狂星期四 · 群聊大乱斗',
    startHp: 40,          /* 冒险起始生命 */
    winHeal: 6,           /* 每场战斗后回复 */
    bagMax: 16,           /* 局内背包容量 */
    deckSize: 20,
    healPct: 0.35,        /* 休息点回复比例 */
    healRoomPct: 0.6      /* 回血房回复比例 */
  };

  /* 冒险商店的附加服务 */
  const SHOP = {
    services: [
      { id: 'heal', emoji: '🧧', name: '群友代付', price: 80, desc: '回复 40% 最大生命', healPct: 0.4 },
      { id: 'remove', emoji: '🗑️', name: '删掉黑历史', price: 60, desc: '从卡组里移除 1 张牌', remove: 1 }
    ]
  };

  /* 杀戮尖塔式随机地图：8 行（0 起点 / 1-6 随机节点 / 7 BOSS） */
  const MAP = {
    rows: 8,
    rowCounts: [1, 2, 3, 4, 3, 4, 2, 1],
    slots: [16, 38, 62, 84],
    typeWeights: {
      1: { battle: 1 },
      2: { battle: 0.5, heal: 0.22, event: 0.28 },
      3: { battle: 0.42, heal: 0.18, shop: 0.22, elite: 0.18 },
      4: { battle: 0.34, event: 0.26, heal: 0.2, elite: 0.2 },
      5: { battle: 0.38, shop: 0.24, heal: 0.2, elite: 0.18 },
      6: { rest: 0.4, heal: 0.3, elite: 0.3 }
    },
    eliteCoins: 40,
    bossCoins: 200,
    bossId: 'kfcgod',
    healPct: 0.35,
    /* 肉鸽里敌人血量低于自由对战：普通 0.6、精英 0.72、BOSS 0.8 */
    hpScale: { battle: 0.6, elite: 0.72, boss: 0.8 }
  };

  const NODE_META = {
    start:  { icon: '🚩', name: '起点' },
    battle: { icon: '⚔️', name: '战斗' },
    elite:  { icon: '💀', name: '精英' },
    event:  { icon: '❓', name: '事件' },
    shop:   { icon: '🛒', name: '商店' },
    rest:   { icon: '💤', name: '休息' },
    heal:   { icon: '🩺', name: '回血房' },
    boss:   { icon: '👑', name: 'BOSS' }
  };

  const EVENTS = [
    {
      id: 'redpacket', emoji: '🧧', title: '群里下起了红包雨',
      text: '有人发了个 200 元的红包，已经 30 个人抢过了。',
      options: [
        { label: '抢！', effect: { type: 'coins', value: 40 } },
        { label: '装没看见', effect: { type: 'heal', value: 6 } }
      ]
    },
    {
      id: 'link', emoji: '🔗', title: '神秘链接',
      text: '“点开这个链接，疯狂星期四免费吃一年。”',
      options: [
        { label: '点开（-5 血）', effect: { type: 'card', value: 1, hp: 5 } },
        { label: '反手举报', effect: { type: 'coins', value: 25 } }
      ]
    },
    {
      id: 'takeout', emoji: '🛵', title: '深夜外卖',
      text: '凌晨一点，外卖小哥在楼下等你，一份炸鸡 20 块。',
      options: [
        { label: '下去拿（-20 币）', effect: { type: 'heal', value: 12, coins: -20 } },
        { label: '继续躺着', effect: { type: 'card', value: 1 } }
      ]
    },
    {
      id: 'help', emoji: '🆘', title: '群友求助',
      text: '“兄弟，能 V 我 50 吗？下个月一定还。”',
      options: [
        { label: '借他 50', effect: { type: 'card', value: 2, coins: -50 } },
        { label: '已读不回', effect: { type: 'coins', value: 20 } }
      ]
    },
    {
      id: 'ad', emoji: '📢', title: '广告轰炸',
      text: '群里有个人连发 99+ 条微商广告。',
      options: [
        { label: '踢了他', effect: { type: 'coins', value: 35 } },
        { label: '跟着刷屏', effect: { type: 'card', value: 1 } }
      ]
    }
  ];

  /* ---------------- 卡包 ---------------- */
  const PACKS = [
    {
      id: 'normal', name: '疯狂星期四盲盒', emoji: '🍗', price: 100, count: 3,
      guarantee: 'rare',
      weights: { common: 68, rare: 26, epic: 5, legendary: 1 },
      desc: '3 张随机卡牌 · 保底 1 张稀有'
    },
    {
      id: 'deluxe', name: '群主豪华盲盒', emoji: '👑', price: 260, count: 5,
      guarantee: 'epic',
      weights: { common: 38, rare: 42, epic: 17, legendary: 3 },
      desc: '5 张随机卡牌 · 保底 1 张史诗'
    }
  ];

  const MEME_LINES = [
    '今天肯德基疯狂星期四，谁请我吃？', 'V我50，明天还你500', '你甚至不愿意叫我一声 V50',
    '下次一定', '群友已读不回，心凉了', '抢到 0.01 元，谢谢老板',
    '疯狂星期四，炸鸡自由', '这条消息我复读三遍', '拍一拍，然后 V 我 50',
    '@全体成员：V我50', '不 V 不是群友', '本群人均身价 50'
  ];

  const BUBBLE_TEXTS = [
    'V我50', '下次一定', '今天星期四', '已读不回', '🧧 0.01 元', '🍗🍗🍗',
    '在吗', '群主最帅', '复读 +1', '撤回了一条消息', '@全体成员'
  ];

  /* 关键词文案 */
  const KW_TEXT = {
    armor: (v) => `护甲 ${v}`,
    pierce: () => '穿透',
    deadly: () => '致命',
    splash: (v) => `溅射 ${v}`,
    afterlife: () => '转世',
    antiHero: (v) => `抗英雄 ${v}`
  };

  function keywordsOf(def) {
    if (!def) return [];
    const out = [];
    if (def.lifesteal) out.push('吸血');
    if (def.deathHeal) out.push(`亡语 回${def.deathHeal}`);
    if (def.armor) out.push(KW_TEXT.armor(def.armor));
    if (def.pierce) out.push(KW_TEXT.pierce());
    if (def.deadly) out.push(KW_TEXT.deadly());
    if (def.splash) out.push(KW_TEXT.splash(def.splash));
    if (def.afterlife) out.push(KW_TEXT.afterlife());
    if (def.antiHero) out.push(KW_TEXT.antiHero(def.antiHero));
    return out;
  }

  return {
    RARITY, HERO_DEFS, CARD_DEFS, STARTER_DECK,
    OPPONENTS, ENEMY_DECKS, RUN, MAP, SHOP, NODE_META, EVENTS, PACKS, MEME_LINES, BUBBLE_TEXTS,
    keywordsOf
  };
})();
