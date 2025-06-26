// API Configuration
const API_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));

// Initialize inventory data
let inventoryData = [];

// Fetch inventory data on page load
async function initializeApp() {
    try {
        await refreshInventory();
        initializeUserSystem();
        initializeTransactionHistory();
        initializeVoiceRecognition();
        updateUIForRole();
    } catch (error) {
        showError('Failed to initialize app');
    }
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
        inventoryData = await response.json();
        return inventoryData;
    } catch (error) {
        console.error('Error fetching inventory:', error);
        showError('Failed to fetch inventory data');
        return [];
    }
}

// Login function
async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const loginMessage = document.getElementById("loginMessage");

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

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
        loginMessage.textContent = "❌ Invalid username or password!";
        loginMessage.style.color = "red";
    }
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
        showError('Please enter item name');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${name}?`)) {
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
    toggleMenu();
    goBack();
    document.getElementById("sparesSection").classList.remove("hidden");
    
    const sparesList = document.getElementById("sparesList");
    sparesList.innerHTML = '<div class="loading">Loading...</div>';

    try {
        await refreshInventory();
        
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
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventoryData.map(item => {
                        const status = getStockStatus(item.available);
                        return `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.make}</td>
                                <td>${item.model}</td>
                                <td>${item.specification}</td>
                                <td>R${item.rack}, B${item.bin}</td>
                                <td>${item.available}</td>
                                <td><span class="status-badge ${status}">${status}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        sparesList.innerHTML = tableHtml;
    } catch (error) {
        sparesList.innerHTML = '<p class="error">Error loading spares list</p>';
        showError('Failed to load spares list');
    }
}

// Helper function to get stock status
function getStockStatus(available) {
    if (available <= 0) return 'out-of-stock';
    if (available <= 5) return 'low-stock';
    return 'in-stock';
}

// Toast notification functions
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message toast-error';
    toast.textContent = `❌ ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message toast-success';
    toast.textContent = `✅ ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("appPage").classList.remove("hidden");
        document.getElementById("userInfo").textContent = `Logged in as: ${currentUser.username} (${currentUser.role})`;
        initializeApp();
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

// Search function
async function searchItem() {
    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultDiv = document.getElementById('searchResult');
    resultDiv.innerHTML = '<div class="loading">Searching...</div>';

    try {
        const response = await fetch(`${API_URL}/inventory/search?query=${encodeURIComponent(searchInput)}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to search inventory');
        const items = await response.json();

        if (items.length === 0) {
            resultDiv.innerHTML = '<p class="no-results">No items found</p>';
            return;
        }

        const resultsHtml = items.map(item => `
            <div class="item-details">
                <h4>${item.name}</h4>
                <div class="item-info">
                    <p><strong>Make:</strong> ${item.make}</p>
                    <p><strong>Model:</strong> ${item.model}</p>
                    <p><strong>Specification:</strong> ${item.specification}</p>
                    <p><strong>Location:</strong> Rack ${item.rack}, Bin ${item.bin}</p>
                    <p><strong>Available:</strong> <span class="${getStockStatus(item.available)}">${item.available}</span></p>
                    <p><strong>Last Updated:</strong> ${new Date(item.updatedAt).toLocaleString()}</p>
                </div>
            </div>
        `).join('');

        resultDiv.innerHTML = resultsHtml;
    } catch (error) {
        resultDiv.innerHTML = '<p class="error">Error searching items</p>';
        showError('Failed to search items');
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