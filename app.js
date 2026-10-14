// ============ Clippers & Co. — Barbershop OS (frontend) ============
// Functional internal tool: schedule, clients, bookings, to-do, supplies.
// All data persists in localStorage (per-browser). No backend needed.

const HOURS = ['9:00','9:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00'];
const SERVICES = ['Haircut','Beard trim','Haircut + Beard','Hot towel shave','Kids cut','Line up / Shape up'];
const BARBERS = ['Jorge','Miguel','Dre'];
const LOW_STOCK = 5;

// ---------- Storage ----------
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
};

// ---------- Seed data ----------
function todayISO(offsetDays = 0) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function seedClients() {
  return [
    { id: uid(), name: 'Marcus Johnson', phone: '(201) 555-0147', style: 'Low fade + beard', last: 'Oct 10', visits: 14 },
    { id: uid(), name: 'Anthony Reyes', phone: '(201) 555-0192', style: 'Burst fade', last: 'Oct 11', visits: 22 },
    { id: uid(), name: 'David Kim', phone: '(201) 555-0133', style: 'Crew cut', last: 'Oct 8', visits: 9 },
    { id: uid(), name: 'Chris Alvarez', phone: '(973) 555-0171', style: 'Skin fade', last: 'Oct 12', visits: 31 },
    { id: uid(), name: 'Jayden Brooks', phone: '(201) 555-0165', style: 'Waves + line up', last: 'Oct 9', visits: 6 },
    { id: uid(), name: 'Sam Ortiz', phone: '(973) 555-0184', style: 'Buzz cut', last: 'Oct 7', visits: 4 },
  ];
}
function seedBookings() {
  const d = todayISO();
  return [
    { id: uid(), name: 'Tyrone Mills', service: 'Haircut + Beard', barber: 'Jorge', date: d, time: '10:00' },
    { id: uid(), name: 'Luis Gomez', service: 'Skin fade', barber: 'Jorge', date: d, time: '12:30' },
    { id: uid(), name: 'Marcus Johnson', service: 'Beard trim', barber: 'Miguel', date: d, time: '14:00' },
    { id: uid(), name: 'Rashad Cole', service: 'Hot towel shave', barber: 'Dre', date: d, time: '16:30' },
  ];
}
function seedTodos() {
  return [
    { id: uid(), text: 'Restock towels and cape liners', done: false },
    { id: uid(), text: 'Sanitize clippers after last cut', done: false },
    { id: uid(), text: 'Order #2 guard replacements', done: true },
    { id: uid(), text: 'Call Anthony about next week', done: false },
  ];
}
function seedSupplies() {
  return [
    { id: uid(), name: 'Clipper guards (#0–#8)', category: 'Tools', stock: 12 },
    { id: uid(), name: 'Shaving cream', category: 'Consumables', stock: 6 },
    { id: uid(), name: 'Cape liners', category: 'Consumables', stock: 4 },
    { id: uid(), name: 'Towels', category: 'Linens', stock: 25 },
    { id: uid(), name: 'Disinfectant spray', category: 'Cleaning', stock: 3 },
    { id: uid(), name: 'Styling gel', category: 'Product', stock: 9 },
    { id: uid(), name: 'Straight razors', category: 'Tools', stock: 2 },
  ];
}
function uid() { return Math.random().toString(36).slice(2, 10); }

// ---------- State ----------
let clients = store.get('bb_clients', seedClients());
let bookings = store.get('bb_bookings', seedBookings());
let todos = store.get('bb_todos', seedTodos());
let supplies = store.get('bb_supplies', seedSupplies());

function persist() {
  store.set('bb_clients', clients);
  store.set('bb_bookings', bookings);
  store.set('bb_todos', todos);
  store.set('bb_supplies', supplies);
}

