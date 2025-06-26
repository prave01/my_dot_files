// Import API functions
import { authAPI, inventoryAPI, usersAPI, transactionsAPI } from './js/api.js';

// Global variables
let currentUser = null;
let recognition = null;
let isListening = false;

// Initialize the application
async function initializeApp() {
  // Check for existing session
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);
      updateUIForRole();
      document.getElementById('loginPage').classList.add('hidden');
      document.getElementById('appPage').classList.remove('hidden');
      await refreshSparesList();
    } catch (error) {
      console.error('Error initializing app:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}

// Call initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  
  // Add event listeners for login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => login().catch(console.error));
  }
  
  // Make login function available globally
  window.login = login;
});

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
  const username = document.getElementById('loginUsername')?.value;
  const password = document.getElementById('loginPassword')?.value;
  const errorElement = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  
  try {
    // Validate inputs
    if (!username || !password) {
      if (errorElement) {
        errorElement.textContent = 'Please enter both username and password';
        errorElement.style.display = 'block';
      }
      return;
    }

    // Show loading state
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
    }
    
    // Clear any previous errors
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    
    // Call the login API
    const response = await authAPI.login(username, password);
    
    if (!response) {
      throw new Error('No response from server');
    }
    
    const { token, user, error } = response;
    
    if (error) {
      throw new Error(error.message || 'Login failed');
    }
    
    if (!token || !user) {
      throw new Error('Invalid server response');
    }
    
    // Store the token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Update UI
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('appPage').classList.remove('hidden');

    // Initialize the app with the logged-in user
    currentUser = user;
    updateUIForRole();
    await refreshSparesList();
    
  } catch (error) {
    console.error('Login error:', error);
    if (errorElement) {
      errorElement.textContent = error.message || 'An error occurred during login. Please try again.';
      errorElement.style.display = 'block';
    }
  } finally {
    // Reset button state
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
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
  currentUser = null;

  // Hide all app sections properly
  document.querySelectorAll("#appPage .section").forEach(s => s.classList.add("hidden"));
  document.getElementById("main").classList.remove("hidden");

  // Hide side menu if it's open
  const menu = document.getElementById("sideMenu");
  if (menu.classList.contains("active")) {
    menu.classList.remove("active");
    document.getElementById("overlay").style.display = "none";
  }

  // Clear all inputs and reset forms
  clearInputs();

  // Clear any search results or messages
  document.getElementById("searchResult").innerHTML = "";
  document.getElementById("loginMessage").textContent = "";

  // Switch back to login page
  document.getElementById("appPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
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

function generateHistoryReport() {
  const month = document.getElementById("historyMonth").value;
  const year = document.getElementById("historyYear").value;

  if (!month || !year) {
    alert("❌ Please select both month and year!");
    return;
  }

  const transactions = getTransactions();
  const filteredTransactions = transactions.filter(t => {
    const date = new Date(t.timestamp);
    return date.getMonth() == month && date.getFullYear() == year;
  });

  generateMonthlySummary(filteredTransactions);
  generateConsumptionChart(filteredTransactions);
  generateUserActivityChart(filteredTransactions);
  generateTopItemsList(filteredTransactions);
  generateTransactionHistory(filteredTransactions);
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

function addNewUser() {
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const role = document.getElementById('newUserRole').value;
  const message = document.getElementById('addUserMessage');

  if (!username || !password || !confirmPassword) {
    message.textContent = "❌ Please fill in all fields!";
    message.style.color = "red";
    return;
  }

  if (password !== confirmPassword) {
    message.textContent = "❌ Passwords do not match!";
    message.style.color = "red";
    return;
  }

  if (userExists(username)) {
    message.textContent = "❌ Username already exists!";
    message.style.color = "red";
    return;
  }

  const users = getUsers();
  users.push({ username, password, role });
  saveUsers(users);

  message.textContent = `✅ ${role} '${username}' added successfully!`;
  message.style.color = "green";

  // Clear form
  document.getElementById('newUsername').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  document.getElementById('newUserRole').value = 'user';

  populateUserSelect();
  refreshUserList();
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

function changePassword() {
  const username = document.getElementById('selectUser').value;
  const newPassword = document.getElementById('newPasswordChange').value;
  const confirmPassword = document.getElementById('confirmPasswordChange').value;
  const message = document.getElementById('changePasswordMessage');

  if (!username || !newPassword || !confirmPassword) {
    message.textContent = "❌ Please fill in all fields!";
    message.style.color = "red";
    return;
  }

  if (newPassword !== confirmPassword) {
    message.textContent = "❌ Passwords do not match!";
    message.style.color = "red";
    return;
  }

  const users = getUsers();
  const userIndex = users.findIndex(u => u.username === username);
  
  if (userIndex === -1) {
    message.textContent = "❌ User not found!";
    message.style.color = "red";
    return;
  }

  users[userIndex].password = newPassword;
  saveUsers(users);

  message.textContent = `✅ Password updated successfully for '${username}'!`;
  message.style.color = "green";

  // Clear form
  document.getElementById('selectUser').value = '';
  document.getElementById('newPasswordChange').value = '';
  document.getElementById('confirmPasswordChange').value = '';
}

function refreshUserList() {
  const users = getUsers();
  const usersList = document.getElementById('usersList');
  
  if (users.length === 0) {
    usersList.innerHTML = '<p>No users found.</p>';
    return;
  }

  const tableHtml = `
    <table class="users-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(user => `
          <tr>
            <td>${user.username}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>
              <button 
                class="delete-user-btn" 
                onclick="deleteUser('${user.username}')"
                ${user.username === 'pasu' || user.username === currentUser.username ? 'disabled' : ''}
              >
                Delete
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  usersList.innerHTML = tableHtml;
}

function deleteUser(username) {
  if (username === 'pasu') {
    alert("❌ Cannot delete the default admin user!");
    return;
  }

  if (username === currentUser.username) {
    alert("❌ Cannot delete your own account!");
    return;
  }

  if (!confirm(`Are you sure you want to delete user '${username}'? This action cannot be undone.`)) {
    return;
  }

  const users = getUsers();
  const filteredUsers = users.filter(u => u.username !== username);
  saveUsers(filteredUsers);

  alert(`✅ User '${username}' deleted successfully!`);
  populateUserSelect();
  refreshUserList();
}

// Make functions globally available
const globalFunctions = {
  toggleMenu,
  showSuggestions,
  openUpdate,
  openUpdateQuantity,
  openDelete,
  showSpares,
  downloadCSV,
  openHistory,
  openUserManagement,
  logout,
  searchItem,
  refreshSparesList
};

// Expose all functions to window
Object.entries(globalFunctions).forEach(([name, func]) => {
  window[name] = func;
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the app
  initializeApp();
  
  // Add event listeners
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', login);
  }
});

// Refresh spares list from the server
async function refreshSparesList() {
  console.log('Refreshing spares list...');
  try {
    const response = await fetch('/api/items');
    if (!response.ok) {
      throw new Error('Failed to fetch spares list');
    }
    const items = await response.json();
    console.log('Spares list updated:', items);
    // Update your UI with the items here
    return items;
  } catch (error) {
    console.error('Error refreshing spares list:', error);
    return [];
  }
}
  
  // Initialize any other components here
  initializeVoiceRecognition();
}

// Other functions
function updateUIForRole() {
  if (!currentUser) return;
  
  const userInfo = document.getElementById('userInfo');
  if (userInfo) {
    userInfo.textContent = `Logged in as ${currentUser.username} (${currentUser.role})`;
  }
  
  // Show/hide admin-only elements
  const adminElements = document.querySelectorAll('[data-role="admin"]');
  adminElements.forEach(el => {
    el.style.display = currentUser.role === 'admin' ? 'block' : 'none';
  });
  
  // Update menu items based on role
  const menuItems = {
    'addBtn': currentUser.role === 'admin',
    'updateQuantityBtn': currentUser.role === 'admin',
    'deleteBtn': currentUser.role === 'admin',
    'historyBtn': true,
    'userManagementBtn': currentUser.role === 'admin'
  };
  
  Object.entries(menuItems).forEach(([id, shouldShow]) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = shouldShow ? 'block' : 'none';
    }
  });
}

