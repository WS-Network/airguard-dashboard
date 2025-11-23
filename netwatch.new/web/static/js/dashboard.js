// Configuration
const API_BASE_URL = 'http://localhost:8080/api';
const REFRESH_INTERVAL = 5000; // 5 seconds

// State
let isLoggedIn = false;
let refreshTimer = null;
let networkChart = null;
let deviceChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Authentication
function checkAuth() {
    const auth = localStorage.getItem('netwatch_auth');
    if (auth) {
        const authData = JSON.parse(auth);
        if (authData.username && authData.token) {
            isLoggedIn = true;
            document.getElementById('currentUser').textContent = authData.username;
            showDashboard();
        }
    }
}

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Show loading
    document.getElementById('loginBtnText').style.display = 'none';
    document.getElementById('loginLoader').style.display = 'inline-block';

    // Simple authentication (can be enhanced with real backend auth)
    setTimeout(() => {
        if (username === 'admin' && password === 'admin') {
            const authData = {
                username: username,
                token: btoa(username + ':' + password),
                timestamp: Date.now()
            };
            localStorage.setItem('netwatch_auth', JSON.stringify(authData));
            isLoggedIn = true;
            document.getElementById('currentUser').textContent = username;
            showDashboard();
        } else {
            alert('Invalid credentials. Please use admin/admin');
            document.getElementById('loginBtnText').style.display = 'inline';
            document.getElementById('loginLoader').style.display = 'none';
        }
    }, 1000);
}

function handleLogout() {
    localStorage.removeItem('netwatch_auth');
    isLoggedIn = false;
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginModal').style.display = 'flex';
}

function showDashboard() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    // Initialize dashboard
    initializeCharts();
    fetchDashboardData();

    // Start auto-refresh
    refreshTimer = setInterval(fetchDashboardData, REFRESH_INTERVAL);
}

// Event Listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchDevices');
    if (searchInput) {
        searchInput.addEventListener('input', filterDevices);
    }
}

