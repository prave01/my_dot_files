// API Configuration
const API_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));

// Initialize inventory data
let inventoryData = [];

// Menu toggle function
function toggleMenu() {
    const menu = document.getElementById("sideMenu");
    const overlay = document.getElementById("overlay");
    menu.classList.toggle("open");
    overlay.classList.toggle("show");
}

// Go back function
function goBack() {
    document.querySelectorAll('.section').forEach(section => {
        if (!section.id.match(/^(loginPage|appPage|main)$/)) {
            section.classList.add('hidden');
        }
    });
    document.getElementById('main').classList.remove('hidden');
    document.getElementById('searchResult').innerHTML = '';
    clearInputs();
}

function clearInputs() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.type !== 'button' && input.type !== 'submit') {
            input.value = '';
        }
    });
}

// Initialize user system
function initializeUserSystem() {
    if (authToken && currentUser) {
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("appPage").classList.remove("hidden");
        document.getElementById("main").classList.remove("hidden");
        document.getElementById("userInfo").textContent = `Logged in as: ${currentUser.username} (${currentUser.role})`;
        initializeApp();
    } else {
        document.getElementById("loginPage").classList.remove("hidden");
        document.getElementById("appPage").classList.add("hidden");
    }
}

// Initialize transaction history
function initializeTransactionHistory() {
    try {
        // This function can be implemented later when transaction history feature is needed
        console.log('Transaction history initialization skipped');
  } catch (error) {
        console.error('Error initializing transaction history:', error);
    }
}

// Initialize voice recognition
function initializeVoiceRecognition() {
    try {
        // This function can be implemented later when voice recognition feature is needed
        console.log('Voice recognition initialization skipped');
    } catch (error) {
        console.error('Error initializing voice recognition:', error);
    }
}

// Fetch inventory data on page load
async function initializeApp() {
    try {
        if (!authToken) {
            throw new Error('Authentication required');
        }
        await refreshInventory();
        updateUIForRole();
    } catch (error) {
        console.error('Error initializing app:', error);
        logout(); // Ensure clean logout if initialization fails
    }
}

// Update UI based on user role
function updateUIForRole() {
    const adminButtons = ['addBtn', 'updateQuantityBtn', 'deleteBtn', 'historyBtn', 'userManagementBtn'];
    adminButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.style.display = (currentUser && currentUser.role === 'admin') ? 'block' : 'none';
        }
    });
}

// Function to refresh inventory data
async function refreshInventory() {
    try {
        const response = await fetch(`${API_URL}/inventory`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch inventory');
        const data = await response.json();
        inventoryData = data;
        return data;
    } catch (error) {
        console.error('Error fetching inventory:', error);
        showError('Failed to fetch inventory data');
        return [];
    }
}

// Helper function to find item by name
function findItemByName(name) {
    return inventoryData.find(item => item.name.toLowerCase() === name.toLowerCase());
}

// Login function
async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const loginMessage = document.getElementById("loginMessage");

    if (!username || !password) {
        loginMessage.textContent = "❌ Please enter both username and password!";
        loginMessage.style.color = "red";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));

        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("appPage").classList.remove("hidden");
        document.getElementById("userInfo").textContent = `Logged in as: ${currentUser.username} (${currentUser.role})`;
        
        await initializeApp();
        showSuccess('Login successful');
    } catch (error) {
        console.error('Login error:', error);
        loginMessage.textContent = "❌ " + (error.message || "Invalid username or password!");
        loginMessage.style.color = "red";
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authToken = null;
  currentUser = null;
    inventoryData = [];
  document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("appPage").classList.add("hidden");
    document.getElementById("userInfo").textContent = '';
    // Reset any open sections
    document.querySelectorAll('.section').forEach(section => {
        if (!section.id.match(/^(loginPage)$/)) {
            section.classList.add('hidden');
        }
    });
}

// Add Item function
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
        const response = await fetch(`${API_URL}/inventory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                make,
                model,
                specification,
                rack,
                bin,
                available
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to add item');

        showSuccess('Item added successfully');
        clearInputs();
        await refreshInventory();
        goBack();
    } catch (error) {
        showError(error.message || 'Failed to add item');
    }
}

// Update Item function
async function updateItem() {
    const name = document.getElementById('updateItem').value.trim();
    const quantityTaken = parseInt(document.getElementById('quantityTaken').value) || 0;

    if (!name || quantityTaken <= 0) {
        showError('Please enter valid item name and quantity');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/inventory/${encodeURIComponent(name)}/quantity`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ quantityTaken })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update quantity');

        showSuccess('Quantity updated successfully');
        clearInputs();
        await refreshInventory();
        goBack();
    } catch (error) {
        showError(error.message || 'Failed to update quantity');
    }
}

