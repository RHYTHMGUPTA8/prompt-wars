/* ═══════════════════════════════════════════════════════════
   STADIUMIQ – SMART STADIUM APP JS
   Backend Simulation Engine + UI Controller
═══════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════
// 1. DATABASE / STATE STORE
// ══════════════════════════════════════════════
const DB = {
  user: {
    id: 'USR001', name: 'Aryan Shah',
    seat: 'F-24', block: '7', stand: 'West Stand',
    preferences: { vegetarian: true, spicy: false, coldBeverages: true }
  },

  match: {
    team1: 'MI', team2: 'CSK',
    team1Full: 'Mumbai Indians', team2Full: 'Chennai Super Kings',
    score1: '187/4', overs1: '18.2', score2: '204/6', overs2: '20.0',
    target: 205, reqRate: '10.4/ov',
    status: 'LIVE', stadium: 'Wankhede Stadium, Mumbai',
    stage: 'T20 · 2nd Innings'
  },

  zones: [
    { id: 'Z1',  name: 'Main Entrance (Gate A)',   capacity: 5000,  count: 1200, type: 'entry'   },
    { id: 'Z2',  name: 'North Stand',               capacity: 12000, count: 7800, type: 'seating' },
    { id: 'Z3',  name: 'South Stand',               capacity: 10000, count: 5400, type: 'seating' },
    { id: 'Z4',  name: 'East Pavilion',             capacity: 8000,  count: 5400, type: 'seating' },
    { id: 'Z5',  name: 'West Stand (Your Zone)',    capacity: 9000,  count: 3200, type: 'seating' },
    { id: 'Z6',  name: 'Food Court – Zone D',       capacity: 2000,  count: 1450, type: 'food'    },
    { id: 'Z7',  name: 'Concession Row A',          capacity: 1500,  count: 480,  type: 'food'    },
    { id: 'Z8',  name: 'Gate C (Exit)',             capacity: 3000,  count: 320,  type: 'exit'    },
    { id: 'Z9',  name: 'Family Zone',              capacity: 4000,  count: 2100, type: 'seating' },
    { id: 'Z10', name: 'Restroom Block B',         capacity: 600,   count: 310,  type: 'facility'},
  ],

  // Per-zone alert cooldown tracker (zone id → last alert timestamp)
  alertCooldowns: {},

  queues: [
    { id: 'Q1', location: 'Food Court – Zone D', people: 42, avgSvcTime: 3.5, icon: '🍔' },
    { id: 'Q2', location: 'Concession Row A', people: 12, avgSvcTime: 2.0, icon: '🌯' },
    { id: 'Q3', location: 'Beverage Stall East', people: 28, avgSvcTime: 1.8, icon: '🥤' },
    { id: 'Q4', location: 'VIP Lounge Bar', people: 8, avgSvcTime: 4.0, icon: '🍷' },
  ],

  orders: [],
  orderIdCounter: 1000,

  alerts: [
    { id: 'A1', severity: 'critical', title: '⚠️ Zone D Overcrowded', message: 'Food Court Zone D has reached 82% capacity. Please use Concession Row A as an alternative.', zone: 'Zone D', ts: Date.now() - 120000, action: 'Navigate Away' },
    { id: 'A2', severity: 'warning', title: '🟠 Long Queue – Gate A', message: 'Estimated wait at Gate A is 18 minutes. Gate C is currently clear with 3-min wait.', zone: 'Gate A', ts: Date.now() - 360000, action: 'Use Gate C' },
    { id: 'A3', severity: 'info', title: '🔵 Drinks Trolley Near You', message: 'Refreshment trolley is now in your aisle. Order directly or tap for seat delivery.', zone: 'West Stand', ts: Date.now() - 600000, action: 'Order Now' },
    { id: 'A4', severity: 'info', title: '🏏 Wicket Alert – Match Update', message: 'Rohit Sharma is OUT for 67! CSK celebrates. Current partnership broken.', zone: 'General', ts: Date.now() - 900000, action: 'View Score' },
    { id: 'A5', severity: 'warning', title: '💧 Restroom Queue Warning', message: 'Restroom Block B queue is 15 minutes. Block D (near Gate C) is open with 2-min wait.', zone: 'Block B', ts: Date.now() - 1200000, action: 'Get Route' },
  ],

  menu: [
    { id: 'M1', name: 'Vada Pav', price: 60, cat: 'food', emoji: '🥙', desc: 'Classic Mumbai street style', veg: true },
    { id: 'M2', name: 'Chicken Burger', price: 180, cat: 'food', emoji: '🍔', desc: 'Crispy grilled chicken patty', veg: false },
    { id: 'M3', name: 'Paneer Wrap', price: 130, cat: 'food', emoji: '🌯', desc: 'Tandoori paneer, fresh veggies', veg: true },
    { id: 'M4', name: 'Mutton Biryani', price: 220, cat: 'food', emoji: '🍛', desc: 'Slow cooked aromatic biryani', veg: false },
    { id: 'M5', name: 'Cold Coffee', price: 90, cat: 'beverages', emoji: '☕', desc: 'Chilled whipped cream blend', veg: true },
    { id: 'M6', name: 'Mango Lassi', price: 80, cat: 'beverages', emoji: '🥤', desc: 'Fresh Alphonso mango & yogurt', veg: true },
    { id: 'M7', name: 'Masala Soda', price: 50, cat: 'beverages', emoji: '🫧', desc: 'Spiced sparkling refresher', veg: true },
    { id: 'M8', name: 'Fresh Lime Water', price: 40, cat: 'beverages', emoji: '🍋', desc: 'Classic nimbu pani', veg: true },
    { id: 'M9', name: 'Nachos & Dip', price: 110, cat: 'snacks', emoji: '🫙', desc: 'Crispy nachos with salsa', veg: true },
    { id: 'M10', name: 'Popcorn – Caramel', price: 70, cat: 'snacks', emoji: '🍿', desc: 'Light & fluffy caramel glaze', veg: true },
    { id: 'M11', name: 'Samosa Platter', price: 80, cat: 'snacks', emoji: '🫓', desc: '3pcs with mint chutney', veg: true },
    { id: 'M12', name: 'Chicken Wings', price: 200, cat: 'snacks', emoji: '🍗', desc: 'BBQ glazed with hot dip', veg: false },
    { id: 'M13', name: 'MI Jersey – Kids', price: 999, cat: 'merchandise', emoji: '👕', desc: 'Official 2025 season jersey', veg: null },
    { id: 'M14', name: 'CSK Cap – Adults', price: 599, cat: 'merchandise', emoji: '🧢', desc: 'Yellow official fan cap', veg: null },
    { id: 'M15', name: 'Cricket Bat (Mini)', price: 450, cat: 'merchandise', emoji: '🏏', desc: 'Signed mini fan bat', veg: null },
    { id: 'M16', name: 'Stadium Tote Bag', price: 299, cat: 'merchandise', emoji: '👜', desc: 'Eco-friendly reusable bag', veg: null },
  ],

  cart: {},

  destinations: [
    { name: 'Food Court', icon: '🍔', crowd: 'high', dest: 'food_court' },
    { name: 'Restroom Block C', icon: '🚻', crowd: 'low', dest: 'restroom_c' },
    { name: 'Gate C (Exit)', icon: '🚪', crowd: 'low', dest: 'gate_c' },
    { name: 'First Aid Bay', icon: '🏥', crowd: 'low', dest: 'first_aid' },
    { name: 'VIP Lounge', icon: '⭐', crowd: 'medium', dest: 'vip_lounge' },
    { name: 'Concession Row A', icon: '🌯', crowd: 'medium', dest: 'concession' },
  ]
};

// ══════════════════════════════════════════════
// 2. BACKEND ENGINES
// ══════════════════════════════════════════════

/* ── Crowd Density Engine ── */
const CrowdEngine = {
  getDensity(count, capacity) {
    const ratio = count / capacity;
    if (ratio < 0.4)  return 'low';
    if (ratio < 0.6)  return 'medium';
    if (ratio < 0.8)  return 'high';
    return 'critical';
  },

  simulate() {
    DB.zones.forEach(z => {
      // Smaller, more realistic fluctuation: ±35 people per tick
      const fluctuation = Math.floor((Math.random() - 0.5) * 35);
      z.count = Math.max(20, Math.min(z.capacity, z.count + fluctuation));
      z.density = this.getDensity(z.count, z.capacity);
    });
  },

  getTotalAttendees() {
    return DB.zones.reduce((s, z) => s + z.count, 0);
  }
};

