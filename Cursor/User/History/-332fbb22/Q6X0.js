// API Configuration
const API_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));

// API Helper Functions
const api = {
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        return data;
    },

    // Inventory endpoints
    async searchInventory(query) {
        return await this.request(`/inventory/search?query=${encodeURIComponent(query)}`);
    },

    async getAllInventory() {
        return await this.request('/inventory');
    },

    async addItem(itemData) {
        return await this.request('/inventory', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    },

    async updateQuantity(itemName, quantityTaken) {
        return await this.request(`/inventory/${encodeURIComponent(itemName)}/quantity`, {
            method: 'PUT',
            body: JSON.stringify({ quantityTaken })
        });
    },

    async updateAvailableQuantity(itemName, quantity) {
        return await this.request(`/inventory/${encodeURIComponent(itemName)}/available`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    },

    async deleteItem(itemName) {
        return await this.request(`/inventory/${encodeURIComponent(itemName)}`, {
            method: 'DELETE'
        });
    },

    // Transaction endpoints
    async getTransactions(month, year) {
        return await this.request(`/transactions?month=${month}&year=${year}`);
    },

    async getTransactionSummary(month, year) {
        return await this.request(`/transactions/summary?month=${month}&year=${year}`);
    },

    async getTopItems(month, year) {
        return await this.request(`/transactions/top-items?month=${month}&year=${year}`);
    },

    async getUserActivity(month, year) {
        return await this.request(`/transactions/user-activity?month=${month}&year=${year}`);
    },

    async clearTransactions() {
        return await this.request('/transactions', {
            method: 'DELETE'
        });
    },

    // User management endpoints
    async addUser(userData) {
        return await this.request('/auth/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async changePassword(username, password) {
        return await this.request(`/auth/users/${encodeURIComponent(username)}/password`, {
            method: 'PUT',
            body: JSON.stringify({ password })
        });
    },

    async getUsers() {
        return await this.request('/auth/users');
    },

    async deleteUser(username) {
        return await this.request(`/auth/users/${encodeURIComponent(username)}`, {
            method: 'DELETE'
        });
    }
};

// your code goes here
// Inventory data
const inventory = {
  screwdriver: { make: "BrandA", model: "ModelX", specification: "Steel", rack: "A1", bin: "B3", available: 25, quantityTaken: 0, updated: new Date().toLocaleString(), updatedBy: "" },
  hammer: { make: "BrandB", model: "ModelY", specification: "Aluminum", rack: "A2", bin: "B1", available: 10, quantityTaken: 0, updated: new Date().toLocaleString(), updatedBy: "" },
  wrench: { make: "BrandC", model: "ModelZ", specification: "Iron", rack: "A3", bin: "B4", available: 15, quantityTaken: 0, updated: new Date().toLocaleString(), updatedBy: "" },
  pliers: { make: "BrandD", model: "ModelW", specification: "Plastic", rack: "A4", bin: "B2", available: 8, quantityTaken: 0, updated: new Date().toLocaleString(), updatedBy: "" }
};

let currentMenuIndex = -1;
let currentSuggestionIndex = -1;

// Voice Search Variables
let recognition = null;
let isListening = false;

// Initialize voice recognition
function initializeVoiceRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
      isListening = true;
      const voiceBtn = document.getElementById('voiceSearchBtn');
      const voiceIcon = document.getElementById('voiceIcon');
      const voiceText = document.getElementById('voiceText');
      const voiceStatus = document.getElementById('voiceStatus');
      
      voiceBtn.classList.add('voice-listening');
      voiceIcon.textContent = '🔴';
      voiceText.textContent = 'Listening...';
      voiceStatus.innerHTML = '<div class="voice-message listening">🎤 Listening... Speak now!</div>';
    };

    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      const voiceStatus = document.getElementById('voiceStatus');
      
      voiceStatus.innerHTML = `<div class="voice-message success">🎯 Heard: "${transcript}"</div>`;
      
      // Set the transcript to search input and trigger search
      document.getElementById('searchInput').value = transcript;
      
      // Auto-search after a short delay
      setTimeout(() => {
        searchItem();
      }, 1000);
    };

    recognition.onerror = function(event) {
      const voiceStatus = document.getElementById('voiceStatus');
      let errorMessage = '';
      
      switch(event.error) {
        case 'no-speech':
          errorMessage = '❌ No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = '❌ Microphone not available. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = '❌ Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = '❌ Network error. Please check your connection.';
          break;
        default:
          errorMessage = `❌ Voice recognition error: ${event.error}`;
      }
      
      voiceStatus.innerHTML = `<div class="voice-message error">${errorMessage}</div>`;
      resetVoiceButton();
    };

    recognition.onend = function() {
      resetVoiceButton();
    };
    
    return true;
  }
  return false;
}