// Update Available Quantity function
async function updateAvailableQuantity() {
    const name = document.getElementById('updateQuantityItem').value.trim();
    const quantity = parseInt(document.getElementById('newAvailableQuantity').value) || 0;

    if (!name || quantity < 0) {
        showError('Please enter valid item name and quantity');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/inventory/${encodeURIComponent(name)}/available`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ quantity })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update available quantity');

        showSuccess('Available quantity updated successfully');
        clearInputs();
        await refreshInventory();
        goBack();
    } catch (error) {
        showError(error.message || 'Failed to update available quantity');
    }
}

// Delete Item function
async function deleteItem() {
    const name = document.getElementById('deleteItem').value.trim();

    if (!name) {
        showError('Please enter item name to delete');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/inventory/${encodeURIComponent(name)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete item');

        showSuccess('Item deleted successfully');
        clearInputs();
        await refreshInventory();
        goBack();
    } catch (error) {
        showError(error.message || 'Failed to delete item');
    }
}

// Show Spares function
async function showSpares() {
    openSection('sparesSection');
    refreshSparesList();
}

// Helper function to get stock status
function getStockStatus(available) {
    if (available > 10) {
        return { status: 'In Stock', class: 'status-in-stock' };
    } else if (available > 0) {
        return { status: 'Low Stock', class: 'status-low-stock' };
    } else {
        return { status: 'Out of Stock', class: 'status-out-of-stock' };
    }
}

// Toast notification functions
function showError(message) {
    const errorBar = document.getElementById('errorBar');
    errorBar.textContent = message;
    errorBar.classList.add('show');
    setTimeout(() => {
        errorBar.classList.remove('show');
    }, 3000);
}

function showSuccess(message) {
    const successBar = document.getElementById('successBar');
    successBar.textContent = message;
    successBar.classList.add('show');
    setTimeout(() => {
        successBar.classList.remove('show');
    }, 3000);
}

// Initialize app when DOM is loaded
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

// Search function
async function searchItem() {
    const query = document.getElementById('searchInput').value.trim();
    const resultDiv = document.getElementById('searchResult');

    if (!query) {
        resultDiv.innerHTML = '<p>Please enter an item name to search.</p>';
        return;
    }

    const item = findItemByName(query);

    if (item) {
        const currentStock = item.available - (item.quantityTaken || 0);
        const status = getStockStatus(currentStock);
        resultDiv.innerHTML = `
            <div class="search-item-result">
                <h4>${item.name}</h4>
                <p><strong>Make:</strong> ${item.make}</p>
                <p><strong>Model:</strong> ${item.model}</p>
                <p><strong>Specification:</strong> ${item.specification}</p>
                <p><strong>Location:</strong> R${item.rack}, B${item.bin}</p>
                <p><strong>Available:</strong> ${item.available}</p>
                <p><strong>Current Stock:</strong> <span class="${status.class}">${currentStock}</span></p>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `<p>Item "${query}" not found.</p>`;
    }
}

// Show suggestions for search
function showSuggestions() {
    const input = document.getElementById('searchInput');
    const suggestBox = document.getElementById('suggestBox');
    const query = input.value.trim().toLowerCase();

    if (!query) {
        suggestBox.innerHTML = '';
    return;
  }

    const suggestions = inventoryData.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.make.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query)
    ).slice(0, 5);

  if (suggestions.length > 0) {
        suggestBox.innerHTML = suggestions.map(item => `
            <div onclick="selectSuggestion('${item.name}')" tabindex="0">
                ${item.name} (${item.make} ${item.model})
            </div>
        `).join('');
  } else {
        suggestBox.innerHTML = '';
    }
}

// Select suggestion
function selectSuggestion(name) {
    document.getElementById('searchInput').value = name;
    document.getElementById('suggestBox').innerHTML = '';
  searchItem();
}

// Add Item Functions
function openAdd() {
  if (currentUser.role !== "admin") {
    alert("❌ Access denied! Only admins can add items.");
    return;
  }
  openSection('addSection');
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
  openSection('updateSection');
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
  openSection('updateQuantitySection');
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

  const suggestions = inventoryData
    .filter(item => item.name.toLowerCase().includes(query))
    .map(item => item.name);

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
  const itemName = document.getElementById("updateQuantityItem").value.trim();
  const currentQuantityDisplay = document.getElementById("currentQuantityDisplay");
  
  const item = findItemByName(itemName);
  if (item) {
    currentQuantityDisplay.textContent = item.available;
  } else {
    currentQuantityDisplay.textContent = "-";
  }
  updateQuantityPreview();
}