// ---------- Helpers ----------
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2,'0')} ${ampm}`;
};
const fmtDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// ---------- Navigation ----------
const SECTION_TITLES = {
  today: ['Today', "Your day at a glance"],
  schedule: ['Schedule', 'Full week of appointments'],
  clients: ['Clients', 'Your client list'],
  bookings: ['Bookings', 'Book and manage appointments'],
  todo: ['To-Do', 'Shop tasks and chores'],
  supplies: ['Supplies', 'Track inventory'],
};

$$('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.nav-item').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    $$('.section').forEach((s) => s.classList.remove('is-active'));
    const sec = btn.dataset.section;
    document.getElementById('section-' + sec).classList.add('is-active');
    const [title, sub] = SECTION_TITLES[sec];
    $('#page-title').textContent = title;
    $('#page-sub').textContent = sub;
  });
});

// ---------- Today timeline ----------
function renderToday() {
  const d = todayISO();
  const todays = bookings.filter((b) => b.date === d);
  const el = $('#today-timeline');
  el.innerHTML = '';
  HOURS.forEach((t) => {
    const b = todays.find((x) => x.time === t);
    const div = document.createElement('div');
    div.className = 'time-slot' + (b ? ' is-booked' : '');
    div.innerHTML = b
      ? `<span class="slot-time">${fmtTime(t)}</span>
         <div class="slot-body">
           <span class="slot-client">${esc(b.name)}</span>
           <span class="slot-service">${esc(b.service)}</span>
         </div>
         <span class="slot-barber">${esc(b.barber)}</span>`
      : `<span class="slot-time">${fmtTime(t)}</span>
         <div class="slot-body"><span class="slot-empty">Open — tap to book</span></div>`;
    if (!b) {
      div.addEventListener('click', () => {
        goTo('bookings');
        $('#book-name').focus();
        $('#book-date').value = d;
        $('#book-time').value = t;
      });
    }
    el.appendChild(div);
  });
  $('#stat-appointments').textContent = todays.length;
}

// ---------- Week grid ----------
function renderWeek() {
  const el = $('#week-grid');
  el.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const iso = todayISO(i);
    const entries = bookings.filter((b) => b.date === iso).sort((a, b) => a.time.localeCompare(b.time));
    const col = document.createElement('div');
    col.className = 'day-col' + (i === 0 ? ' is-today' : '');
    const dayName = new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = new Date(iso + 'T00:00:00').getDate();
    col.innerHTML = `<div class="day-name">${dayName}</div><div class="day-date">${dayNum}</div>`;
    if (entries.length === 0) {
      col.innerHTML += `<div class="day-empty">No bookings</div>`;
    } else {
      entries.forEach((e) => {
        col.innerHTML += `<div class="day-entry"><b>${fmtTime(e.time)} · ${esc(e.name)}</b>${esc(e.service)}</div>`;
      });
    }
    el.appendChild(col);
  }
}

// ---------- Clients ----------
function renderClients() {
  const el = $('#clients-body');
  el.innerHTML = '';
  clients.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><b>${esc(c.name)}</b></td><td>${esc(c.phone || '—')}</td><td>${esc(c.style || '—')}</td><td>${esc(c.last || '—')}</td><td>${c.visits}</td>`;
    el.appendChild(tr);
  });
  $('#stat-clients').textContent = clients.length;
}

// ---------- Bookings ----------
function renderBookings() {
  const el = $('#booking-list');
  const upcoming = bookings
    .filter((b) => b.date >= todayISO())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  el.innerHTML = '';
  if (upcoming.length === 0) {
    el.innerHTML = '<div class="day-empty">No upcoming bookings.</div>';
    return;
  }
  upcoming.forEach((b) => {
    const row = document.createElement('div');
    row.className = 'booking-row';
    row.innerHTML = `<span class="booking-date">${fmtDate(b.date)} · ${fmtTime(b.time)}</span>
      <div class="booking-meta"><b>${esc(b.name)}</b><span>${esc(b.service)} · ${esc(b.barber)}</span></div>
      <button class="btn btn-ghost btn-xs" data-del="${b.id}">Cancel</button>`;
    el.appendChild(row);
  });
  $$('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      bookings = bookings.filter((x) => x.id !== btn.dataset.del);
      persist(); renderBookings(); renderToday(); renderWeek();
    });
  });
}

$('#book-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const b = {
    id: uid(),
    name: $('#book-name').value.trim(),
    service: $('#book-service').value,
    barber: $('#book-barber').value,
    date: $('#book-date').value,
    time: $('#book-time').value,
  };
  if (!b.name || !b.date || !b.time) return;
  bookings.push(b);
  persist();
  renderBookings(); renderToday(); renderWeek();
  $('#book-form').reset();
});