/* ── Queue Prediction Engine ── */
const QueueEngine = {
  calcWaitTime(people, avgSvcTime) {
    return Math.round(people * avgSvcTime / 60 * 10) / 10; // minutes
  },

  simulate() {
    DB.queues.forEach(q => {
      const d = Math.floor((Math.random() - 0.47) * 5);
      q.people = Math.max(0, q.people + d);
      q.waitingTime = this.calcWaitTime(q.people, q.avgSvcTime);
    });
  },

  getNearestQueue() {
    const sorted = [...DB.queues].sort((a, b) => a.waitingTime - b.waitingTime);
    return sorted[0];
  }
};

/* ── Alert Engine ── */
const AlertEngine = {
  // Cooldown: 3 minutes (180s) per zone before re-alerting
  COOLDOWN_MS: 180000,

  checkAndGenerate() {
    const now = Date.now();

    // Check for new density alerts (only if zone crossed into CRITICAL this tick)
    DB.zones.forEach(z => {
      if (z.density === 'critical') {
        const lastAlert = DB.alertCooldowns[z.id] || 0;
        if (now - lastAlert > this.COOLDOWN_MS) {
          DB.alertCooldowns[z.id] = now;
          DB.alerts.unshift({
            id: `A_${z.id}_${now}`,
            severity: 'critical',
            title: `⚠️ ${z.name} – Critical Density`,
            message: `${z.name} has exceeded safe capacity (${Math.round(z.count/z.capacity*100)}%). Please divert to an alternative zone immediately.`,
            zone: z.name, ts: now, action: 'Navigate Away'
          });
        }
      } else if (z.density === 'high') {
        const coolKey = `high_${z.id}`;
        const lastAlert = DB.alertCooldowns[coolKey] || 0;
        if (now - lastAlert > this.COOLDOWN_MS * 2) {
          DB.alertCooldowns[coolKey] = now;
          DB.alerts.unshift({
            id: `AH_${z.id}_${now}`,
            severity: 'warning',
            title: `🟠 ${z.name} – High Density`,
            message: `${z.name} is at ${Math.round(z.count/z.capacity*100)}% capacity and filling up. Plan your movement early.`,
            zone: z.name, ts: now, action: 'Find Route'
          });
        }
      }
    });

    // Queue alerts — only if wait > 15 min
    DB.queues.forEach(q => {
      const coolKey = `queue_${q.id}`;
      const lastAlert = DB.alertCooldowns[coolKey] || 0;
      if (q.waitingTime > 15 && now - lastAlert > this.COOLDOWN_MS) {
        DB.alertCooldowns[coolKey] = now;
        DB.alerts.unshift({
          id: `AQ_${q.id}_${now}`,
          severity: 'warning',
          title: `🟠 Long Queue – ${q.location}`,
          message: `Estimated wait at ${q.location} is ${Math.round(q.waitingTime)} min. Concession Row A is much faster right now.`,
          zone: q.location, ts: now, action: 'Find Alternate'
        });
      }
    });

    // Cap at 20 alerts
    if (DB.alerts.length > 20) DB.alerts = DB.alerts.slice(0, 20);
    updateAlertBadge();
  }
};

