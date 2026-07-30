const API_BASE = '/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  window.location.href = '../index.html';
}

document.getElementById('welcomeMsg').textContent = `Hi, ${user.name}`;

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../index.html';
});

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function loadGroups() {
  const listEl = document.getElementById('groupsList');
  try {
    const res = await fetch(`${API_BASE}/groups`, { headers: authHeaders() });
    if (res.status === 401) return forceLogout();

    const groups = await res.json();

    if (!groups.length) {
      listEl.innerHTML = '<p class="empty-state">No groups yet. Create one above!</p>';
      return;
    }

    listEl.innerHTML = groups.map(g => `
      <div class="list-item">
        <div>
          <strong>${g.name}</strong>
          <small>${g.members.length} member${g.members.length === 1 ? '' : 's'}</small>
        </div>
        <a class="btn" href="group.html?id=${g._id}">Open</a>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = '<p class="empty-state">Could not load groups.</p>';
  }
}

function forceLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../index.html';
}

document.getElementById('createGroupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('groupMessage');
  msgEl.textContent = '';

  const name = document.getElementById('groupName').value.trim();
  const emailsRaw = document.getElementById('memberEmails').value.trim();
  const memberEmails = emailsRaw
    ? emailsRaw.split(',').map(e => e.trim()).filter(Boolean)
    : [];

  try {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, memberEmails })
    });
    const data = await res.json();

    if (!res.ok) {
      msgEl.className = 'message error';
      msgEl.textContent = data.message || 'Could not create group';
      return;
    }

    document.getElementById('createGroupForm').reset();
    msgEl.className = 'message success';
    msgEl.textContent = 'Group created!';
    loadGroups();
  } catch (err) {
    msgEl.className = 'message error';
    msgEl.textContent = 'Could not reach server';
  }
});

loadGroups();