function updateQuantityPreview() {
  const itemName = document.getElementById("updateQuantityItem").value.trim();
  const newQuantity = parseInt(document.getElementById("newAvailableQuantity").value) || 0;
  const newQuantityPreview = document.getElementById("newQuantityPreview");
  
  const item = findItemByName(itemName);
  if (item) {
    const currentAvailable = item.available;
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
  openSection('deleteSection');
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
function refreshSparesList() {
  const sparesList = document.getElementById("sparesList");

  if (inventoryData.length === 0) {
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
        ${inventoryData.map(item => {
          const currentStock = item.available - (item.quantityTaken || 0);
          const status = getStockStatus(currentStock);
          return `
            <tr>
              <td class="item-name">${item.name}</td>
              <td>${item.make}</td>
              <td>${item.model}</td>
              <td>${item.specification}</td>
              <td>R${item.rack}, B${item.bin}</td>
              <td>${item.available}</td>
              <td>${item.quantityTaken || 0}</td>
              <td class="${status.class}">${currentStock}</td>
              <td><span class="status-badge ${status.class}">${status.status}</span></td>
              <td>${item.updated || ''}<br>${item.updatedBy ? `<small>by ${item.updatedBy}</small>` : ''}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  sparesList.innerHTML = tableHtml;
}

function downloadCSV() {
  if (inventoryData.length === 0) {
    alert("❌ No data to download!");
    return;
  }

  let csvContent = "Item Name,Make,Model,Specification,Rack,Bin,Available,Quantity Taken,Current Stock,Last Updated,Updated By\n";
  
  inventoryData.forEach(item => {
    const currentStock = item.available - (item.quantityTaken || 0);
    csvContent += `"${item.name}","${item.make}","${item.model}","${item.specification}","${item.rack}","${item.bin}",${item.available},${item.quantityTaken || 0},${currentStock},"${item.updated || ''}","${item.updatedBy || ''}"\n`;
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

// UI Interaction Functions
function openSection(sectionId) {
    toggleMenu(); // Close the menu
    goBack(); // Hide other sections
    document.getElementById('main').classList.add('hidden');
    document.getElementById(sectionId).classList.remove('hidden');
}

function openHistory() {
    openSection('historySection');
}

function openUserManagement() {
    openSection('userManagementSection');
}

// Voice Recognition (Production Implementation)
function startListening() {
    const searchInput = document.getElementById('searchInput');
    const voiceStatus = document.getElementById('voiceStatus');
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showError('Voice search is not supported in this browser.');
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    voiceStatus.textContent = 'Listening...';
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        voiceStatus.textContent = '';
        searchItem();
    };
    recognition.onerror = function(event) {
        voiceStatus.textContent = '';
        showError('Voice recognition error: ' + event.error);
    };
    recognition.onend = function() {
        voiceStatus.textContent = '';
    };
    recognition.start();
}

// History & Analytics (Production Implementation)
async function generateHistoryReport() {
    const month = document.getElementById('historyMonth').value;
    const year = document.getElementById('historyYear').value;
    if (!month || !year) {
        showError('Please select both month and year.');
        return;
    }
    try {
        // Fetch summary, top items, user activity, and transactions
        const [summary, topItems, userActivity, transactions] = await Promise.all([
            api.getTransactionSummary(month, year),
            api.getTopItems(month, year),
            api.getUserActivity(month, year),
            api.getTransactions(month, year)
        ]);
        renderMonthlySummary(summary);
        renderTopItems(topItems);
        renderItemConsumptionChart(topItems);
        renderUserActivityChart(userActivity);
        renderTransactionTable(transactions);
        showSuccess('Report generated!');
    } catch (err) {
        showError('Failed to generate report: ' + (err.message || err));
    }
}

async function clearHistoryData() {
    if (!confirm('Are you sure you want to clear all transaction history? This cannot be undone.')) return;
    try {
        await api.clearTransactions();
        // Clear UI
        renderMonthlySummary([]);
        renderTopItems([]);
        renderItemConsumptionChart([]);
        renderUserActivityChart([]);
        renderTransactionTable([]);
        showSuccess('Transaction history cleared!');
    } catch (err) {
        showError('Failed to clear history: ' + (err.message || err));
    }
}

function renderMonthlySummary(summary) {
    const el = document.getElementById('monthlySummary');
    if (!el) return;
    if (!summary || summary.length === 0) {
        el.innerHTML = '<p>No data for this month.</p>';
        return;
    }
    el.innerHTML = summary.map(s => `
        <div class="stat-item">
            <span class="stat-value">${s.totalQuantity}</span>
            <span class="stat-label">${s._id.replace('_', ' ').toUpperCase()}</span>
        </div>
    `).join('');
}

function renderTopItems(topItems) {
    const el = document.getElementById('topItemsList');
    if (!el) return;
    if (!topItems || topItems.length === 0) {
        el.innerHTML = '<p>No consumption data.</p>';
        return;
    }
    el.innerHTML = topItems.map((i, idx) => `
        <div class="top-item"><span class="rank">${idx+1}</span><span class="item-name">${i._id}</span><span class="item-count">${i.totalQuantity}</span></div>
    `).join('');
}

function renderItemConsumptionChart(topItems) {
    const el = document.getElementById('consumptionChart');
    if (!el) return;
    if (!window.Chart) {
        el.outerHTML = '<div>No chart library available.</div>';
        return;
    }
    // Destroy previous chart if exists
    if (window._consumptionChart) window._consumptionChart.destroy();
    window._consumptionChart = new Chart(el.getContext('2d'), {
        type: 'bar',
        data: {
            labels: topItems.map(i => i._id),
            datasets: [{
                label: 'Quantity Taken',
                data: topItems.map(i => i.totalQuantity),
                backgroundColor: '#2E8B57'
            }]
        },
        options: {responsive: true, plugins: {legend: {display: false}}}
    });
}

function renderUserActivityChart(userActivity) {
    const el = document.getElementById('userActivityChart');
    if (!el) return;
    if (!window.Chart) {
        el.outerHTML = '<div>No chart library available.</div>';
        return;
    }
    // Destroy previous chart if exists
    if (window._userActivityChart) window._userActivityChart.destroy();
    window._userActivityChart = new Chart(el.getContext('2d'), {
        type: 'bar',
        data: {
            labels: userActivity.map(u => u._id),
            datasets: [{
                label: 'Transactions',
                data: userActivity.map(u => u.totalTransactions),
                backgroundColor: '#007bff'
            }]
        },
        options: {responsive: true, plugins: {legend: {display: false}}}
    });
}

function renderTransactionTable(transactions) {
    const el = document.getElementById('transactionHistory');
    if (!el) return;
    if (!transactions || transactions.length === 0) {
        el.innerHTML = '<p>No transactions for this period.</p>';
        return;
    }
    el.innerHTML = `
        <table class="transaction-table">
            <thead><tr><th>Date</th><th>User</th><th>Type</th><th>Item</th><th>Qty</th></tr></thead>
            <tbody>
                ${transactions.map(t => `
                    <tr>
                        <td>${new Date(t.timestamp).toLocaleString()}</td>
                        <td>${t.user}</td>
                        <td class="transaction-type ${t.type}">${t.type}</td>
                        <td>${t.itemName}</td>
                        <td>${t.quantity}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// User Management (Placeholders & Basic Forms)
function showAddUserForm() {
    document.getElementById('addUserForm').classList.remove('hidden');
    document.getElementById('changePasswordForm').classList.add('hidden');
    document.getElementById('userList').classList.add('hidden');
    document.getElementById('addUserTab').classList.add('active');
    document.getElementById('changePasswordTab').classList.remove('active');
    document.getElementById('userListTab').classList.remove('active');
}

function showChangePasswordForm() {
    document.getElementById('addUserForm').classList.add('hidden');
    document.getElementById('changePasswordForm').classList.remove('hidden');
    document.getElementById('userList').classList.add('hidden');
    document.getElementById('addUserTab').classList.remove('active');
    document.getElementById('changePasswordTab').classList.add('active');
    document.getElementById('userListTab').classList.remove('active');
}

function showUserList() {
    document.getElementById('addUserForm').classList.add('hidden');
    document.getElementById('changePasswordForm').classList.add('hidden');
    document.getElementById('userList').classList.remove('hidden');
    document.getElementById('addUserTab').classList.remove('active');
    document.getElementById('changePasswordTab').classList.remove('active');
    document.getElementById('userListTab').classList.add('active');
    getUsers(); // Fetch users when tab is clicked
}