/* ── Navigation Engine ── */
const NavigationEngine = {
  routes: {
    food_court:  { steps: ['Exit Row F Seat', 'Head East through West Concourse', 'Pass Restroom Block B', 'Arrive at Food Court – Zone D'], dist: 320, base: 4 },
    restroom_c:  { steps: ['Exit your row left', 'Head North to Aisle C', 'Take stairs down 1 floor', 'Restroom Block C on your right'], dist: 120, base: 2 },
    gate_a:      { steps: ['Head to West Stand exit', 'Follow orange signage to Gate A', 'Join security channel 3', 'Exit via Gate A'], dist: 480, base: 7 },
    gate_c:      { steps: ['Exit Block 7 via South stairs', 'Walk 200m toward Gate C signs', 'Join the fast-exit lane', 'Exit via Gate C – Clear!'], dist: 350, base: 4 },
    first_aid:   { steps: ['Alert the nearest steward', 'OR walk to Section 12 Row A', 'First Aid Bay clearly marked in green', 'Medical staff on standby'], dist: 200, base: 3 },
    vip_lounge:  { steps: ['Show VIP pass to steward', 'Take elevator to Level 3 West', 'Follow blue VIP signage', 'Lounge entrance – Left corridor'], dist: 260, base: 4 },
  },

  // Zone-based crowd modifier
  getCrowdModifier(dest) {
    const crowdMap = { food_court: 1.7, restroom_c: 0.9, gate_a: 1.4, gate_c: 0.85, first_aid: 0.7, vip_lounge: 1.0, concession: 1.1 };
    return crowdMap[dest] || 1.0;
  },

  recommend(from, to) {
    const route = this.routes[to] || this.routes.gate_c;
    const mod = this.getCrowdModifier(to);
    const time = Math.round(route.base * mod);
    const crowd = mod < 1.0 ? 'low' : mod < 1.3 ? 'medium' : 'high';
    return { ...route, time, crowd };
  }
};

/* ── Order Management System ── */
const OrderSystem = {
  place(items) {
    const id = `ORD-${(++DB.orderIdCounter).toString().padStart(5,'0')}`;
    const order = {
      id, userId: DB.user.id, seat: DB.user.seat,
      items: [...items],
      total: items.reduce((s, i) => s + i.price * i.qty, 0),
      status: 'preparing',
      placedAt: Date.now(),
      eta: Math.floor(Math.random() * 5 + 10)
    };
    DB.orders.unshift(order);
    this.simulateProgress(order);
    return order;
  },

  simulateProgress(order) {
    setTimeout(() => {
      order.status = 'ready';
      showToast('info', '✅ Order Ready', `#${order.id} is ready for pickup! Steward en route.`);
      renderOrderTracking();
    }, 25000 + Math.random() * 10000);

    setTimeout(() => {
      order.status = 'delivered';
      showToast('success', '🎉 Delivered!', `Your order #${order.id} has been delivered to Seat ${DB.user.seat}.`);
      renderOrderTracking();
    }, 50000 + Math.random() * 15000);
  }
};

