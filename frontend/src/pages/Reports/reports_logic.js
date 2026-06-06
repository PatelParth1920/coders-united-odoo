// Sample Data
let mockOrders = [];

let performanceChart;
let currentChartData = [0, 0, 0, 0, 0, 0, 0];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    renderTable(mockOrders);
    renderActivityLog();
});

// Chart Initialization
function initChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    // Gradient for line
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');   
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Order Volume',
                data: currentChartData,
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)', borderColor: 'transparent' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// Update Dashboard (Simulates fetching new data based on time range)
function updateDashboard() {
    const range = document.getElementById('timeRange').value;
    logActivity(`Changed time range to ${range}`);
    
    // In a real scenario, fetch data from backend here based on 'range'
    // and then update DOM and charts accordingly.
}

// Simulate New Order
function simulateNewOrder() {
    const newAmount = Math.floor(Math.random() * 2000) + 100;
    const vendors = ['TechNova Solutions', 'Prime Electronics', 'Global Supplies Co.'];
    const newVendor = vendors[Math.floor(Math.random() * vendors.length)];
    
    const newOrder = {
        id: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
        date: new Date().toISOString().split('T')[0],
        vendor: newVendor,
        amount: newAmount,
        status: Math.random() > 0.3 ? 'completed' : 'pending'
    };
    
    mockOrders.unshift(newOrder);
    if(mockOrders.length > 10) mockOrders.pop(); // Keep array small for demo
    
    // Update Chart (increase last day)
    const lastData = performanceChart.data.datasets[0].data;
    lastData[lastData.length - 1] += 10;
    performanceChart.update();
    
    // Update Summary
    const totalOrdersEl = document.getElementById('totalOrders');
    const currentOrders = parseInt(totalOrdersEl.innerText.replace(/,/g, ''));
    totalOrdersEl.innerText = (currentOrders + 1).toLocaleString();
    
    logActivity(`New order ${newOrder.id} placed for $${newAmount.toFixed(2)}`);
    renderTable(mockOrders);
}

// Apply Filters
function applyFilters() {
    const vendor = document.getElementById('filterVendor').value;
    const status = document.getElementById('filterStatus').value;
    
    let filtered = mockOrders;
    if (vendor) {
        // Simple mock filter mapping
        const vendorMap = {
            'vendor1': 'TechNova Solutions',
            'vendor2': 'Global Supplies Co.',
            'vendor3': 'Prime Electronics'
        };
        filtered = filtered.filter(o => o.vendor === vendorMap[vendor]);
    }
    if (status) {
        filtered = filtered.filter(o => o.status === status);
    }
    
    logActivity('Applied filters to data table');
    renderTable(filtered);
}

// Table Rendering
function renderTable(data) {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';
    
    if(data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">No records found</td></tr>';
        return;
    }

    data.forEach(order => {
        const tr = document.createElement('tr');
        const statusClass = order.status === 'completed' ? 'status-completed' : 'status-pending';
        const formattedAmount = `$${order.amount.toFixed(2)}`;
        
        tr.innerHTML = `
            <td><strong>${order.id}</strong></td>
            <td>${order.date}</td>
            <td>${order.vendor}</td>
            <td>${formattedAmount}</td>
            <td><span class="status-badge ${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Search Table
function searchTable() {
    const input = document.getElementById('tableSearch').value.toLowerCase();
    const filtered = mockOrders.filter(o => 
        o.id.toLowerCase().includes(input) || 
        o.vendor.toLowerCase().includes(input)
    );
    renderTable(filtered);
}

// Sort Table
function sortTable() {
    const sortVal = document.getElementById('tableSort').value;
    let sorted = [...mockOrders];
    
    if (sortVal === 'date-desc') sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortVal === 'date-asc') sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sortVal === 'amount-desc') sorted.sort((a, b) => b.amount - a.amount);
    if (sortVal === 'amount-asc') sorted.sort((a, b) => a.amount - b.amount);
    
    renderTable(sorted);
}

// Export Data
function exportData(format) {
    const tableBody = document.getElementById('dataTableBody');
    if (tableBody.children.length === 0 || tableBody.innerText.includes('No records found')) {
        alert("No data to export!");
        return;
    }

    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.text("Detailed Records Report", 14, 15);
        doc.autoTable({ 
            html: '#dataTable',
            startY: 20,
            theme: 'striped'
        });
        
        doc.save(`report_${dateStr}.pdf`);
        logActivity(`Exported report as PDF`);
        
    } else if (format === 'excel') {
        const table = document.getElementById("dataTable");
        const wb = XLSX.utils.table_to_book(table, {sheet: "Detailed Records"});
        
        XLSX.writeFile(wb, `report_${dateStr}.xlsx`);
        logActivity(`Exported report as Excel`);
    }
}

// Activity Log
function renderActivityLog() {
    // Start with empty logs, backend will provide the real data
    const ul = document.getElementById('activityLog');
    ul.innerHTML = '';
}

function logActivity(message, iconClass = 'fa-bolt', time = 'Just now') {
    const ul = document.getElementById('activityLog');
    const li = document.createElement('li');
    li.className = 'activity-item';
    li.innerHTML = `
        <div class="activity-icon"><i class="fa-solid ${iconClass}"></i></div>
        <div class="activity-details">
            <p>${message}</p>
            <div class="activity-time">${time}</div>
        </div>
    `;
    ul.prepend(li); // Add to top
    
    if(ul.children.length > 10) {
        ul.removeChild(ul.lastChild);
    }
}

// Utility: Animate numbers
function animateValue(id, start, end, duration, isCurrency = false) {
    let obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = Math.floor(progress * (end - start) + start);
        
        if (isCurrency) {
            obj.innerHTML = '$' + currentVal.toLocaleString();
        } else {
            obj.innerHTML = currentVal.toLocaleString();
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
