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

// Remove local inventory object and replace with API calls
let inventoryData = [];

// Function to refresh inventory data
async function refreshInventory() {
    try {
        inventoryData = await api.getAllInventory();
        return inventoryData;
    } catch (error) {
        console.error('Error fetching inventory:', error);
        showError('Failed to fetch inventory data');
        return [];
    }
}

// Update searchItem function
async function searchItem() {
    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '';

    try {
        let items;
        if (searchInput) {
            items = await api.searchInventory(searchInput);
        } else {
            items = await api.getAllInventory();
        }

        if (items.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">No items found</p>';
            return;
        }

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'search-result';
            itemDiv.innerHTML = `
                <h3>${item.name}</h3>
                <p>Make: ${item.make}</p>
                <p>Model: ${item.model}</p>
                <p>Specification: ${item.specification}</p>
                <p>Location: Rack ${item.rack}, Bin ${item.bin}</p>
                <p class="stock ${getStockStatus(item.available)}">
                    Available: ${item.available}
                </p>
                <p>Last updated: ${new Date(item.updated).toLocaleString()} by ${item.updatedBy}</p>
            `;
            resultsDiv.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = '<p class="error">Error searching items</p>';
    }
}

// Update addItem function
async function addItem() {
    const name = document.getElementById('newItem').value.trim();
    const make = document.getElementById('newMake').value.trim();
    const model = document.getElementById('newModel').value.trim();
    const specification = document.getElementById('newSpecification').value.trim();
    const rack = document.getElementById('newRack').value.trim();
    const bin = document.getElementById('newBin').value.trim();
    const available = parseInt(document.getElementById('newQty').value) || 0;

    if (!name || !make || !model || !specification || !rack || !bin) {
        showError('Please fill in all fields');
        return;
    }

    try {
        await api.addItem({
            name,
            make,
            model,
            specification,
            rack,
            bin,
            available
        });
        
        showSuccess('Item added successfully');
        clearInputs();
        await refreshInventory();
        goBack();  // Add this to return to main screen after successful add
    } catch (error) {
        showError(error.message || 'Failed to add item');
    }
}

// Update updateItem function
async function updateItem() {
    const name = document.getElementById('updateName').value.trim();
    const quantityTaken = parseInt(document.getElementById('updateQuantity').value) || 0;

    if (!name || quantityTaken <= 0) {
        showError('Please enter valid item name and quantity');
        return;
    }

    try {
        await api.updateQuantity(name, quantityTaken);
        showSuccess('Quantity updated successfully');
        clearInputs();
        await refreshInventory();
    } catch (error) {
        showError(error.message || 'Failed to update quantity');
    }
}

// Update updateAvailableQuantity function
async function updateAvailableQuantity() {
    const name = document.getElementById('availableQuantityName').value.trim();
    const quantity = parseInt(document.getElementById('newAvailableQuantity').value) || 0;

    if (!name || quantity < 0) {
        showError('Please enter valid item name and quantity');
        return;
    }

    try {
        await api.updateAvailableQuantity(name, quantity);
        showSuccess('Available quantity updated successfully');
        clearInputs();
        await refreshInventory();
    } catch (error) {
        showError(error.message || 'Failed to update available quantity');
    }
}

// Update deleteItem function
async function deleteItem() {
    const name = document.getElementById('deleteName').value.trim();

    if (!name) {
        showError('Please enter item name');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${name}?`)) {
        return;
    }

    try {
        await api.deleteItem(name);
        showSuccess('Item deleted successfully');
        clearInputs();
        await refreshInventory();
    } catch (error) {
        showError(error.message || 'Failed to delete item');
    }
}

// Update showSpares function
async function showSpares() {
    const sparesDiv = document.getElementById('sparesContent');
    sparesDiv.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const items = await api.getAllInventory();
        sparesDiv.innerHTML = '';

        items.forEach(item => {
            const spareDiv = document.createElement('div');
            spareDiv.className = 'spare-item';
            spareDiv.innerHTML = `
                <h3>${item.name}</h3>
                <p>Make: ${item.make}</p>
                <p>Model: ${item.model}</p>
                <p>Specification: ${item.specification}</p>
                <p>Location: Rack ${item.rack}, Bin ${item.bin}</p>
                <p class="stock ${getStockStatus(item.available)}">
                    Available: ${item.available}
                </p>
                <p>Quantity Taken: ${item.quantityTaken}</p>
                <p>Last updated: ${new Date(item.updated).toLocaleString()} by ${item.updatedBy}</p>
            `;
            sparesDiv.appendChild(spareDiv);
        });
    } catch (error) {
        sparesDiv.innerHTML = '<p class="error">Error loading spares list</p>';
    }
}

// Helper function to show error messages
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Helper function to show success messages
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

// your code goes here
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
function showSuggestions() {
  const input = document.getElementById("searchInput");
  const suggestBox = document.getElementById("suggestBox");
  const query = input.value.toLowerCase();

  if (query.length === 0) {
    suggestBox.innerHTML = "";
    return;
  }

  const suggestions = Object.keys(inventoryData).filter(item => 
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

  const suggestions = Object.keys(inventoryData).filter(item => 
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

  const suggestions = Object.keys(inventoryData).filter(item => 
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
  
  if (inventoryData.find(item => item.name === itemName)) {
    currentQuantityDisplay.textContent = inventoryData.find(item => item.name === itemName).available;
  } else {
    currentQuantityDisplay.textContent = "-";
  }
  updateQuantityPreview();
}

function updateQuantityPreview() {
  const itemName = document.getElementById("updateQuantityItem").value.trim().toLowerCase();
  const newQuantity = parseInt(document.getElementById("newAvailableQuantity").value) || 0;
  const newQuantityPreview = document.getElementById("newQuantityPreview");
  
  if (inventoryData.find(item => item.name === itemName)) {
    const currentAvailable = inventoryData.find(item => item.name === itemName).available;
    const newTotal = currentAvailable + newQuantity;
    newQuantityPreview.textContent = newTotal;
  } else {
    newQuantityPreview.textContent = "-";
  }
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

  const suggestions = Object.keys(inventoryData).filter(item => 
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

// Spares List Functions
function showSpares() {
  toggleMenu();
  goBack();
  document.getElementById("sparesSection").classList.remove("hidden");
  refreshSparesList();
}

function refreshSparesList() {
  const sparesList = document.getElementById("sparesList");
  const items = Object.entries(inventoryData);

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
  const items = Object.entries(inventoryData);
  
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