// ---------- To-do ----------
function renderTodos() {
  const el = $('#todo-list');
  el.innerHTML = '';
  todos.forEach((t) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (t.done ? ' done' : '');
    li.innerHTML = `<button class="todo-check" data-toggle="${t.id}"></button>
      <span class="todo-text">${esc(t.text)}</span>
      <button class="todo-del" data-del="${t.id}">✕</button>`;
    el.appendChild(li);
  });
  $$('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = todos.find((x) => x.id === btn.dataset.toggle);
      if (t) { t.done = !t.done; persist(); renderTodos(); renderStats(); }
    });
  });
  $$('.todo-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      todos = todos.filter((x) => x.id !== btn.dataset.del);
      persist(); renderTodos(); renderStats();
    });
  });
}

$('#todo-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = $('#todo-input').value.trim();
  if (!v) return;
  todos.unshift({ id: uid(), text: v, done: false });
  persist(); renderTodos(); renderStats();
  $('#todo-input').value = '';
});

// ---------- Supplies ----------
function renderSupplies() {
  const el = $('#supplies-body');
  el.innerHTML = '';
  supplies.forEach((s) => {
    const status = s.stock <= 0 ? ['Out of stock', 'badge-out'] : s.stock <= LOW_STOCK ? ['Low', 'badge-low'] : ['In stock', 'badge-ok'];
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><b>${esc(s.name)}</b></td><td>${esc(s.category || '—')}</td><td>${s.stock}</td>
      <td><span class="badge ${status[1]}">${status[0]}</span></td>
      <td>
        <button class="btn btn-ghost btn-xs" data-inc="${s.id}">+</button>
        <button class="btn btn-ghost btn-xs" data-dec="${s.id}">−</button>
      </td>`;
    el.appendChild(tr);
  });
  $$('[data-inc]').forEach((b) => b.addEventListener('click', () => { const s = supplies.find((x) => x.id === b.dataset.inc); if (s) { s.stock++; persist(); renderSupplies(); renderStats(); } }));
  $$('[data-dec]').forEach((b) => b.addEventListener('click', () => { const s = supplies.find((x) => x.id === b.dataset.dec); if (s && s.stock > 0) { s.stock--; persist(); renderSupplies(); renderStats(); } }));
}

// ---------- Stats ----------
function renderStats() {
  const low = supplies.filter((s) => s.stock <= LOW_STOCK).length;
  const open = todos.filter((t) => !t.done).length;
  $('#stat-todos').textContent = open;
  $('#stat-supplies').textContent = low;
  $('#stat-clients').textContent = clients.length;
}

// ---------- Modals ----------
function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }
$$('[data-close-modal]').forEach((b) => b.addEventListener('click', () => b.closest('.modal-backdrop').hidden = true));
$$('.modal-backdrop').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) m.hidden = true; }));

$('#btn-add-client').addEventListener('click', () => openModal('modal-client'));
$('#client-form').addEventListener('submit', (e) => {
  e.preventDefault();
  clients.unshift({
    id: uid(),
    name: $('#client-name').value.trim(),
    phone: $('#client-phone').value.trim(),
    style: $('#client-style').value.trim(),
    last: '—', visits: 0,
  });
  persist(); renderClients(); renderStats();
  closeModal('modal-client'); e.target.reset();
});

$('#btn-add-supply').addEventListener('click', () => openModal('modal-supply'));
$('#supply-form').addEventListener('submit', (e) => {
  e.preventDefault();
  supplies.push({
    id: uid(),
    name: $('#supply-name').value.trim(),
    category: $('#supply-category').value.trim(),
    stock: parseInt($('#supply-stock').value, 10) || 0,
  });
  persist(); renderSupplies(); renderStats();
  closeModal('modal-supply'); e.target.reset();
});

// ---------- Utils ----------
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function goTo(sec) {
  const btn = document.querySelector(`.nav-item[data-section="${sec}"]`);
  if (btn) btn.click();
}

// ---------- Init ----------
$('#date-pill').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
renderToday();
renderWeek();
renderClients();
renderBookings();
renderTodos();
renderSupplies();
renderStats();