function resetVoiceButton() {
  isListening = false;
  const voiceBtn = document.getElementById('voiceSearchBtn');
  const voiceIcon = document.getElementById('voiceIcon');
  const voiceText = document.getElementById('voiceText');
  
  voiceBtn.classList.remove('voice-listening');
  voiceIcon.textContent = '🎤';
  voiceText.textContent = 'Voice Search';
  
  // Clear status after 3 seconds
  setTimeout(() => {
    const voiceStatus = document.getElementById('voiceStatus');
    if (voiceStatus) {
      voiceStatus.innerHTML = '';
    }
  }, 3000);
}

// Voice Search Function
function startListening() {
  if (!recognition) {
    if (!initializeVoiceRecognition()) {
      document.getElementById('voiceStatus').innerHTML = 
        '<div class="voice-message error">❌ Voice search not supported in this browser. Please use Chrome, Edge, or Safari.</div>';
      return;
    }
  }

  if (isListening) {
    recognition.stop();
    return;
  }

  try {
    recognition.start();
  } catch (error) {
    document.getElementById('voiceStatus').innerHTML = 
      '<div class="voice-message error">❌ Could not start voice recognition. Please try again.</div>';
  }
}

// Keyboard shortcut for voice search
document.addEventListener('keydown', function(event) {
  // Alt + V for voice search
  if (event.altKey && event.key.toLowerCase() === 'v') {
    event.preventDefault();
    startListening();
  }
  
  // Escape to stop voice search
  if (event.key === 'Escape' && isListening) {
    event.preventDefault();
    if (recognition) {
      recognition.stop();
    }
  }
});

// Transaction History System
function initializeTransactionHistory() {
  if (!localStorage.getItem('inventoryTransactions')) {
    localStorage.setItem('inventoryTransactions', JSON.stringify([]));
  }
}

function addTransaction(type, itemName, quantity, user, details = {}) {
  const transactions = JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
  const transaction = {
    id: Date.now(),
    type: type, // 'take', 'add', 'new_item', 'delete_item'
    itemName: itemName,
    quantity: quantity,
    user: user,
    timestamp: new Date().toISOString(),
    details: details
  };
  transactions.push(transaction);
  localStorage.setItem('inventoryTransactions', JSON.stringify(transactions));
}

function getTransactions() {
  return JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
}

function clearTransactionHistory() {
  if (confirm('Are you sure you want to clear all transaction history? This action cannot be undone.')) {
    localStorage.setItem('inventoryTransactions', JSON.stringify([]));
    alert('✅ Transaction history cleared successfully!');
    generateHistoryReport(); // Refresh the report
  }
}

// User Management System
function initializeUserSystem() {
  // Check if users exist in localStorage, if not, create default users with pasu as admin
  let users = localStorage.getItem('inventoryUsers');
  if (!users) {
    const defaultUsers = [
      { username: "pasu", password: "123", role: "admin" }
    ];
    localStorage.setItem('inventoryUsers', JSON.stringify(defaultUsers));
  } else {
    // Check if migration is needed (remove hameeth and make pasu admin)
    const userList = JSON.parse(users);
    let needsUpdate = false;
    
    // Remove hameeth if exists
    const filteredUsers = userList.filter(u => u.username !== "hameeth");
    if (filteredUsers.length !== userList.length) {
      needsUpdate = true;
    }
    
    // Ensure pasu is admin
    const pasuUser = filteredUsers.find(u => u.username === "pasu");
    if (pasuUser && pasuUser.role !== "admin") {
      pasuUser.role = "admin";
      needsUpdate = true;
    } else if (!pasuUser) {
      filteredUsers.push({ username: "pasu", password: "123", role: "admin" });
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      localStorage.setItem('inventoryUsers', JSON.stringify(filteredUsers));
    }
  }
}

function getUsers() {
  const users = localStorage.getItem('inventoryUsers');
  return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
  localStorage.setItem('inventoryUsers', JSON.stringify(users));
}