function openUpdate() {
  console.log('openUpdate called');
  // Implementation goes here
}

function openUpdateQuantity() {
  console.log('openUpdateQuantity called');
  // Implementation goes here
}

function showSpares() {
  console.log('showSpares called');
  // Implementation goes here
}

function openDelete() {
  console.log('openDelete called');
  // Implementation goes here
}

function downloadCSV() {
  console.log('downloadCSV called');
  // Implementation goes here
}

function openHistory() {
  console.log('openHistory called');
  // Implementation goes here
}

function openUserManagement() {
  console.log('openUserManagement called');
  // Implementation goes here
}

function searchItem() {
  console.log('searchItem called');
  const searchInput = document.getElementById('searchInput');
  if (searchInput && searchInput.value) {
    console.log('Searching for:', searchInput.value);
    // Add search implementation here
  }
}

// Search Suggestions
async function showSuggestions() {
  const searchInput = document.getElementById('searchInput');
  const suggestionsDiv = document.getElementById('suggestions');
  
  if (!searchInput || !suggestionsDiv) return;
  
  const searchTerm = searchInput.value.trim().toLowerCase();
  
  if (searchTerm.length < 2) {
    suggestionsDiv.innerHTML = '';
    suggestionsDiv.style.display = 'none';
    return;
  }
  
  try {
    // Call your API to get suggestions
    const response = await fetch(`/api/items/search?q=${encodeURIComponent(searchTerm)}`);
    const items = await response.json();
    
    if (!items || items.length === 0) {
      suggestionsDiv.innerHTML = '<div class="suggestion-item">No matches found</div>';
      suggestionsDiv.style.display = 'block';
      return;
    }
    
    suggestionsDiv.innerHTML = items
      .map(item => `<div class="suggestion-item" onclick="selectSuggestion('${item.name}')">${item.name}</div>`)
      .join('');
      
    suggestionsDiv.style.display = 'block';
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    suggestionsDiv.innerHTML = '';
    suggestionsDiv.style.display = 'none';
  }
}

