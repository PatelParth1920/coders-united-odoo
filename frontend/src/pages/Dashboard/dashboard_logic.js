document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // Initialize Spending Trends Chart
  initSpendingChart();

  // Initialize Sidebar Collapse Interactivity
  initSidebarCollapse();

  // Initialize Search Filter
  initSearchFilter();

  // Initialize General Interactive Handlers
  initInteractions();
});

/**
 * Initializes the Spending Trends line chart using Chart.js.
 */
function initSpendingChart() {
  const ctx = document.getElementById('spendingChart').getContext('2d');
  
  // Create gradient fill for the chart area
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)'); // Blue tint
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.00)'); // Transparent fade

  // Data matching the mockup chart trends
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const dataPoints = [120000, 175000, 135000, 210000, 250000, 220000]; // in ₹

  const spendingChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Procurement Value (₹)',
        data: dataPoints,
        borderColor: '#2563eb', // Rich blue border
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4, // Smooth curve
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#1d4ed8',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // We use custom legends / labels matching design
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Inter', size: 12, weight: '600' },
          bodyFont: { family: 'Inter', size: 13 },
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              let value = context.parsed.y;
              if (value >= 100000) {
                return `Procurement Value: ₹${(value / 100000).toFixed(2)}L`;
              }
              return `Procurement Value: ₹${value.toLocaleString('en-IN')}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false, // Hide vertical lines
            drawBorder: false
          },
          ticks: {
            font: { family: 'Inter', size: 12 },
            color: '#64748b'
          }
        },
        y: {
          grid: {
            color: '#f1f5f9', // Clean horizontal lines
            drawBorder: false
          },
          ticks: {
            font: { family: 'Inter', size: 12 },
            color: '#64748b',
            callback: function(value) {
              if (value === 0) return '0';
              if (value >= 100000) {
                return `${value / 100000}L`;
              }
              if (value >= 1000) {
                return `${value / 1000}K`;
              }
              return value;
            },
            stepSize: 50000
          },
          min: 0,
          max: 300000
        }
      }
    }
  });

  // Handle Chart Period Dropdown Change (aesthetic effect)
  const chartPeriod = document.getElementById('chartPeriod');
  if (chartPeriod) {
    chartPeriod.addEventListener('change', (e) => {
      alert(`Loading trend data for: ${e.target.value}`);
      // In a real app, you would fetch new data here and do:
      // spendingChart.data.datasets[0].data = newData;
      // spendingChart.update();
    });
  }
}

/**
 * Handles sidebar collapse / expand interactions.
 */
function initSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  const menuToggle = document.getElementById('menuToggle');
  const sidebarLabels = document.querySelectorAll('.sidebar-label');
  const logoText = document.getElementById('logoText');
  const supportBox = document.getElementById('supportBox');

  let isCollapsed = false;

  function toggleSidebar() {
    isCollapsed = !isCollapsed;

    if (isCollapsed) {
      // Collapse sidebar
      sidebar.classList.remove('w-64');
      sidebar.classList.add('w-20');
      logoText.classList.add('hidden');
      supportBox.classList.add('hidden');

      sidebarLabels.forEach(label => {
        label.classList.add('hidden');
      });

      // Align icons to center
      collapseBtn.querySelector('span').textContent = 'Expand';
      collapseBtn.querySelector('i').setAttribute('data-lucide', 'chevrons-right');
    } else {
      // Expand sidebar
      sidebar.classList.remove('w-20');
      sidebar.classList.add('w-64');
      logoText.classList.remove('hidden');
      supportBox.classList.remove('hidden');

      sidebarLabels.forEach(label => {
        label.classList.remove('hidden');
      });

      collapseBtn.querySelector('span').textContent = 'Collapse';
      collapseBtn.querySelector('i').setAttribute('data-lucide', 'chevrons-left');
    }
    
    // Re-create icons in collapse button
    lucide.createIcons();
  }

  if (collapseBtn) collapseBtn.addEventListener('click', toggleSidebar);
  if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
}

/**
 * Handles table row search filtering.
 */
function initSearchFilter() {
  const searchInput = document.getElementById('searchInput');
  const tableRows = document.querySelectorAll('#poTableBody tr');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      tableRows.forEach(row => {
        const poNumber = row.querySelector('.po-number').textContent.toLowerCase();
        const vendorName = row.querySelector('.vendor-name').textContent.toLowerCase();
        const amount = row.querySelector('.po-amount').textContent.toLowerCase();
        const status = row.querySelector('.po-status').textContent.toLowerCase();

        if (
          poNumber.includes(query) ||
          vendorName.includes(query) ||
          amount.includes(query) ||
          status.includes(query)
        ) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }
}

/**
 * Initializes button action notifications and popups.
 */
function initInteractions() {
  // Support box action
  const contactBtn = document.getElementById('contactSupportBtn');
  if (contactBtn) {
    contactBtn.addEventListener('click', () => {
      showToast('Opening Support Ticket window...');
    });
  }

  // Quick action buttons
  const quickActions = document.querySelectorAll('.action-btn');
  quickActions.forEach(btn => {
    btn.addEventListener('click', () => {
      const actionName = btn.querySelector('span').textContent;
      showToast(`Triggered Quick Action: "${actionName}"`);
    });
  });

  // Sidebar item navigation active swapping
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (item.id === 'collapseBtn') return;
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Table action button popup
  const actionMenuBtns = document.querySelectorAll('.table-actions-btn');
  actionMenuBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showToast('Opening action menu for this PO...');
    });
  });
}

/**
 * Helper to display a temporary notification toast.
 */
function showToast(message) {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.className = 'fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium z-50 flex items-center gap-2 transform transition-all duration-300 translate-y-10 opacity-0';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i data-lucide="info" class="w-4 h-4 text-blue-400"></i> ${message}`;
  lucide.createIcons();

  // Show
  toast.classList.remove('translate-y-10', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-10', 'opacity-0');
  }, 3000);
}
