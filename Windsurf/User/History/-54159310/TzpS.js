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

// Initialize voice recognition
function initializeVoiceRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.value = transcript;
        searchItem();
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      resetVoiceButton();
    };
    
    recognition.onend = () => {
      isListening = false;
      resetVoiceButton();
    };
  }
}

// Reset voice button state
function resetVoiceButton() {
  const voiceBtn = document.getElementById('voiceSearchBtn');
  if (voiceBtn) {
    voiceBtn.innerHTML = '<span id="voiceIcon">🎤</span>';
    voiceBtn.style.background = '';
  }
}

// Start voice recognition
function startListening() {
  if (!recognition) {
    initializeVoiceRecognition();
  }
  
  if (isListening) {
    recognition.stop();
    isListening = false;
    resetVoiceButton();
    return;
  }
  
  try {
    recognition.start();
    isListening = true;
    const voiceBtn = document.getElementById('voiceSearchBtn');
    if (voiceBtn) {
      voiceBtn.innerHTML = '<span id="voiceIcon">🔴</span>';
      voiceBtn.style.background = '#ffebee';
    }
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    isListening = false;
    resetVoiceButton();
  }
}

// Keyboard shortcut for voice search
document.addEventListener('keydown', function(event) {
  // Alt + V for voice search
  if (event.altKey && event.key.toLowerCase() === 'v') {
    event.preventDefault();
    startListening();
  }
});

// Login function
async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  
  if (!username || !password) {
    alert('Please enter both username and password');
    return;
  }
  
  try {
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    // Call login API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Save token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    currentUser = data.user;
    
    // Update UI
    updateUIForRole();
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('appPage').classList.remove('hidden');
    
    // Load initial data
    await refreshSparesList();
    
  } catch (error) {
    console.error('Login error:', error);
    alert(error.message || 'Login failed. Please try again.');
  } finally {
    // Reset login button
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

// Logout function
function logout() {
  // Clear session
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  
  // Update UI
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('appPage').classList.add('hidden');
  
  // Clear form
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  
  // Reset any other UI state if needed
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    mainContent.innerHTML = '';
  }
}

// Update UI based on user role
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
}

// Toggle side menu
function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("overlay");
  if (menu.classList.contains("active")) {
    menu.classList.remove("active");
    if (overlay) overlay.style.display = "none";
  } else {
    menu.classList.add("active");
    if (overlay) overlay.style.display = "block";
  }
}

// Search functions
async function searchItem() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput || !searchInput.value.trim()) {
    alert('Please enter a search term');
    return;
  }
  
  try {
    const response = await fetch(`/api/items/search?q=${encodeURIComponent(searchInput.value)}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }
    const items = await response.json();
    console.log('Search results:', items);
    // Update UI with search results
  } catch (error) {
    console.error('Search error:', error);
    alert('Failed to perform search. Please try again.');
  }
}

// Show search suggestions
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
    const response = await fetch(`/api/items/suggest?q=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) throw new Error('Failed to get suggestions');
    
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

// Select a suggestion
function selectSuggestion(itemName) {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = itemName;
    const suggestionsDiv = document.getElementById('suggestions');
    if (suggestionsDiv) {
      suggestionsDiv.style.display = 'none';
    }
    searchItem();
  }
}

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

// Stub functions for menu items
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
  selectSuggestion,
  refreshSparesList,
  startListening,
  login
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