// API Calls
async function fetchDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/scan`);
        if (response.ok) {
            const data = await response.json();
            updateDashboard(data);
            updateLastUpdateTime();
            updateAPIStatus(true);
        } else {
            updateAPIStatus(false);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        updateAPIStatus(false);
    }
}

function updateDashboard(data) {
    // Update stats
    updateStats(data);

    // Update devices table
    updateDevicesTable(data.network_devices || []);

    // Update bad frequencies
    updateBadFrequencies(data.bad_frequencies || []);

    // Update charts
    updateCharts(data);
}

function updateStats(data) {
    const wifiDevices = data.wifi_devices || [];
    const networkDevices = data.network_devices || [];
    const badFreq = data.bad_frequencies || [];
    const sshConnected = networkDevices.filter(d => d.ssh_status === 'connected').length;

    // Remove loading skeleton and update numbers
    document.getElementById('wifiDeviceCount').innerHTML = wifiDevices.length;
    document.getElementById('networkDeviceCount').innerHTML = networkDevices.length;
    document.getElementById('badFreqCount').innerHTML = badFreq.length;
    document.getElementById('sshCount').innerHTML = sshConnected;
}

function updateDevicesTable(devices) {
    const tableBody = document.getElementById('devicesTableBody');
    const loadingDiv = document.getElementById('devicesTableLoading');
    const tableDiv = document.getElementById('devicesTable');
    const noDevicesDiv = document.getElementById('noDevices');

    // Hide loading
    loadingDiv.style.display = 'none';

    if (devices.length === 0) {
        tableDiv.style.display = 'none';
        noDevicesDiv.style.display = 'block';
        return;
    }

    tableDiv.style.display = 'block';
    noDevicesDiv.style.display = 'none';

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add rows
    devices.forEach(device => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="device-status ${device.ssh_status === 'connected' ? 'online' : 'offline'}"></span></td>
            <td><strong>${device.ip}</strong></td>
            <td>${device.hostname || 'Unknown'}</td>
            <td>${device.mac || 'N/A'}</td>
            <td>${device.vendor || 'Unknown'}</td>
            <td>${Array.isArray(device.ports) ? device.ports.join(', ') || 'None' : 'None'}</td>
            <td><span class="ssh-badge ${device.ssh_status === 'connected' ? 'ssh-connected' : 'ssh-disconnected'}">
                ${device.ssh_status === 'connected' ? '✓ Connected' : 'Not Connected'}
            </span></td>
            <td>${device.rssi || '-'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateBadFrequencies(frequencies) {
    const loadingDiv = document.getElementById('badFreqLoading');
    const listDiv = document.getElementById('badFreqList');
    const noFreqDiv = document.getElementById('noBadFreq');
    const contentDiv = document.getElementById('badFreqContent');

    // Hide loading
    loadingDiv.style.display = 'none';

    if (frequencies.length === 0) {
        listDiv.style.display = 'none';
        noFreqDiv.style.display = 'block';
        return;
    }

    listDiv.style.display = 'block';
    noFreqDiv.style.display = 'none';

    // Clear existing content
    contentDiv.innerHTML = '';

    // Add frequency items
    frequencies.forEach(freq => {
        const item = document.createElement('div');
        item.className = 'freq-item';
        item.innerHTML = `
            <h4>${freq.freq || 'Unknown'} MHz</h4>
            <p><strong>Signal:</strong> ${freq.signal || 'N/A'} dBm</p>
            <p><strong>Reasons:</strong> ${Array.isArray(freq.reasons) ? freq.reasons.join(', ') : 'No details'}</p>
        `;
        contentDiv.appendChild(item);
    });
}

function filterDevices() {
    const searchTerm = document.getElementById('searchDevices').value.toLowerCase();
    const rows = document.querySelectorAll('#devicesTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Charts
function initializeCharts() {
    // Network Traffic Chart
    const networkCtx = document.getElementById('networkChart');
    if (networkCtx) {
        networkChart = new Chart(networkCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Network Devices',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'WiFi Devices',
                    data: [],
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f1f5f9'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.5)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.5)'
                        }
                    }
                }
            }
        });
    }

    // Device Distribution Chart
    const deviceCtx = document.getElementById('deviceChart');
    if (deviceCtx) {
        deviceChart = new Chart(deviceCtx, {
            type: 'doughnut',
            data: {
                labels: ['SSH Connected', 'Not Connected', 'WiFi Devices'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(148, 163, 184, 0.8)',
                        'rgba(139, 92, 246, 0.8)'
                    ],
                    borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(148, 163, 184)',
                        'rgb(139, 92, 246)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f1f5f9',
                            padding: 20
                        }
                    }
                }
            }
        });
    }
}

function updateCharts(data) {
    const networkDevices = data.network_devices || [];
    const wifiDevices = data.wifi_devices || [];
    const timestamp = new Date().toLocaleTimeString();

    // Update network chart
    if (networkChart) {
        if (networkChart.data.labels.length > 10) {
            networkChart.data.labels.shift();
            networkChart.data.datasets[0].data.shift();
            networkChart.data.datasets[1].data.shift();
        }

        networkChart.data.labels.push(timestamp);
        networkChart.data.datasets[0].data.push(networkDevices.length);
        networkChart.data.datasets[1].data.push(wifiDevices.length);
        networkChart.update('none');
    }

    // Update device chart
    if (deviceChart) {
        const sshConnected = networkDevices.filter(d => d.ssh_status === 'connected').length;
        const notConnected = networkDevices.length - sshConnected;

        deviceChart.data.datasets[0].data = [
            sshConnected,
            notConnected,
            wifiDevices.length
        ];
        deviceChart.update('none');
    }
}

function refreshCharts() {
    if (networkChart) networkChart.update();
    if (deviceChart) deviceChart.update();
}

function refreshDevices() {
    fetchDashboardData();
}

// Utility Functions
function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
}

function updateAPIStatus(isConnected) {
    const statusElement = document.getElementById('apiStatus');
    if (isConnected) {
        statusElement.textContent = 'Connected';
        statusElement.className = 'status-active';
    } else {
        statusElement.textContent = 'Disconnected';
        statusElement.className = '';
        statusElement.style.color = 'var(--danger-color)';
    }
}

// Export functions for inline onclick handlers
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.refreshCharts = refreshCharts;
window.refreshDevices = refreshDevices;