// ══════════════════════════════════════════════
// 3. SCORE SIMULATION
// ══════════════════════════════════════════════
const ScoreEngine = {
  // MI batting 2nd innings — started at 18.2 ov, 187/4; chasing 205
  score1Runs: 187, score1Wkts: 4, score1Balls: 110,  // 1 ball = 1 legal delivery
  score2Runs: 204, score2Wkts: 6, score2Balls: 120,  // CSK 1st innings (completed)
  MAX_BALLS: 120,  // 20 overs = 120 balls
  inningsOver: false,
  matchWinner: null,

  tick() {
    // Stop ticking once innings is done
    if (this.inningsOver) return;
    // Only score on ~40% of ticks for realism
    if (Math.random() > 0.58) return;

    const runs = [0, 0, 1, 1, 1, 2, 4, 6][Math.floor(Math.random() * 8)];
    this.score1Runs += runs;
    this.score1Balls = Math.min(this.score1Balls + 1, this.MAX_BALLS);

    // Random wicket (3% chance per ball)
    if (Math.random() > 0.97) this.score1Wkts = Math.min(10, this.score1Wkts + 1);

    const ov = Math.floor(this.score1Balls / 6);
    const bl = this.score1Balls % 6;
    const ovStr = `${ov}.${bl}`;
    const scoreStr = `${this.score1Runs}/${this.score1Wkts}`;

    // Update DOM
    const s1 = document.getElementById('score1');
    const o1 = document.getElementById('overs1');
    const ns = document.getElementById('navScore');
    if (s1) s1.textContent = scoreStr;
    if (o1) o1.textContent = `${ovStr} ov`;
    if (ns) ns.textContent = `MI ${scoreStr} (${ovStr})`;

    // Check match result
    const target = DB.match.target;  // 205
    if (this.score1Runs >= target) {
      this.inningsOver = true;
      this.matchWinner = 'MI';
      this._endMatch('MI wins! 🎉 Mumbai Indians chase down ' + target + ' with ' + (this.MAX_BALLS - this.score1Balls) + ' balls to spare!');
    } else if (this.score1Balls >= this.MAX_BALLS || this.score1Wkts >= 10) {
      this.inningsOver = true;
      const diff = target - this.score1Runs;
      this.matchWinner = 'CSK';
      this._endMatch('CSK wins! 🏆 Chennai Super Kings win by ' + diff + ' runs!');
    }
  },

  _endMatch(msg) {
    showToast('success', '🏏 Match Over!', msg);
    const ns = document.getElementById('navScore');
    if (ns) ns.textContent = `${this.matchWinner} Won · Full Time`;
    // Update live badge to FINAL
    document.querySelectorAll('.live-badge').forEach(el => {
      el.innerHTML = '🏆 FINAL';
      el.style.color = '#f59e0b';
      el.style.borderColor = 'rgba(245,158,11,0.4)';
      el.style.background = 'rgba(245,158,11,0.15)';
    });
  }
};

// ══════════════════════════════════════════════
// 4. UI RENDERERS
// ══════════════════════════════════════════════

function renderZoneCards() {
  const el = document.getElementById('zoneCards');
  if (!el) return;
  el.innerHTML = DB.zones.slice(0, 6).map(z => `
    <div class="zone-card">
      <div class="zone-card-left">
        <div class="zone-dot ${z.density}"></div>
        <div>
          <div class="zone-name">${z.name}</div>
          <div class="zone-count">${z.count.toLocaleString()} / ${z.capacity.toLocaleString()} people</div>
        </div>
      </div>
      <div class="zone-card-right">
        <span class="density-badge ${z.density}">${z.density.toUpperCase()}</span>
        <span class="zone-wait">${QueueEngine.calcWaitTime(Math.round(z.count/100), 2)}m wait</span>
      </div>
    </div>`).join('');
}

function renderOrdersFeed() {
  const el = document.getElementById('ordersFeed');
  if (!el) return;
  if (DB.orders.length === 0) {
    el.innerHTML = '<div class="order-pill"><div style="color:var(--text-muted);font-size:.83rem;padding:8px 0;">No orders yet. Order from the Services tab!</div></div>';
    return;
  }
  el.innerHTML = DB.orders.slice(0, 3).map(o => `
    <div class="order-pill">
      <div class="order-pill-left">
        <div class="order-pill-icon">${o.items[0]?.emoji || '🍔'}</div>
        <div>
          <div class="order-pill-name">${o.items.map(i=>i.name).join(', ')}</div>
          <div class="order-pill-time">${timeAgo(o.placedAt)} · Seat ${o.seat}</div>
        </div>
      </div>
      <span class="order-status-badge ${o.status}">${o.status.charAt(0).toUpperCase()+o.status.slice(1)}</span>
    </div>`).join('');
}

function renderHeatmapTable() {
  const tbody = document.getElementById('zoneTableBody');
  if (!tbody) return;
  tbody.innerHTML = DB.zones.map(z => {
    const pct = Math.round(z.count / z.capacity * 100);
    const wait = QueueEngine.calcWaitTime(Math.round(z.count / 100), 2);
    const s = pct < 60 ? 'ok' : pct < 80 ? 'warn' : 'danger';
    const sLabel = pct < 60 ? 'Normal' : pct < 80 ? 'Busy' : 'Crowded';
    return `<tr>
      <td>${z.name}</td>
      <td><span class="density-badge ${z.density}">${z.density.toUpperCase()}</span></td>
      <td>${z.count.toLocaleString()}</td>
      <td>${pct}%</td>
      <td>${wait} min</td>
      <td><span class="status-pill ${s}">${sLabel}</span></td>
    </tr>`;
  }).join('');
}

