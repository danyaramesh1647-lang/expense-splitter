const API_BASE = '/api';

// If already logged in AND currently on the login page, skip straight to dashboard
if (localStorage.getItem('token') && document.getElementById('loginForm')) {
  window.location.href = '/pages/dashboard.html';
}

const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authMessage = document.getElementById('authMessage');

if (loginTab) {
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    clearMessage();
  });
}

if (signupTab) {
  signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    clearMessage();
  });
}

function clearMessage() {
  if (!authMessage) return;
  authMessage.textContent = '';
  authMessage.className = 'message';
}

function showMessage(text, isError) {
  if (!authMessage) return;
  authMessage.textContent = text;
  authMessage.className = 'message ' + (isError ? 'error' : 'success');
}

function saveSessionAndRedirect(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  window.location.href = '/pages/dashboard.html';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || 'Login failed', true);
        return;
      }

      showMessage('Login successful!', false);
      saveSessionAndRedirect(data);
    } catch (err) {
      showMessage('Could not reach server', true);
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || 'Sign up failed', true);
        return;
      }

      showMessage('Account created!', false);
      saveSessionAndRedirect(data);
    } catch (err) {
      showMessage('Could not reach server', true);
    }
  });
}