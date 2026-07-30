const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  window.location.href = '../index.html';
}

const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');

if (!groupId) {
  window.location.href = 'dashboard.html';
}

let membersMap = {}; // userId -> name

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../index.html';
});

function nameFor(userId) {
  return membersMap[userId] || 'Unknown';
}

async function loadGroup() {
  try {
    const res = await fetch(`${API_BASE}/groups/${groupId}`, { headers: authHeaders() });
    if (res.status === 401) return forceLogout();
    if (!res.ok) throw new Error('not found');

    const group = await res.json();
    document.getElementById('groupName').textContent = group.name;

    membersMap = {};
    group.members.forEach(m => { membersMap[m._id] = m.name; });

    document.getElementById('membersList').innerHTML = group.members.map(m => `
      <div class="list-item"><span>${m.name}</span><small>${m.email}</small></div>
    `).join('');

    const paidBySelect = document.getElementById('paidBy');
    paidBySelect.innerHTML = group.members.map(m =>
      `<option value="${m._id}">${m.name}</option>`
    ).join('');

    renderCustomSplitInputs(group.members);
  } catch (err) {
    document.getElementById('membersList').innerHTML = '<p class="empty-state">Could not load group.</p>';
  }
}

function renderCustomSplitInputs(members) {
  const list = document.getElementById('customSplitsList');
  list.innerHTML = members.map(m => `
    <div class="split-row">
      <span>${m.name}</span>
      <input type="number" step="0.01" min="0" class="split-input" data-user="${m._id}" placeholder="0">
    </div>
  `).join('');
}

document.getElementById('splitType').addEventListener('change', (e) => {
  const wrapper = document.getElementById('customSplitsWrapper');
  wrapper.classList.toggle('hidden', e.target.value === 'equal');
});

function forceLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../index.html';
}

async function loadExpenses() {
  const listEl = document.getElementById('expensesList');
  try {
    const res = await fetch(`${API_BASE}/expenses/group/${groupId}`, { headers: authHeaders() });
    if (res.status === 401) return forceLogout();
    const expenses = await res.json();

    if (!expenses.length) {
      listEl.innerHTML = '<p class="empty-state">No expenses yet.</p>';
      return;
    }

    listEl.innerHTML = expenses.map(exp => `
      <div class="list-item">
        <div>
          <strong>${exp.description}</strong>
          <small>Paid by ${exp.paidBy && exp.paidBy.name ? exp.paidBy.name : 'Unknown'} · ${exp.splitType}</small>
        </div>
        <div>₹${exp.amount.toFixed(2)}</div>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = '<p class="empty-state">Could not load expenses.</p>';
  }
}

async function loadBalances() {
  const balancesEl = document.getElementById('balancesList');
  const txEl = document.getElementById('transactionsList');
  try {
    const res = await fetch(`${API_BASE}/expenses/group/${groupId}/balances`, { headers: authHeaders() });
    if (res.status === 401) return forceLogout();
    const data = await res.json();

    const entries = Object.entries(data.net || {});
    if (!entries.length) {
      balancesEl.innerHTML = '<p class="empty-state">No balances yet.</p>';
    } else {
      balancesEl.innerHTML = entries.map(([userId, amount]) => {
        const cls = amount > 0 ? 'balance-positive' : (amount < 0 ? 'balance-negative' : '');
        const label = amount > 0
          ? `is owed ₹${amount.toFixed(2)}`
          : (amount < 0 ? `owes ₹${Math.abs(amount).toFixed(2)}` : 'is settled up');
        return `<div class="list-item"><span>${nameFor(userId)}</span><span class="${cls}">${label}</span></div>`;
      }).join('');
    }

    if (!data.transactions || !data.transactions.length) {
      txEl.innerHTML = '<p class="empty-state">Everyone is settled up.</p>';
    } else {
      txEl.innerHTML = data.transactions.map(t => `
        <div class="transaction">${nameFor(t.from)} owes ${nameFor(t.to)} ₹${t.amount.toFixed(2)}</div>
      `).join('');
    }
  } catch (err) {
    balancesEl.innerHTML = '<p class="empty-state">Could not load balances.</p>';
  }
}

document.getElementById('addExpenseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('expenseMessage');
  msgEl.textContent = '';

  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const paidBy = document.getElementById('paidBy').value;
  const splitType = document.getElementById('splitType').value;

  let customSplits = [];
  if (splitType !== 'equal') {
    customSplits = Array.from(document.querySelectorAll('.split-input')).map(input => ({
      user: input.dataset.user,
      value: parseFloat(input.value) || 0
    }));
  }

  try {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ groupId, description, amount, paidBy, splitType, customSplits })
    });
    const data = await res.json();

    if (!res.ok) {
      msgEl.className = 'message error';
      msgEl.textContent = data.message || 'Could not add expense';
      return;
    }

    document.getElementById('addExpenseForm').reset();
    document.getElementById('customSplitsWrapper').classList.add('hidden');
    msgEl.className = 'message success';
    msgEl.textContent = 'Expense added!';

    loadExpenses();
    loadBalances();
  } catch (err) {
    msgEl.className = 'message error';
    msgEl.textContent = 'Could not reach server';
  }
});

loadGroup();
loadExpenses();
loadBalances();