document.addEventListener('DOMContentLoaded', () => {
  // Sidebar logic (can be shared or abstracted later)
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  const logoText = document.getElementById('logoText');
  const supportBox = document.getElementById('supportBox');
  const menuToggle = document.getElementById('menuToggle');

  let isCollapsed = false;

  const toggleSidebar = () => {
    isCollapsed = !isCollapsed;
    
    if (isCollapsed) {
      sidebar.classList.remove('w-64');
      sidebar.classList.add('w-20');
      
      logoText.classList.add('hidden');
      supportBox.classList.add('hidden');
      
      document.querySelectorAll('.sidebar-label').forEach(label => {
        label.classList.add('hidden');
      });
      
      collapseBtn.innerHTML = '<i data-lucide="chevrons-right" class="w-5 h-5 shrink-0"></i>';
    } else {
      sidebar.classList.remove('w-20');
      sidebar.classList.add('w-64');
      
      setTimeout(() => {
        logoText.classList.remove('hidden');
        supportBox.classList.remove('hidden');
        document.querySelectorAll('.sidebar-label').forEach(label => {
          label.classList.remove('hidden');
        });
      }, 150);
      
      collapseBtn.innerHTML = `
        <i data-lucide="chevrons-left" class="w-5 h-5 shrink-0"></i>
        <span class="sidebar-label">Collapse</span>
      `;
    }
    lucide.createIcons();
  };

  if (collapseBtn) {
    collapseBtn.addEventListener('click', toggleSidebar);
  }

  // Mobile menu toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      sidebar.classList.toggle('absolute');
      sidebar.classList.toggle('z-50');
    });
  }

  console.log("PO & Invoice page initialized.");
});
