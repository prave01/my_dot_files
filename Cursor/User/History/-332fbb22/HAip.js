// --- UI Elements ---
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const toast = document.getElementById('toast');

const loginSection = document.getElementById('loginSection');
const inventorySection = document.getElementById('inventorySection');
const addSpareSection = document.getElementById('addSpareSection');
const historySection = document.getElementById('historySection');
const usersSection = document.getElementById('usersSection');
const analyticsSection = document.getElementById('analyticsSection');

const navInventory = document.getElementById('navInventory');
const navAddSpare = document.getElementById('navAddSpare');
const navHistory = document.getElementById('navHistory');
const navUsers = document.getElementById('navUsers');
const navAnalytics = document.getElementById('navAnalytics');
const navLogout = document.getElementById('navLogout');

// --- Helper Functions ---
function showToast(msg, success = true) {
  toast.textContent = msg;
  toast.className = 'toast show' + (success ? '' : ' error');
  setTimeout(() => {
    toast.className = 'toast';
  }, 2500);
}

function showSection(section) {
  [loginSection, inventorySection, addSpareSection, historySection, usersSection, analyticsSection].forEach(sec => {
    sec.classList.add('hidden');
  });
  section.classList.remove('hidden');
}

function openMenu() {
  sideMenu.classList.add('open');
  overlay.classList.add('active');
}
function closeMenu() {
  sideMenu.classList.remove('open');
  overlay.classList.remove('active');
}

// --- Menu Event Listeners ---
hamburgerBtn.addEventListener('click', openMenu);
overlay.addEventListener('click', closeMenu);
closeMenuBtn.addEventListener('click', closeMenu);

navInventory.addEventListener('click', e => { e.preventDefault(); closeMenu(); showSection(inventorySection); loadInventory(); });
navAddSpare.addEventListener('click', e => { e.preventDefault(); closeMenu(); showSection(addSpareSection); });
navHistory.addEventListener('click', e => { e.preventDefault(); closeMenu(); showSection(historySection); loadHistory(); });
navUsers.addEventListener('click', e => { e.preventDefault(); closeMenu(); showSection(usersSection); loadUsers(); });
navAnalytics.addEventListener('click', e => { e.preventDefault(); closeMenu(); showSection(analyticsSection); });
navLogout.addEventListener('click', e => { e.preventDefault(); logout(); });

// --- Auth State ---
let authToken = '';
let currentUser = null;

function saveAuth(token, user) {
  authToken = token;
  currentUser = user;
  sessionStorage.setItem('authToken', token);
  sessionStorage.setItem('currentUser', JSON.stringify(user));
}
function loadAuth() {
  authToken = sessionStorage.getItem('authToken') || '';
  try {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  } catch { currentUser = null; }
}
function clearAuth() {
  authToken = '';
  currentUser = null;
  sessionStorage.clear();
}

// --- API Helpers ---
const API_BASE = '';
async function api(path, opts = {}) {
  opts.headers = opts.headers || {};
  if (authToken) opts.headers['Authorization'] = 'Bearer ' + authToken;
  if (!(opts.body instanceof FormData) && opts.body && typeof opts.body === 'object') {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) throw new Error((await res.json()).message || 'API error');
  return res.json();
}

// --- Login ---
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await api('/api/auth/login', { method: 'POST', body: { username, password } });
    saveAuth(data.token, data.user);
    showToast('Login successful!');
    showSection(inventorySection);
    loadInventory();
  } catch (err) {
    showToast('Login failed: ' + err.message, false);
  }
});

function logout() {
  clearAuth();
  showSection(loginSection);
}