function findUser(username, password) {
  const users = getUsers();
  return users.find(u => u.username === username && u.password === password);
}

function userExists(username) {
  const users = getUsers();
  return users.find(u => u.username === username);
}

// Login System
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const loginMessage = document.getElementById("loginMessage");

  try {
    await api.login(username, password);
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");
    updateUIForRole();
    document.getElementById("userInfo").textContent = `Logged in as: ${currentUser.username} (${currentUser.role})`;
  } catch (error) {
    loginMessage.textContent = "❌ Invalid username or password!";
    loginMessage.style.color = "red";
  }
}

function updateUIForRole() {
  const addBtn = document.getElementById('addBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const updateQuantityBtn = document.getElementById('updateQuantityBtn');
  const historyBtn = document.getElementById('historyBtn');
  const userManagementBtn = document.getElementById('userManagementBtn');

  // Show/hide buttons based on user role
  if (currentUser.role === "admin") {
    addBtn.style.display = "block";
    deleteBtn.style.display = "block";
    updateQuantityBtn.style.display = "block";
    historyBtn.style.display = "block";
    userManagementBtn.style.display = "block";
  } else {
    // Regular users cannot add/delete items or access admin features
    addBtn.style.display = "none";
    deleteBtn.style.display = "none";
    updateQuantityBtn.style.display = "none";
    historyBtn.style.display = "none";
    userManagementBtn.style.display = "none";
  }

  // Hide/show available quantity option in update section
  const availableQuantityOption = document.getElementById('availableQuantityOption');
  if (availableQuantityOption) {
    availableQuantityOption.style.display = currentUser.role === "admin" ? "block" : "none";
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  authToken = null;
  currentUser = null;
  document.getElementById("loginPage").classList.remove("hidden");
  document.getElementById("appPage").classList.add("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("loginMessage").textContent = "";
}

// History & Analytics Functions
function openHistory() {
  if (currentUser.role !== "admin") {
    alert("❌ Access denied! Only admins can view history and analytics.");
    return;
  }
  toggleMenu();
  goBack();
  document.getElementById("historySection").classList.remove("hidden");
  
  // Set current month and year as default
  const now = new Date();
  document.getElementById("historyMonth").value = now.getMonth();
  document.getElementById("historyYear").value = now.getFullYear();
}

async function generateHistoryReport() {
  const month = document.getElementById("historyMonth").value;
  const year = document.getElementById("historyYear").value;

  if (!month || !year) {
    alert("❌ Please select both month and year!");
    return;
  }

  try {
    const [summary, transactions, topItems, userActivity] = await Promise.all([
      api.getTransactionSummary(month, year),
      api.getTransactions(month, year),
      api.getTopItems(month, year),
      api.getUserActivity(month, year)
    ]);

    // Update monthly summary
    generateMonthlySummary(summary);

    // Update charts
    generateConsumptionChart(topItems);
    generateUserActivityChart(userActivity);

    // Update top items list
    generateTopItemsList(topItems);

    // Update transaction history
    generateTransactionHistory(transactions);
  } catch (error) {
    alert("Error generating report");
  }
}

function generateMonthlySummary(transactions) {
  const summary = {
    totalTransactions: transactions.length,
    totalItemsTaken: 0,
    totalItemsAdded: 0,
    uniqueItems: new Set(),
    activeUsers: new Set()
  };

  transactions.forEach(t => {
    if (t.type === 'take') {
      summary.totalItemsTaken += t.quantity;
    } else if (t.type === 'add') {
      summary.totalItemsAdded += t.quantity;
    }
    summary.uniqueItems.add(t.itemName);
    summary.activeUsers.add(t.user);
  });

  const summaryHtml = `
    <div class="summary-stats">
      <div class="stat-item">
        <span class="stat-value">${summary.totalTransactions}</span>
        <div class="stat-label">Total Transactions</div>
      </div>
      <div class="stat-item">
        <span class="stat-value">${summary.totalItemsTaken}</span>
        <div class="stat-label">Items Consumed</div>
      </div>
      <div class="stat-item">
        <span class="stat-value">${summary.totalItemsAdded}</span>
        <div class="stat-label">Items Added</div>
      </div>
      <div class="stat-item">
        <span class="stat-value">${summary.uniqueItems.size}</span>
        <div class="stat-label">Unique Items</div>
      </div>
      <div class="stat-item">
        <span class="stat-value">${summary.activeUsers.size}</span>
        <div class="stat-label">Active Users</div>
      </div>
    </div>
  `;

  document.getElementById("monthlySummary").innerHTML = summaryHtml;
}

function generateConsumptionChart(transactions) {
  const itemConsumption = {};
  
  transactions.forEach(t => {
    if (t.type === 'take') {
      itemConsumption[t.itemName] = (itemConsumption[t.itemName] || 0) + t.quantity;
    }
  });

  const ctx = document.getElementById('consumptionChart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.consumptionChartInstance) {
    window.consumptionChartInstance.destroy();
  }

  const labels = Object.keys(itemConsumption);
  const data = Object.values(itemConsumption);
  const colors = generateColors(labels.length);

  window.consumptionChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function generateUserActivityChart(transactions) {
  const userActivity = {};
  
  transactions.forEach(t => {
    if (t.type === 'take') {
      userActivity[t.user] = (userActivity[t.user] || 0) + t.quantity;
    }
  });

  const ctx = document.getElementById('userActivityChart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.userActivityChartInstance) {
    window.userActivityChartInstance.destroy();
  }

  const labels = Object.keys(userActivity);
  const data = Object.values(userActivity);
  const colors = generateColors(labels.length);

  window.userActivityChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} items (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function generateTopItemsList(transactions) {
  const itemCounts = {};
  
  transactions.forEach(t => {
    if (t.type === 'take') {
      itemCounts[t.itemName] = (itemCounts[t.itemName] || 0) + t.quantity;
    }
  });

  const sortedItems = Object.entries(itemCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const listHtml = sortedItems.map(([item, count], index) => `
    <div class="top-item">
      <span class="rank">#${index + 1}</span>
      <span class="item-name">${item}</span>
      <span class="item-count">${count}</span>
    </div>
  `).join('');

  document.getElementById("topItemsList").innerHTML = listHtml || '<p>No consumption data available.</p>';
}

function generateTransactionHistory(transactions) {
  if (transactions.length === 0) {
    document.getElementById("transactionHistory").innerHTML = '<p>No transactions found for the selected period.</p>';
    return;
  }

  const tableHtml = `
    <table class="transaction-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Item</th>
          <th>Quantity</th>
          <th>User</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map(t => `
          <tr>
            <td>${new Date(t.timestamp).toLocaleString()}</td>
            <td class="transaction-type ${t.type}">${formatTransactionType(t.type)}</td>
            <td>${t.itemName}</td>
            <td>${t.quantity}</td>
            <td>${t.user}</td>
            <td>${formatTransactionDetails(t.details)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.getElementById("transactionHistory").innerHTML = tableHtml;
}

function formatTransactionType(type) {
  const types = {
    'take': 'TAKE',
    'add': 'ADD',
    'new_item': 'NEW ITEM',
    'delete_item': 'DELETE'
  };
  return types[type] || type.toUpperCase();
}

function formatTransactionDetails(details) {
  if (!details || details === '{}') return '-';
  try {
    const parsed = JSON.parse(details);
    return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
  } catch {
    return details;
  }
}

function generateColors(count) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];
  return Array.from({length: count}, (_, i) => colors[i % colors.length]);
}

function clearHistoryData() {
  clearTransactionHistory();
}

// User Management Functions
function openUserManagement() {
  if (currentUser.role !== "admin") {
    alert("❌ Access denied! Only admins can manage users.");
    return;
  }
  toggleMenu();
  goBack();
  document.getElementById("userManagementSection").classList.remove("hidden");
  populateUserSelect();
  refreshUserList();
}

function showAddUserForm() {
  document.querySelectorAll('.user-form').forEach(form => form.classList.add('hidden'));
  document.getElementById('addUserForm').classList.remove('hidden');
  
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.getElementById('addUserTab').classList.add('active');
}

function showChangePasswordForm() {
  document.querySelectorAll('.user-form').forEach(form => form.classList.add('hidden'));
  document.getElementById('changePasswordForm').classList.remove('hidden');
  
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.getElementById('changePasswordTab').classList.add('active');
  
  populateUserSelect();
}

function showUserList() {
  document.querySelectorAll('.user-form').forEach(form => form.classList.add('hidden'));
  document.getElementById('userListForm').classList.remove('hidden');
  
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.getElementById('userListTab').classList.add('active');
  
  refreshUserList();
}

async function addNewUser() {
  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const role = document.getElementById("newUserRole").value;
  const message = document.getElementById("addUserMessage");

  if (!username || !password || !confirmPassword) {
    message.textContent = "❌ Please fill in all fields";
    message.style.color = "red";
    return;
  }

  if (password !== confirmPassword) {
    message.textContent = "❌ Passwords do not match";
    message.style.color = "red";
    return;
  }

  try {
    await api.addUser({ username, password, role });
    message.textContent = "✅ User added successfully";
    message.style.color = "green";
    document.getElementById("newUsername").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
  } catch (error) {
    message.textContent = error.message || "Error adding user";
    message.style.color = "red";
  }
}

function populateUserSelect() {
  const users = getUsers();
  const select = document.getElementById('selectUser');
  select.innerHTML = '<option value="">Select User</option>';
  
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user.username;
    option.textContent = `${user.username} (${user.role})`;
    select.appendChild(option);
  });
}

async function changePassword() {
  const username = document.getElementById("selectUser").value;
  const newPassword = document.getElementById("newPasswordChange").value;
  const confirmPassword = document.getElementById("confirmPasswordChange").value;
  const message = document.getElementById("changePasswordMessage");

  if (!username || !newPassword || !confirmPassword) {
    message.textContent = "❌ Please fill in all fields";
    message.style.color = "red";
    return;
  }

  if (newPassword !== confirmPassword) {
    message.textContent = "❌ Passwords do not match";
    message.style.color = "red";
    return;
  }

  try {
    await api.changePassword(username, newPassword);
    message.textContent = "✅ Password changed successfully";
    message.style.color = "green";
    document.getElementById("newPasswordChange").value = "";
    document.getElementById("confirmPasswordChange").value = "";
  } catch (error) {
    message.textContent = error.message || "Error changing password";
    message.style.color = "red";
  }
}

async function refreshUserList() {
  try {
    const users = await api.getUsers();
    const usersList = document.getElementById("usersList");
    
    let html = '<div class="users-table">';
    html += `
      <div class="users-header">
        <div>Username</div>
        <div>Role</div>
        <div>Created</div>
        <div>Actions</div>
      </div>
    `;

    users.forEach(user => {
      html += `
        <div class="users-row">
          <div>${user.username}</div>
          <div>${user.role}</div>
          <div>${new Date(user.createdAt).toLocaleString()}</div>
          <div>
            ${user.role !== 'admin' ? 
              `<button onclick="deleteUser('${user.username}')">Delete</button>` : 
              ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    usersList.innerHTML = html;

    // Update user select for password change
    const selectUser = document.getElementById("selectUser");
    selectUser.innerHTML = '<option value="">Select User</option>';
    users.forEach(user => {
      selectUser.innerHTML += `<option value="${user.username}">${user.username}</option>`;
    });
  } catch (error) {
    alert("Error loading users");
  }
}

async function deleteUser(username) {
  if (!confirm(`Are you sure you want to delete user ${username}?`)) {
    return;
  }

  try {
    await api.deleteUser(username);
    alert("✅ User deleted successfully");
    refreshUserList();
  } catch (error) {
    alert(error.message || "Error deleting user");
  }
}

// Menu and Navigation Functions
function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("overlay");

  if (menu.classList.contains("active")) {
    menu.classList.remove("active");
    overlay.style.display = "none";
  } else {
    menu.classList.add("active");
    overlay.style.display = "block";
  }
}

function clearInputs() {
  document.querySelectorAll("input").forEach(input => {
    if (input.type !== "button" && input.type !== "submit") {
      input.value = "";
    }
  });
  
  document.querySelectorAll("select").forEach(select => {
    select.selectedIndex = 0;
  });
}

function goBack() {
  document.querySelectorAll("#appPage .section").forEach(s => s.classList.add("hidden"));
  document.getElementById("main").classList.remove("hidden");
}

// Search Functions
async function searchItem() {
  const searchInput = document.getElementById("searchInput").value.trim().toLowerCase();
  const searchResult = document.getElementById("searchResult");
  
  if (!searchInput) {
    searchResult.innerHTML = "Please enter an item name";
    return;
  }

  try {
    const items = await api.searchInventory(searchInput);
    
    if (items.length === 0) {
      searchResult.innerHTML = "No items found";
      return;
    }

    const item = items[0]; // Get the first matching item
    const stockStatus = getStockStatus(item.available);
    
    searchResult.innerHTML = `
      <div class="result-item">
        <h4>${item.name}</h4>
        <p><strong>Make:</strong> ${item.make}</p>
        <p><strong>Model:</strong> ${item.model}</p>
        <p><strong>Specification:</strong> ${item.specification}</p>
        <p><strong>Location:</strong> Rack ${item.rack}, Bin ${item.bin}</p>
        <p><strong>Available Quantity:</strong> <span class="${stockStatus.class}">${item.available} ${stockStatus.icon}</span></p>
        <p><strong>Last Updated:</strong> ${new Date(item.updated).toLocaleString()}</p>
        <p><strong>Updated By:</strong> ${item.updatedBy}</p>
      </div>
    `;
  } catch (error) {
    searchResult.innerHTML = "Error searching for item";
  }
}

function getStockStatus(stock) {
  if (stock <= 0) return { class: 'out-of-stock', status: 'Out of Stock' };
  if (stock <= 5) return { class: 'low-stock', status: 'Low Stock' };
  return { class: 'in-stock', status: 'In Stock' };
}

function showSuggestions() {
  const input = document.getElementById("searchInput");
  const suggestBox = document.getElementById("suggestBox");
  const query = input.value.toLowerCase();

  if (query.length === 0) {
    suggestBox.innerHTML = "";
    return;
  }

  const suggestions = Object.keys(inventory).filter(item => 
    item.includes(query)
  );

  if (suggestions.length > 0) {
    suggestBox.innerHTML = suggestions.map(item => 
      `<div onclick="selectSuggestion('${item}')">${item}</div>`
    ).join('');
  } else {
    suggestBox.innerHTML = "";
  }
}

function selectSuggestion(item) {
  document.getElementById("searchInput").value = item;
  document.getElementById("suggestBox").innerHTML = "";
  searchItem();
}

// Add Item Functions
function openAdd() {
  if (currentUser.role !== "admin") {
    alert("❌ Access denied! Only admins can add items.");
    return;
  }
  toggleMenu();
  goBack();
  document.getElementById("addSection").classList.remove("hidden");
}

function showAddSuggestions() {
  // Add suggestions logic if needed
}

function selectAddSuggestion(item) {
  document.getElementById("newItem").value = item;
  document.getElementById("suggestAdd").innerHTML = "";
}

async function addItem() {
  const newItem = document.getElementById("newItem").value.trim();
  const newMake = document.getElementById("newMake").value.trim();
  const newModel = document.getElementById("newModel").value.trim();
  const newSpecification = document.getElementById("newSpecification").value.trim();
  const newRack = document.getElementById("newRack").value.trim();
  const newBin = document.getElementById("newBin").value.trim();
  const newQty = parseInt(document.getElementById("newQty").value);

  if (!newItem || !newMake || !newModel || !newSpecification || !newRack || !newBin || isNaN(newQty)) {
    alert("Please fill in all fields");
    return;
  }

  try {
    await api.addItem({
      name: newItem,
      make: newMake,
      model: newModel,
      specification: newSpecification,
      rack: newRack,
      bin: newBin,
      available: newQty
    });

    alert("✅ Item added successfully!");
    clearInputs();
    goBack();
  } catch (error) {
    alert(error.message || "Error adding item");
  }
}

// Update Item Functions
function openUpdate() {
  toggleMenu();
  goBack();
  document.getElementById("updateSection").classList.remove("hidden");
}

function showUpdateSuggestions() {
  const input = document.getElementById("updateItem");
  const suggestBox = document.getElementById("suggestUpdate");
  const query = input.value.toLowerCase();

  if (query.length === 0) {
    suggestBox.innerHTML = "";
    return;
  }

  const suggestions = Object.keys(inventory).filter(item => 
    item.includes(query)
  );

  if (suggestions.length > 0) {
    suggestBox.innerHTML = suggestions.map(item => 
      `<div onclick="selectUpdateSuggestion('${item}')">${item}</div>`
    ).join('');
  } else {
    suggestBox.innerHTML = "";
  }
}

function selectUpdateSuggestion(item) {
  document.getElementById("updateItem").value = item;
  document.getElementById("suggestUpdate").innerHTML = "";
}

function updateItem() {
  const itemName = document.getElementById("updateItem").value.trim().toLowerCase();
  const quantityTaken = parseInt(document.getElementById("quantityTaken").value) || 0;
  const availableQuantity = parseInt(document.getElementById("availableQuantity").value) || 0;

  if (!itemName) {
    alert("❌ Please enter an item name!");
    return;
  }

  if (!inventory[itemName]) {
    alert("❌ Item not found in inventory!");
    return;
  }

  if (quantityTaken <= 0 && (currentUser.role !== "admin" || availableQuantity <= 0)) {
    alert("❌ Please enter a valid quantity!");
    return;
  }

  const item = inventory[itemName];

  if (quantityTaken > 0) {
    const currentAvailable = item.available - item.quantityTaken;
    if (quantityTaken > currentAvailable) {
      alert(`❌ Not enough stock! Available: ${currentAvailable}`);
      return;
    }

    item.quantityTaken += quantityTaken;
    addTransaction('take', itemName, quantityTaken, currentUser.username);
  }

  if (currentUser.role === "admin" && availableQuantity > 0) {
    item.available = availableQuantity;
    addTransaction('add', itemName, availableQuantity, currentUser.username, {
      type: 'available_quantity_update'
    });
  }

  item.updated = new Date().toLocaleString();
  item.updatedBy = currentUser.username;

  const remaining = item.available - item.quantityTaken;
  let message = "✅ Item updated successfully!";
  
  if (remaining <= 0) {
    message += " ⚠️ Item is now out of stock!";
  } else if (remaining <= 5) {
    message += ` ⚠️ Low stock warning: ${remaining} remaining!`;
  }

  alert(message);
  clearInputs();
  goBack();
}

// Update Quantity Functions (Admin Only)
function openUpdateQuantity() {
  if (currentUser.role !== "admin") {
    alert("❌ Access denied! Only admins can update available quantities.");
    return;
  }
  toggleMenu();
  goBack();
  document.getElementById("updateQuantitySection").classList.remove("hidden");
}

function showAvailableQuantitySuggestions() {
  const input = document.getElementById("updateQuantityItem");
  const suggestBox = document.getElementById("suggestAvailableQuantity");
  const query = input.value.toLowerCase();

  if (query.length === 0) {
    suggestBox.innerHTML = "";
    document.getElementById("currentQuantityDisplay").textContent = "-";
    return;
  }

  const suggestions = Object.keys(inventory).filter(item => 
    item.includes(query)
  );

  if (suggestions.length > 0) {
    suggestBox.innerHTML = suggestions.map(item => 
      `<div onclick="selectAvailableQuantitySuggestion('${item}')">${item}</div>`
    ).join('');
  } else {
    suggestBox.innerHTML = "";
  }
}

function selectAvailableQuantitySuggestion(item) {
  document.getElementById("updateQuantityItem").value = item;
  document.getElementById("suggestAvailableQuantity").innerHTML = "";
  updateCurrentQuantityDisplay();
}

function updateCurrentQuantityDisplay() {
  const itemName = document.getElementById("updateQuantityItem").value.trim().toLowerCase();
  const currentQuantityDisplay = document.getElementById("currentQuantityDisplay");
  
  if (inventory[itemName]) {
    currentQuantityDisplay.textContent = inventory[itemName].available;
  } else {
    currentQuantityDisplay.textContent = "-";
  }
  updateQuantityPreview();
}

function updateQuantityPreview() {
  const itemName = document.getElementById("updateQuantityItem").value.trim().toLowerCase();
  const newQuantity = parseInt(document.getElementById("newAvailableQuantity").value) || 0;
  const newQuantityPreview = document.getElementById("newQuantityPreview");
  
  if (inventory[itemName] && newQuantity > 0) {
    const newTotal = inventory[itemName].available + newQuantity;
    newQuantityPreview.textContent = newTotal;
  } else {
    newQuantityPreview.textContent = "-";
  }
}

function updateAvailableQuantity() {
  const itemName = document.getElementById("updateQuantityItem").value.trim().toLowerCase();
  const additionalQuantity = parseInt(document.getElementById("newAvailableQuantity").value) || 0;

  if (!itemName) {
    alert("❌ Please enter an item name!");
    return;
  }

  if (!inventory[itemName]) {
    alert("❌ Item not found in inventory!");
    return;
  }

  if (additionalQuantity <= 0) {
    alert("❌ Please enter a valid quantity to add!");
    return;
  }

  const item = inventory[itemName];
  const oldAvailable = item.available;
  item.available += additionalQuantity;
  item.updated = new Date().toLocaleString();
  item.updatedBy = currentUser.username;

  addTransaction('add', itemName, additionalQuantity, currentUser.username, {
    type: 'quantity_addition',
    previousAvailable: oldAvailable,
    newAvailable: item.available
  });

  alert(`✅ Added ${additionalQuantity} to ${itemName}. New total: ${item.available}`);
  clearInputs();
  goBack();
}

// Delete Item Functions
function openDelete() {
  if (currentUser.role !== "admin") {
    alert("❌ Access denied! Only admins can delete items.");
    return;
  }
  toggleMenu();
  goBack();
  document.getElementById("deleteSection").classList.remove("hidden");
}

function showDeleteSuggestions() {
  const input = document.getElementById("deleteItem");
  const suggestBox = document.getElementById("suggestDelete");
  const query = input.value.toLowerCase();

  if (query.length === 0) {
    suggestBox.innerHTML = "";
    return;
  }

  const suggestions = Object.keys(inventory).filter(item => 
    item.includes(query)
  );

  if (suggestions.length > 0) {
    suggestBox.innerHTML = suggestions.map(item => 
      `<div onclick="selectDeleteSuggestion('${item}')">${item}</div>`
    ).join('');
  } else {
    suggestBox.innerHTML = "";
  }
}

function selectDeleteSuggestion(item) {
  document.getElementById("deleteItem").value = item;
  document.getElementById("suggestDelete").innerHTML = "";
}

function deleteItem() {
  const itemName = document.getElementById("deleteItem").value.trim().toLowerCase();

  if (!itemName) {
    alert("❌ Please enter an item name!");
    return;
  }

  if (!inventory[itemName]) {
    alert("❌ Item not found in inventory!");
    return;
  }

  if (!confirm(`Are you sure you want to delete '${itemName}'? This action cannot be undone.`)) {
    return;
  }

  const item = inventory[itemName];
  addTransaction('delete_item', itemName, item.available, currentUser.username, item);
  delete inventory[itemName];

  alert(`✅ Item '${itemName}' deleted successfully!`);
  clearInputs();
  goBack();
}

// Spares List Functions
function showSpares() {
  toggleMenu();
  goBack();
  document.getElementById("sparesSection").classList.remove("hidden");
  refreshSparesList();
}

function refreshSparesList() {
  const sparesList = document.getElementById("sparesList");
  const items = Object.entries(inventory);

  if (items.length === 0) {
    sparesList.innerHTML = '<p>No items in inventory.</p>';
    return;
  }

  const tableHtml = `
    <table class="spares-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Make</th>
          <th>Model</th>
          <th>Specification</th>
          <th>Location</th>
          <th>Available</th>
          <th>Taken</th>
          <th>Current Stock</th>
          <th>Status</th>
          <th>Last Updated</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(([name, item]) => {
          const currentStock = item.available - item.quantityTaken;
          const status = getStockStatus(currentStock);
          return `
            <tr>
              <td class="item-name">${name}</td>
              <td>${item.make}</td>
              <td>${item.model}</td>
              <td>${item.specification}</td>
              <td>R${item.rack}, B${item.bin}</td>
              <td>${item.available}</td>
              <td>${item.quantityTaken}</td>
              <td class="${status.class}">${currentStock}</td>
              <td><span class="status-badge ${status.class}">${status.status}</span></td>
              <td>${item.updated}<br>${item.updatedBy ? `<small>by ${item.updatedBy}</small>` : ''}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  sparesList.innerHTML = tableHtml;
}

function downloadCSV() {
  const items = Object.entries(inventory);
  
  if (items.length === 0) {
    alert("❌ No data to download!");
    return;
  }

  let csvContent = "Item Name,Make,Model,Specification,Rack,Bin,Available,Quantity Taken,Current Stock,Last Updated,Updated By\n";
  
  items.forEach(([name, item]) => {
    const currentStock = item.available - item.quantityTaken;
    csvContent += `"${name}","${item.make}","${item.model}","${item.specification}","${item.rack}","${item.bin}",${item.available},${item.quantityTaken},${currentStock},"${item.updated}","${item.updatedBy || ''}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  alert("✅ CSV file downloaded successfully!");
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  initializeUserSystem();
  initializeTransactionHistory();
  initializeVoiceRecognition();
});

// Allow Enter key to trigger login
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    const loginPage = document.getElementById('loginPage');
    if (!loginPage.classList.contains('hidden')) {
      login();
    }
  }
});