// Helper function to select a suggestion
function selectSuggestion(itemName) {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = itemName;
    document.getElementById('suggestions').style.display = 'none';
    searchItem();
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
function searchItem() {
  const searchInput = document.getElementById("searchInput");
  const searchResult = document.getElementById("searchResult");
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    searchResult.innerHTML = '<div class="error">❌ Please enter an item name to search!</div>';
    return;
  }

  if (inventory[query]) {
    const item = inventory[query];
    const currentStock = item.available - item.quantityTaken;
    const stockStatus = getStockStatus(currentStock);
    
    searchResult.innerHTML = `
      <div class="item-details">
        <h4>🔍 Search Result: ${query.charAt(0).toUpperCase() + query.slice(1)}</h4>
        <div class="item-info">
          <p><strong>Make:</strong> ${item.make}</p>
          <p><strong>Model:</strong> ${item.model}</p>
          <p><strong>Specification:</strong> ${item.specification}</p>
          <p><strong>Location:</strong> Rack ${item.rack}, Bin ${item.bin}</p>
          <p><strong>Total Available:</strong> ${item.available}</p>
          <p><strong>Quantity Taken:</strong> ${item.quantityTaken}</p>
          <p><strong>Current Stock:</strong> <span class="${stockStatus.class}">${currentStock} (${stockStatus.status})</span></p>
          <p><strong>Last Updated:</strong> ${item.updated}</p>
          ${item.updatedBy ? `<p><strong>Updated By:</strong> ${item.updatedBy}</p>` : ''}
        </div>
      </div>
    `;
  } else {

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

async function showAddSuggestions() {
  const input = document.getElementById("newItem");
  const suggestBox = document.getElementById("suggestAdd");
  const query = input.value.trim();

  if (query.length < 2) {
    suggestBox.innerHTML = "";
    return;
  }

  try {
    const { data: items, error } = await inventoryAPI.search(query);
    
    if (error) throw new Error(error);
    
    if (items && items.length > 0) {
      suggestBox.innerHTML = items.map(item => 
        `<div onclick="selectAddSuggestion('${item._id}', '${item.name.replace(/'/g, "\'" )}')">${item.name}</div>`
      ).join('');
    } else {
      suggestBox.innerHTML = "";
    }
  } catch (error) {
    console.error('Error searching items:', error);
    suggestBox.innerHTML = "";
  }
}

async function selectAddSuggestion(itemId, itemName) {
  try {
    const { data: item, error } = await inventoryAPI.get(itemId);
    
    if (error) throw new Error(error);
    
    if (item) {
      document.getElementById("newItem").value = item.name;
      document.getElementById("newMake").value = item.make || "";
      document.getElementById("newModel").value = item.model || "";
      document.getElementById("newSpecification").value = item.specification || "";
      document.getElementById("newRack").value = item.rack || "";
      document.getElementById("newBin").value = item.bin || "";
      document.getElementById("suggestAdd").innerHTML = "";
    }
  } catch (error) {
    console.error('Error loading item:', error);
    alert('Failed to load item details. Please try again.');
  }
}

async function addItem() {
  const name = document.getElementById("newItem").value.trim();
  const make = document.getElementById("newMake").value.trim();
  const model = document.getElementById("newModel").value.trim();
  const specification = document.getElementById("newSpecification").value.trim();
  const rack = document.getElementById("newRack").value.trim();
  const bin = document.getElementById("newBin").value.trim();
  const quantity = parseInt(document.getElementById("newQty").value) || 0;
  const addBtn = document.getElementById('addBtn');
  const originalBtnText = addBtn.textContent;

  if (!name) {
    alert("❌ Please enter an item name!");
    return;
  }

  if (quantity <= 0) {
    alert("❌ Please enter a valid quantity!");
    return;
  }

  try {
    addBtn.disabled = true;
    addBtn.textContent = 'Saving...';
    
    // Check if item exists
    const { data: existingItems } = await inventoryAPI.search(name);
    const existingItem = existingItems?.find(item => item.name.toLowerCase() === name.toLowerCase());
    
    if (existingItem) {
      if (!confirm(`Item '${name}' already exists. Do you want to update it?`)) {
        return;
      }
      
      // Update existing item
      const updatedItem = {
        ...existingItem,
        available: existingItem.available + quantity,
        updatedBy: currentUser.username
      };
      
      const { error: updateError } = await inventoryAPI.update(existingItem._id, updatedItem);
      
      if (updateError) throw new Error(updateError);
      
      // Add transaction
      await transactionsAPI.create({
        type: 'add',
        itemName: name,
        quantity: quantity,
        user: currentUser.username,
        details: {
          type: 'quantity_addition',
          previousAvailable: existingItem.available,
          newAvailable: updatedItem.available
        }
      });
      
      alert(`✅ Item '${name}' updated successfully!`);
    } else {
      // Add new item
      const newItem = {
        name,
        make,
        model,
        specification,
        rack,
        bin,
        available: quantity,
        quantityTaken: 0,
        updatedBy: currentUser.username
      };
      
      const { error: createError } = await inventoryAPI.add(newItem);
      
      if (createError) throw new Error(createError);
      
      // Add transaction
      await transactionsAPI.create({
        type: 'new_item',
        itemName: name,
        quantity: quantity,
        user: currentUser.username,
        details: newItem
      });
      
      alert(`✅ Item '${name}' added successfully!`);
    }
    
    clearInputs();
    await refreshSparesList();
    goBack();
  } catch (error) {
    console.error('Error saving item:', error);
    alert(`❌ Failed to save item: ${error.message}`);
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = originalBtnText;
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

async function updateItem() {
  const itemName = document.getElementById("updateItem").value.trim();
  const quantityTaken = parseInt(document.getElementById("quantityTaken").value) || 0;
  const availableQuantity = parseInt(document.getElementById("availableQuantity").value) || 0;
  const updateBtn = document.getElementById('updateBtn');
  const originalBtnText = updateBtn.textContent;

  if (!itemName) {
    alert("❌ Please enter an item name!");
    return;
  }

  try {
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';
    
    // Find the item by name
    const { data: items, error: searchError } = await inventoryAPI.search(itemName);
    if (searchError) throw new Error(searchError);
    
    const existingItem = items?.find(item => item.name.toLowerCase() === itemName.toLowerCase());
    
    if (!existingItem) {
      throw new Error('Item not found in inventory');
    }
    
    // Update item with new quantities
    const updatedItem = {
      ...existingItem,
      available: availableQuantity,
      quantityTaken: quantityTaken,
      updatedBy: currentUser.username
    };
    
    // Save to backend
    const { error: updateError } = await inventoryAPI.update(existingItem._id, updatedItem);
    if (updateError) throw new Error(updateError);
    
    // Add transaction
    await transactionsAPI.create({
      type: 'update',
      itemName: itemName,
      quantity: availableQuantity - existingItem.available,
      user: currentUser.username,
      details: {
        type: 'manual_update',
        previousAvailable: existingItem.available,
        newAvailable: availableQuantity,
        previousTaken: existingItem.quantityTaken,
        newTaken: quantityTaken
      }
    });
    
    alert(`✅ Item '${itemName}' updated successfully!`);
    clearInputs();
    await refreshSparesList();
    goBack();
  } catch (error) {
    console.error('Error updating item:', error);
    alert(`❌ Failed to update item: ${error.message}`);
  } finally {
    updateBtn.disabled = false;
    updateBtn.textContent = originalBtnText;
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

// Refresh spares list
async function refreshSparesList() {
  const sparesList = document.getElementById('sparesList');
  sparesList.innerHTML = '<div class="loading">Loading inventory...</div>';

  try {
    // Fetch items from the backend
    const { data: items, error } = await inventoryAPI.getAll();
    
    if (error) {
      throw new Error(error);
    }

    if (!items || items.length === 0) {
      sparesList.innerHTML = '<p>No items found in inventory.</p>';
      return;
    }

    // Create table
    const table = document.createElement('table');
    table.className = 'spares-table';

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Item', 'Make', 'Model', 'Specification', 'Location', 'Available', 'Taken', 'Current Stock', 'Status', 'Last Updated'];
    
    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    
    // Sort items by name
    items.sort((a, b) => a.name.localeCompare(b.name));
    
    items.forEach(item => {
      const row = document.createElement('tr');
      const currentStock = item.available - (item.quantityTaken || 0);
      const status = getStockStatus(currentStock);
      
      const cells = [
        item.name,
        item.make || '-',
        item.model || '-',
        item.specification || '-',
        `R${item.rack || '-'}, B${item.bin || '-'}`,
        item.available,
        item.quantityTaken || 0,
        currentStock,
        status.status,
        new Date(item.updatedAt).toLocaleString()
      ];
      
      cells.forEach((cellText, index) => {
        const cell = document.createElement('td');
        cell.textContent = cellText;
        if (index === 7) { // Current Stock cell
          cell.classList.add(status.class);
        } else if (index === 8) { // Status cell
          cell.innerHTML = `<span class="status-badge ${status.class}">${status.status}</span>`;
        }
        row.appendChild(cell);
      });
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    sparesList.innerHTML = '';
    sparesList.appendChild(table);
  } catch (error) {
    console.error('Error loading inventory:', error);
    sparesList.innerHTML = `<div class="error">Error loading inventory: ${error.message}</div>`;
  }
}

// Helper function to get stock status
function getStockStatus(quantity) {
  if (quantity <= 0) {
    return { status: 'Out of Stock', class: 'out-of-stock' };
  } else if (quantity <= 5) {
    return { status: 'Low Stock', class: 'low-stock' };
  } else {
    return { status: 'In Stock', class: 'in-stock' };
  }
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

async function deleteItem() {
  const itemName = document.getElementById("deleteItem").value.trim();
  const deleteBtn = document.getElementById('deleteBtn');
  const originalBtnText = deleteBtn.textContent;

  if (!itemName) {
    alert("❌ Please enter an item name!");
    return;
  }

  if (!confirm(`Are you sure you want to delete '${itemName}'? This action cannot be undone.`)) {
    return;
  }

  try {
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    
    // Find the item by name
    const { data: items, error: searchError } = await inventoryAPI.search(itemName);
    if (searchError) throw new Error(searchError);
    
    const existingItem = items?.find(item => item.name.toLowerCase() === itemName.toLowerCase());
    
    if (!existingItem) {
      throw new Error('Item not found in inventory');
    }
    
    // Delete from backend
    const { error: deleteError } = await inventoryAPI.delete(existingItem._id);
    if (deleteError) throw new Error(deleteError);
    
    // Add transaction
    await transactionsAPI.create({
      type: 'delete',
      itemName: itemName,
      quantity: 0,
      user: currentUser.username,
      details: {
        type: 'item_deletion',
        deletedItem: existingItem
      }
    });
    
    alert(`✅ Item '${itemName}' deleted successfully!`);
    clearInputs();
    await refreshSparesList();
    goBack();
  } catch (error) {
    console.error('Error deleting item:', error);
    alert(`❌ Failed to delete item: ${error.message}`);
  } finally {
    deleteBtn.disabled = false;
    deleteBtn.textContent = originalBtnText;
  }
}

async function downloadCSV() {
  try {
    // Fetch all items from the backend
    const { data: items, error } = await inventoryAPI.getAll();
    
    if (error) throw error;
    
    if (!items || items.length === 0) {
      alert("❌ No data to download!");
      return;
    }

    // Sort items by name
    const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
    
    let csvContent = "Item Name,Make,Model,Specification,Rack,Bin,Available,Quantity Taken,Current Stock,Last Updated,Updated By\n";
    
    // Generate CSV content
    sortedItems.forEach(item => {
      const currentStock = item.available - (item.quantityTaken || 0);
      const lastUpdated = item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A';
      
      csvContent += `"${item.name || ''}","${item.make || ''}","${item.model || ''}","${item.specification || ''}","${item.rack || ''}","${item.bin || ''}",${item.available || 0},${item.quantityTaken || 0},${currentStock},"${lastUpdated}","${item.updatedBy || ''}"\n`;
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert("✅ CSV file downloaded successfully!");
  } catch (error) {
    console.error('Error downloading CSV:', error);
    alert(`❌ Failed to download CSV: ${error.message}`);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  initializeUserSystem();
  initializeTransactionHistory();
  initializeVoiceRecognition();
});

// Set up event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Login button click handler
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', login);
  }

  // Enter key handler for login
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const loginPage = document.getElementById('loginPage');
      if (loginPage && !loginPage.classList.contains('hidden')) {
        login();
      }
    }
  });

  // Initialize the app
  initializeApp();
});

// Export functions that need to be accessible from HTML
window.login = login;
window.addNewUser = addNewUser;
window.changePassword = changePassword;
window.refreshUserList = refreshUserList;
window.goBack = goBack;
}}}
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  initializeUserSystem();
  initializeTransactionHistory();
  initializeVoiceRecognition();
});

// Set up event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Login button click handler
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', login);
  }

  // Enter key handler for login
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const loginPage = document.getElementById('loginPage');
      if (loginPage && !loginPage.classList.contains('hidden')) {
        login();
      }
    }
  });

  // Initialize the app
  initializeApp();
});

// Export functions that need to be accessible from HTML
window.login = login;
window.addNewUser = addNewUser;
window.changePassword = changePassword;
window.refreshUserList = refreshUserList;
window.goBack = goBack;
}}}