// --- Inventory ---
const inventoryTable = document.getElementById('inventoryTable').querySelector('tbody');
async function loadInventory() {
  try {
    const items = await api('/api/inventory');
    inventoryTable.innerHTML = '';
    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.location}</td>
        <td>
          <button onclick="editSpare('${item._id}')">Edit</button>
          <button onclick="deleteSpare('${item._id}')">Delete</button>
        </td>
      `;
      inventoryTable.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load inventory: ' + err.message, false);
  }
}

// --- Add Spare ---
const addSpareForm = document.getElementById('addSpareForm');
addSpareForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('spareName').value;
  const quantity = +document.getElementById('spareQty').value;
  const location = document.getElementById('spareLocation').value;
  try {
    await api('/api/inventory', { method: 'POST', body: { name, quantity, location } });
    showToast('Spare added!');
    addSpareForm.reset();
    showSection(inventorySection);
    loadInventory();
  } catch (err) {
    showToast('Failed to add spare: ' + err.message, false);
  }
});

// --- Edit/Delete Spare ---
window.editSpare = async function(id) {
  const item = (await api('/api/inventory/' + id));
  document.getElementById('spareName').value = item.name;
  document.getElementById('spareQty').value = item.quantity;
  document.getElementById('spareLocation').value = item.location;
  showSection(addSpareSection);
  addSpareForm.onsubmit = async function(e) {
    e.preventDefault();
    try {
      await api('/api/inventory/' + id, {
        method: 'PUT',
        body: {
          name: document.getElementById('spareName').value,
          quantity: +document.getElementById('spareQty').value,
          location: document.getElementById('spareLocation').value
        }
      });
      showToast('Spare updated!');
      addSpareForm.reset();
      addSpareForm.onsubmit = defaultAddSpareSubmit;
      showSection(inventorySection);
      loadInventory();
    } catch (err) {
      showToast('Failed to update spare: ' + err.message, false);
    }
  };
};
window.deleteSpare = async function(id) {
  if (!confirm('Delete this spare?')) return;
  try {
    await api('/api/inventory/' + id, { method: 'DELETE' });
    showToast('Spare deleted!');
    loadInventory();
  } catch (err) {
    showToast('Failed to delete spare: ' + err.message, false);
  }
};
const defaultAddSpareSubmit = addSpareForm.onsubmit;

// --- Transaction History ---
const historyTable = document.getElementById('historyTable').querySelector('tbody');
async function loadHistory() {
  try {
    const txs = await api('/api/transactions');
    historyTable.innerHTML = '';
    txs.forEach(tx => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(tx.date).toLocaleString()}</td>
        <td>${tx.spareName}</td>
        <td>${tx.change > 0 ? '+' : ''}${tx.change}</td>
        <td>${tx.user}</td>
      `;
      historyTable.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load history: ' + err.message, false);
  }
}

// --- User Management ---
const usersTable = document.getElementById('usersTable').querySelector('tbody');
const addUserForm = document.getElementById('addUserForm');
async function loadUsers() {
  try {
    const users = await api('/api/users');
    usersTable.innerHTML = '';
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td><button onclick="deleteUser('${user._id}')">Delete</button></td>
      `;
      usersTable.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load users: ' + err.message, false);
  }
}
addUserForm.addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newUserRole').value;
  try {
    await api('/api/users', { method: 'POST', body: { username, password, role } });
    showToast('User added!');
    addUserForm.reset();
    loadUsers();
  } catch (err) {
    showToast('Failed to add user: ' + err.message, false);
  }
});
window.deleteUser = async function(id) {
  if (!confirm('Delete this user?')) return;
  try {
    await api('/api/users/' + id, { method: 'DELETE' });
    showToast('User deleted!');
    loadUsers();
  } catch (err) {
    showToast('Failed to delete user: ' + err.message, false);
  }
};

// --- Voice Search (Placeholder) ---
const voiceSearchBtn = document.getElementById('voiceSearchBtn');
voiceSearchBtn.addEventListener('click', () => {
  showToast('Voice search coming soon!', false);
});

// --- Analytics (Placeholder) ---
// Analytics section is static for now

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadAuth();
  if (authToken) {
    showSection(inventorySection);
    loadInventory();
  } else {
    showSection(loginSection);
  }
}); 