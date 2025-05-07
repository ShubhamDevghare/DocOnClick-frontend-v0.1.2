document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize user menu dropdown
    initUserMenu();
    
    // Initialize settings tabs
    initSettingsTabs();
    
    // Initialize save buttons
    initSaveButtons();
    
    // Initialize danger zone
    initDangerZone();
    
    // Initialize modals
    initModals();
    
    // Setup logout functionality
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
});

function initUserMenu() {
    const userProfileToggle = document.getElementById('user-profile-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    
    userProfileToggle.addEventListener('click', function() {
        userDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userProfileToggle.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Set user name and profile image
    const userName = localStorage.getItem('userName') || 'User';
    const userProfileImage = localStorage.getItem('userProfileImage') || '/placeholder.svg?height=200&width=200';
    
    document.getElementById('user-name').textContent = userName;
    
    const headerProfileImage = document.getElementById('header-profile-image');
    headerProfileImage.src = userProfileImage;
    headerProfileImage.onerror = function() {
        this.src = '/placeholder.svg?height=200&width=200';
    };
}

function initSettingsTabs() {
    const menuItems = document.querySelectorAll('.settings-menu-item');
    const sections = document.querySelectorAll('.settings-section');
    
    // Check if there's a hash in the URL
    const hash = window.location.hash;
    if (hash) {
        const targetSection = document.querySelector(hash + '-section');
        if (targetSection) {
            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));
            
            // Show target section
            targetSection.classList.add('active');
            
            // Update active menu item
            menuItems.forEach(item => {
                if (item.getAttribute('href') === hash) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get target section
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));
            
            // Show target section
            targetSection.classList.add('active');
            
            // Update active menu item
            menuItems.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            // Update URL hash
            window.location.hash = this.getAttribute('href');
        });
    });
}

function initSaveButtons() {
    // Notifications settings
    document.getElementById('save-notifications-btn').addEventListener('click', function() {
        const emailNotifications = document.getElementById('email-notifications').checked;
        const smsNotifications = document.getElementById('sms-notifications').checked;
        const appointmentReminders = document.getElementById('appointment-reminders').checked;
        const promotionalEmails = document.getElementById('promotional-emails').checked;
        
        // In a real application, you would send these settings to the server
        // For this example, we'll just show a success message
        
        // Simulate API call
        setTimeout(() => {
            showMessage('Notification settings saved successfully!', 'success', 'notifications-status-message');
        }, 1000);
    });
    
    // Privacy settings
    document.getElementById('save-privacy-btn').addEventListener('click', function() {
        const profileVisibility = document.getElementById('profile-visibility').value;
        const showMedicalHistory = document.getElementById('show-medical-history').checked;
        const dataSharing = document.getElementById('data-sharing').checked;
        
        // Simulate API call
        setTimeout(() => {
            showMessage('Privacy settings saved successfully!', 'success', 'privacy-status-message');
        }, 1000);
    });
    
    // Security settings
    document.getElementById('save-security-btn').addEventListener('click', function() {
        const twoFactorAuth = document.getElementById('two-factor-auth').checked;
        const loginNotifications = document.getElementById('login-notifications').checked;
        
        // Simulate API call
        setTimeout(() => {
            showMessage('Security settings saved successfully!', 'success', 'security-status-message');
        }, 1000);
    });
    
    // Preferences settings
    document.getElementById('save-preferences-btn').addEventListener('click', function() {
        const language = document.getElementById('language-preference').value;
        const timeFormat = document.getElementById('time-format').value;
        
        // Simulate API call
        setTimeout(() => {
            showMessage('Preferences saved successfully!', 'success', 'preferences-status-message');
        }, 1000);
    });
}

function initDangerZone() {
    // Deactivate account
    document.getElementById('deactivate-account-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to deactivate your account? You can reactivate it later.')) {
            // Simulate API call
            setTimeout(() => {
                showMessage('Your account has been deactivated. You will be logged out in 5 seconds.', 'success', 'account-status-message');
                
                // Logout after 5 seconds
                setTimeout(() => {
                    logout();
                }, 5000);
            }, 1000);
        }
    });
    
    // Delete account
    document.getElementById('delete-account-btn').addEventListener('click', function() {
        document.getElementById('confirm-delete-modal').classList.add('active');
    });
    
    // Enable/disable delete button based on confirmation text
    document.getElementById('confirm-delete').addEventListener('input', function() {
        const confirmBtn = document.getElementById('confirm-delete-btn');
        if (this.value === 'DELETE') {
            confirmBtn.disabled = false;
        } else {
            confirmBtn.disabled = true;
        }
    });
    
    // Confirm delete
    document.getElementById('confirm-delete-btn').addEventListener('click', function() {
        if (document.getElementById('confirm-delete').value === 'DELETE') {
            // Simulate API call
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            
            setTimeout(() => {
                document.getElementById('confirm-delete-modal').classList.remove('active');
                showMessage('Your account has been deleted. You will be logged out in 5 seconds.', 'success', 'account-status-message');
                
                // Logout after 5 seconds
                setTimeout(() => {
                    logout();
                }, 5000);
            }, 2000);
        }
    });
}

function initModals() {
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.classList.remove('active');
        });
    });
    
    // Close modal when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

function showMessage(message, type, elementId) {
    const statusMessage = document.getElementById(elementId);
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    statusMessage.classList.add(type);
    
    // Scroll to message
    statusMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Clear message after 5 seconds
    setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }, 5000);
}

function logout() {
    // Clear local storage
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userProfileImage');
    
    // Redirect to login page
    window.location.href = 'login.html';
}