function renderStadiumMap() {
  const el = document.getElementById('stadiumMap');
  if (!el) return;

  const colorMap = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#ff0000' };
  const alphaMap = { low: '33', medium: '44', high: '55', critical: '88' };

  el.innerHTML = `
  <svg viewBox="0 0 380 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:460px;display:block;margin:auto">
    <defs>
      <radialGradient id="pitchGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#16a34a" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#14532d" stop-opacity="0.7"/>
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- Stadium Outer -->
    <ellipse cx="190" cy="150" rx="176" ry="136" fill="rgba(99,102,241,0.06)" stroke="rgba(99,102,241,0.25)" stroke-width="1.5"/>

    <!-- North Stand -->
    ${zoneArc('Z2', 190, 150, 130, 150, -30, -150, colorMap, el)}
    <!-- South Stand -->
    ${zoneArc('Z3', 190, 150, 130, 150, 30, 150, colorMap, el)}
    <!-- East Pavilion + West Stand -->
    ${zoneSide('Z4', 310, 100, 60, 100, colorMap)}
    ${zoneSide('Z5', 20, 100, 60, 100, colorMap)}

    <!-- Field inner green -->
    <ellipse cx="190" cy="150" rx="90" ry="70" fill="url(#pitchGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <!-- Pitch strip -->
    <rect x="175" y="118" width="30" height="64" rx="3" fill="#a3c96f" opacity="0.8"/>
    <!-- Crease lines -->
    <line x1="170" y1="130" x2="210" y2="130" stroke="white" stroke-width="1" opacity="0.5"/>
    <line x1="170" y1="170" x2="210" y2="170" stroke="white" stroke-width="1" opacity="0.5"/>
    <!-- Stumps -->
    <line x1="183" y1="118" x2="183" y2="130" stroke="#f59e0b" stroke-width="1.5"/>
    <line x1="190" y1="118" x2="190" y2="130" stroke="#f59e0b" stroke-width="1.5"/>
    <line x1="197" y1="118" x2="197" y2="130" stroke="#f59e0b" stroke-width="1.5"/>
    <line x1="183" y1="182" x2="183" y2="170" stroke="#f59e0b" stroke-width="1.5"/>
    <line x1="190" y1="182" x2="190" y2="170" stroke="#f59e0b" stroke-width="1.5"/>
    <line x1="197" y1="182" x2="197" y2="170" stroke="#f59e0b" stroke-width="1.5"/>

    <!-- Zone labels -->
    <text x="190" y="32" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="10" font-family="Inter,sans-serif">NORTH STAND</text>
    <text x="190" y="275" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="10" font-family="Inter,sans-serif">SOUTH STAND</text>
    <text x="348" y="152" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="9" font-family="Inter,sans-serif" transform="rotate(90 348 152)">EAST</text>
    <text x="32" y="152" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="9" font-family="Inter,sans-serif" transform="rotate(-90 32 152)">WEST ★</text>

    <!-- Gate indicators -->
    <g>
      <circle cx="190" cy="12" r="6" fill="${colorMap[DB.zones[0].density]}" opacity="0.9"/>
      <text x="190" y="16" text-anchor="middle" fill="white" font-size="7" font-family="Inter,sans-serif">A</text>
    </g>
    <g>
      <circle cx="362" cy="150" r="6" fill="${colorMap[DB.zones[7].density]}" opacity="0.9"/>
      <text x="362" y="154" text-anchor="middle" fill="white" font-size="7" font-family="Inter,sans-serif">B</text>
    </g>
    <g>
      <circle cx="190" cy="288" r="6" fill="${colorMap[DB.zones[7].density]}" opacity="0.9"/>
      <text x="190" y="292" text-anchor="middle" fill="white" font-size="7" font-family="Inter,sans-serif">C</text>
    </g>

    <!-- Food Court marker -->
    <g class="map-marker" onclick="showTooltip('Z6', event)">
      <circle cx="140" cy="62" r="10" fill="rgba(245,158,11,0.25)" stroke="#f59e0b" stroke-width="1.2"/>
      <text x="140" y="67" text-anchor="middle" fill="#fbbf24" font-size="10">🍔</text>
    </g>
    <!-- Medical marker -->
    <g>
      <circle cx="240" cy="62" r="10" fill="rgba(16,185,129,0.2)" stroke="#10b981" stroke-width="1.2"/>
      <text x="240" y="67" text-anchor="middle" font-size="10">🏥</text>
    </g>
    <!-- Your Seat marker -->
    <circle cx="45" cy="135" r="7" fill="rgba(99,102,241,0.8)" stroke="white" stroke-width="1.2" class="seat-marker" filter="url(#glow)"/>
    <text x="45" y="139" text-anchor="middle" fill="white" font-size="7" font-family="Inter,sans-serif">You</text>
  </svg>`;
}

function zoneArc(id, cx, cy, rx, ry, yOff, label, colorMap) {
  const z = DB.zones.find(z => z.id === id) || DB.zones[1];
  const col = colorMap[z.density];
  const pos = yOff < 0 ? { x: cx, y: cy - ry * 0.75 } : { x: cx, y: cy + ry * 0.75 };
  return `<ellipse cx="${cx}" cy="${cy + yOff/4}" rx="${rx}" ry="${ry * 0.45}" 
    fill="${col}22" stroke="${col}" stroke-width="1" opacity="0.7"
    style="cursor:pointer" onclick="showZoneTooltip('${id}')"/>`;
}

function zoneSide(id, x, y, w, h, colorMap) {
  const z = DB.zones.find(z => z.id === id) || DB.zones[4];
  const col = colorMap[z.density];
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"
    fill="${col}22" stroke="${col}" stroke-width="1" opacity="0.7"
    style="cursor:pointer" onclick="showZoneTooltip('${id}')"/>`;
}

function showZoneTooltip(zoneId) {
  const z = DB.zones.find(z => z.id === zoneId);
  if (!z) return;
  const tip = document.getElementById('mapTooltip');
  document.getElementById('ttZoneName').textContent = z.name;
  document.getElementById('ttDensity').textContent = `Density: ${z.density.toUpperCase()}`;
  document.getElementById('ttCount').textContent = `${z.count.toLocaleString()} / ${z.capacity.toLocaleString()} people`;
  document.getElementById('ttWait').textContent = `Est. wait: ${QueueEngine.calcWaitTime(Math.round(z.count/100), 2)} min`;
  tip.style.display = 'block';
  tip.style.top = '10px'; tip.style.left = '10px';
  setTimeout(() => { tip.style.display = 'none'; }, 3000);
}

function renderQuickStats() {
  const el = document.getElementById('statCrowd');
  if (el) el.textContent = CrowdEngine.getTotalAttendees().toLocaleString();
  const nearest = QueueEngine.getNearestQueue();
  const qEl = document.getElementById('statQueue');
  if (qEl) qEl.textContent = `~${nearest.waitingTime} min`;
  const aEl = document.getElementById('statAlerts');
  if (aEl) aEl.textContent = DB.alerts.filter(a => a.severity !== 'info').length;
}

function renderQueueBanner() {
  const el = document.getElementById('queueBanner');
  if (!el) return;
  QueueEngine.simulate();
  el.innerHTML = `<h3 class="card-title" style="width:100%;margin-bottom:8px">⏱️ Queue Status</h3>` +
    DB.queues.map(q => {
      const pct = Math.min(100, Math.round(q.people / 60 * 100));
      const lvl = pct < 40 ? 'low' : pct < 70 ? 'medium' : 'high';
      return `
      <div class="queue-item">
        <div class="queue-icon">${q.icon}</div>
        <div class="queue-info" style="flex:1">
          <div class="queue-name">${q.location}</div>
          <div class="queue-wait">~${q.waitingTime} min · ${q.people} in queue</div>
          <div class="queue-bar">
            <div class="queue-fill ${lvl}" style="width:${pct}%"></div>
          </div>
        </div>
      </div>`;
    }).join('');
}

function renderMenuGrid(category = 'food') {
  const el = document.getElementById('menuGrid');
  if (!el) return;
  const items = DB.menu.filter(m => m.cat === category);
  el.innerHTML = items.map(m => `
    <div class="menu-item">
      <div class="menu-item-img">${m.emoji}</div>
      ${m.veg === true ? '<span class="veg-badge">VEG</span>' : m.veg === false ? '<span class="nonveg-badge">NON-VEG</span>' : ''}
      <div class="menu-item-body">
        <div class="menu-item-name">${m.name}</div>
        <div class="menu-item-desc">${m.desc}</div>
        <div class="menu-item-footer">
          <span class="menu-item-price">₹${m.price}</span>
          <button class="add-btn" onclick="addToCart('${m.id}')" title="Add to cart">+</button>
        </div>
      </div>
    </div>`).join('');
}

function renderCart() {
  const items = Object.values(DB.cart);
  const countEl = document.getElementById('cartCount');
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  const totalBtnEl = document.getElementById('cartTotalBtn');

  if (!countEl) return;
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  countEl.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
  totalEl.textContent = `₹${total}`;
  totalBtnEl.textContent = total;

  if (items.length === 0) {
    itemsEl.innerHTML = '<div class="empty-cart">Add items to your cart</div>';
    footerEl.style.display = 'none';
  } else {
    itemsEl.innerHTML = items.map(i => `
      <div class="cart-item-row">
        <div>
          <div class="cart-item-name">${i.emoji} ${i.name}</div>
        </div>
        <div class="cart-item-qty-price">
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="changeQty('${i.id}', -1)">−</button>
            <span class="qty-num">${i.qty}</span>
            <button class="qty-btn" onclick="changeQty('${i.id}', 1)">+</button>
          </div>
          <span class="cart-item-price">₹${i.price * i.qty}</span>
        </div>
      </div>`).join('');
    footerEl.style.display = 'block';
  }
}

function renderOrderTracking() {
  const trackHeader = document.getElementById('trackingHeader');
  const trackCards = document.getElementById('trackingCards');
  if (!trackCards) return;

  if (DB.orders.length > 0) trackHeader && (trackHeader.style.display = 'flex');

  const statusSteps = ['placed', 'preparing', 'ready', 'delivered'];
  const statusIcons = { placed:'📋', preparing:'👨‍🍳', ready:'✅', delivered:'🎉' };

  trackCards.innerHTML = DB.orders.slice(0, 3).map(o => {
    const curIdx = statusSteps.indexOf(o.status);
    return `
    <div class="tracking-card">
      <div class="track-header">
        <div>
          <div class="track-name">${o.items.map(i => `${i.emoji} ${i.name}`).join(', ')}</div>
          <div class="track-order-id">#${o.id} · ₹${o.total} · Seat ${o.seat}</div>
        </div>
        <span class="order-status-badge ${o.status}">${o.status.charAt(0).toUpperCase()+o.status.slice(1)}</span>
      </div>
      <div class="track-timeline">
        ${statusSteps.map((s, i) => `
          <div class="track-step">
            <div class="track-dot ${i < curIdx ? 'done' : i === curIdx ? 'active' : ''}">
              ${i < curIdx ? '✓' : statusIcons[s]}
            </div>
            <div class="track-label">${s.charAt(0).toUpperCase()+s.slice(1)}</div>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

let _currentAlertFilter = 'all';

function renderAlerts(filter = _currentAlertFilter) {
  _currentAlertFilter = filter;
  const el = document.getElementById('alertsList');
  if (!el) return;
  const filtered = filter === 'all' ? DB.alerts : DB.alerts.filter(a => a.severity === filter);
  el.innerHTML = filtered.map((a, idx) => `
    <div class="alert-card ${a.severity}" id="alert-${a.id}" style="animation-delay:${idx*0.06}s">
      <div class="alert-icon">${a.severity==='critical'?'🔴':a.severity==='warning'?'🟠':'🔵'}</div>
      <div class="alert-body">
        <div class="alert-title">${a.title}</div>
        <div class="alert-message">${a.message}</div>
        <div class="alert-meta">
          <span class="alert-time">${timeAgo(a.ts)}</span>
          <span class="alert-zone-tag">${a.zone}</span>
        </div>
      </div>
      <div class="alert-actions-col">
        <button class="alert-action" onclick="handleAlertAction('${a.id}','${a.action}')">${a.action}</button>
        <button class="alert-dismiss" onclick="dismissAlert('${a.id}')" title="Dismiss">✕</button>
      </div>
    </div>`).join('') || '<div style="text-align:center;color:var(--text-muted);padding:40px 0;font-size:.9rem">✅ No alerts in this category</div>';
}

function handleAlertAction(alertId, action) {
  showToast('info', 'Action Taken', `${action} activated`);
  if (action === 'Navigate Away' || action === 'Find Route' || action === 'Get Route') navigateTo('navigation');
  if (action === 'Order Now') navigateTo('services');
  if (action === 'Find Alternate') navigateTo('navigation');
}

function dismissAlert(alertId) {
  DB.alerts = DB.alerts.filter(a => a.id !== alertId);
  updateAlertBadge();
  renderAlerts();
}

function renderQuickDests() {
  const el = document.getElementById('quickDests');
  if (!el) return;
  el.innerHTML = DB.destinations.map(d => `
    <div class="dest-card" onclick="setAndCalcRoute('${d.dest}')">
      <div class="dest-icon">${d.icon}</div>
      <div class="dest-name">${d.name}</div>
      <div class="dest-crowd ${d.crowd}">${d.crowd === 'low' ? '🟢 Clear' : d.crowd === 'medium' ? '🟡 Moderate' : '🔴 Busy'}</div>
    </div>`).join('');
}

function updateAlertBadge() {
  const badge = document.getElementById('alertBadge');
  const count = DB.alerts.filter(a => a.severity !== 'info').length;
  if (badge) badge.textContent = count;
}

// ══════════════════════════════════════════════
// 5. INTERACTION HANDLERS
// ══════════════════════════════════════════════

let currentPage = 'hero';

// Sync desktop nav active state
function setDeskActive(btn) {
  document.querySelectorAll('.nav-desk-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  const navBtn = document.querySelector(`[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Sync desktop nav
  const deskBtn = document.querySelector(`[data-desk-page="${page}"]`);
  setDeskActive(deskBtn || null);

  currentPage = page;
  window.scrollTo(0, 0);

  // Lazy render per page
  if (page === 'heatmap')    { renderHeatmapTable(); renderStadiumMap(); }
  if (page === 'services')   { renderQueueBanner(); renderMenuGrid('food'); renderOrderTracking(); }
  if (page === 'alerts')     { renderAlerts(); }
  if (page === 'navigation') { renderQuickDests(); }
}

function filterCategory(cat, btn) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderMenuGrid(cat);
}

function filterAlerts(sev, btn) {
  document.querySelectorAll('.alert-filter').forEach(f => f.classList.remove('active'));
  btn.classList.add('active');
  renderAlerts(sev);
}

function addToCart(itemId) {
  const item = DB.menu.find(m => m.id === itemId);
  if (!item) return;
  if (DB.cart[itemId]) {
    DB.cart[itemId].qty++;
  } else {
    DB.cart[itemId] = { ...item, qty: 1 };
  }
  renderCart();
  showToast('success', 'Added to Cart', `${item.emoji} ${item.name} added!`);
}

function changeQty(itemId, delta) {
  if (!DB.cart[itemId]) return;
  DB.cart[itemId].qty += delta;
  if (DB.cart[itemId].qty <= 0) delete DB.cart[itemId];
  renderCart();
}

function placeOrder() {
  const items = Object.values(DB.cart);
  if (items.length === 0) return;
  const order = OrderSystem.place(items);
  DB.cart = {};
  renderCart();
  renderOrderTracking();

  document.getElementById('etaTime').textContent = `${order.eta}–${order.eta + 5} minutes`;
  document.getElementById('orderId').textContent = `#${order.id}`;
  document.getElementById('orderModal').style.display = 'flex';
  renderOrdersFeed();
}

function calculateRoute() {
  const from = document.getElementById('navFrom').value;
  const to   = document.getElementById('navTo').value;
  const route = NavigationEngine.recommend(from, to);

  const resultEl = document.getElementById('routeResult');
  const stepsEl  = document.getElementById('routeSteps');
  const timeEl   = document.getElementById('routeTime');

  stepsEl.innerHTML = route.steps.map((s, i) => `
    <div class="route-step">
      <div class="step-num">${i+1}</div>
      <div>
        <div class="step-desc">${s}</div>
        <div class="step-sub">${i === 0 ? 'Start here' : i === route.steps.length-1 ? 'Destination' : `~${Math.round(route.dist / route.steps.length)}m`}</div>
      </div>
    </div>`).join('');

  timeEl.textContent = `~${route.time} min walk`;
  resultEl.style.display = 'block';

  // Alternative routes
  const altEl = document.getElementById('altRoutes');
  const altContent = document.getElementById('altRoutesContent');
  altContent.innerHTML = [
    { name: 'Via North Concourse', time: route.time + 2, crowd: 'medium' },
    { name: 'Via South Passage', time: route.time + 4, crowd: 'high' },
  ].map(r => `
    <div class="alt-route-item">
      <div>
        <div class="alt-route-name">${r.name}</div>
        <div class="alt-route-meta">~${r.time} min walk</div>
      </div>
      <span class="alt-route-chip density-badge ${r.crowd}">${r.crowd.toUpperCase()}</span>
    </div>`).join('');
  altEl.style.display = 'block';

  showToast('info', 'Route Found', `Best route calculated – ~${route.time} min walk`);
}

function setAndCalcRoute(dest) {
  document.getElementById('navTo').value = dest;
  calculateRoute();
}

function openSOS() { document.getElementById('sosModal').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function triggerSOS(type) {
  closeModal('sosModal');
  const messages = {
    medical: '🚑 Medical team dispatched to Seat F-24, Block 7. ETA: 2 minutes.',
    security: '🛡️ Security team notified. Officer heading to your location.',
    fire: '🔥 Emergency broadcast activated. Please follow evacuation signage.',
    lost: '🔍 Steward notified. Meet point: Gate C information desk.'
  };
  showToast('danger', '⚡ SOS Activated', messages[type]);
}

// ── Preference chips
document.addEventListener('click', e => {
  if (e.target.classList.contains('pref-chip')) {
    e.target.classList.toggle('active');
  }
});

// ── Modal close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
});

// ── SOS button
document.getElementById('sosTrigger')?.addEventListener('click', openSOS);

// ══════════════════════════════════════════════
// 6. TOAST SYSTEM
// ══════════════════════════════════════════════
function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', danger: '🔴' };
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ══════════════════════════════════════════════
// 7. PARTICLE BACKGROUND ENGINE
// ══════════════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize);
  resize();

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.5 + 0.1,
    color: ['#6366f1','#8b5cf6','#06b6d4','#ec4899'][Math.floor(Math.random()*4)]
  }));

  const connections = [];

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2,'0');
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ══════════════════════════════════════════════
// 8. REAL-TIME SIMULATION LOOP
// ══════════════════════════════════════════════
function simulationTick() {
  CrowdEngine.simulate();
  QueueEngine.simulate();
  AlertEngine.checkAndGenerate();
  ScoreEngine.tick();

  // Update current page UI
  renderQuickStats();
  renderZoneCards();
  renderOrdersFeed();

  if (currentPage === 'heatmap')   { renderHeatmapTable(); renderStadiumMap(); }
  if (currentPage === 'services')  { renderQueueBanner(); }
  if (currentPage === 'alerts')    { renderAlerts(); }

  document.getElementById('lastRefresh') && (document.getElementById('lastRefresh').textContent = 'Just now');
}

// ══════════════════════════════════════════════
// 9. UTILITY FUNCTIONS
// ══════════════════════════════════════════════
function timeAgo(ts) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  return `${Math.floor(secs/3600)}h ago`;
}

// ══════════════════════════════════════════════
// 10. BOOT SEQUENCE
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Initial density calculation
  DB.zones.forEach(z => z.density = CrowdEngine.getDensity(z.count, z.capacity));
  DB.queues.forEach(q => q.waitingTime = QueueEngine.calcWaitTime(q.people, q.avgSvcTime));

  // Initial renders
  renderQuickStats();
  renderZoneCards();
  renderOrdersFeed();

  // Particles background
  initParticles();

  // ── Main simulation loop: 12-second tick (realistic for a stadium app)
  //    Score, crowd & queue engines all run inside simulationTick
  simulationTick();
  setInterval(simulationTick, 12000);

  // ── Contextual commentary toasts
  setTimeout(() => showToast('info',    '🏁 Match Starting Soon', 'MI need 18 runs off 10 balls. It\'s a thriller!'), 8000);
  setTimeout(() => showToast('warning', '🟠 Crowd Alert',         'North Stand filling up fast. Head to services before the rush.'), 20000);
  setTimeout(() => showToast('info',    '🏏 Boundary!',           'Hardik Pandya hits a massive SIX over long-on! MI close in.'), 38000);
  setTimeout(() => showToast('success', '⏱️ Queue Cleared',      'Concession Row A wait dropped to ~2 min — great time to order!'), 60000);
  setTimeout(() => showToast('info',    '🚶 Steward Update',     'Trolley service active in West Stand. Tap Order to request delivery.'), 90000);

  console.log('%c🏙️ StadiumIQ Loaded – v2.0', 'color:#6366f1;font-size:16px;font-weight:bold');
  console.log('%cEngines: CrowdEngine | QueueEngine | AlertEngine | ScoreEngine | NavigationEngine | OrderSystem', 'color:#94a3b8;font-size:11px');
  console.log('%cSimulation tick: 12s | Alert cooldown: 3min per zone', 'color:#475569;font-size:10px');
});
