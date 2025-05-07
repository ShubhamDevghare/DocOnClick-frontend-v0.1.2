document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const doctorId = localStorage.getItem('doctorId');
    const userType = localStorage.getItem('userType');
    
    if (!doctorId || userType !== 'DOCTOR') {
        window.location.href = 'login.html';
        return;
    }
    
    // Load doctor profile
    loadDoctorProfile();
    
    // Initialize tabs
    initializeTabs();
    
    // Initialize forms
    initializeForms();
    
    // Initialize profile image upload
    initializeProfileImageUpload();
    
    // Initialize logout
    document.getElementById('logout-button').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });
});

// Load doctor profile
function loadDoctorProfile() {
    const doctorId = localStorage.getItem('doctorId');
    const doctorName = localStorage.getItem('userName');
    
    // Update sidebar info
    document.getElementById('doctor-name').textContent = doctorName || 'Doctor';
    
    // Call API to get doctor details
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load doctor profile');
            }
            return response.json();
        })
        .then(data => {
            // Update doctor info in sidebar
            document.getElementById('doctor-specialization').textContent = data.specialization || 'Specialist';
            
            if (data.profileImage) {
                document.getElementById('doctor-avatar').src = data.profileImage;
                document.getElementById('profile-preview').src = data.profileImage;
            }
            
            // Fill profile form
            document.getElementById('full-name').value = data.fullName || '';
            document.getElementById('specialization').value = data.specialization || '';
            document.getElementById('medical-license').value = data.medicalLicenseNumber || '';
            document.getElementById('experience-years').value = data.experienceYears || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('phone').value = data.phone || '';
            document.getElementById('gender').value = data.gender || '';
            document.getElementById('date-of-birth').value = data.dateOfBirth || '';
            document.getElementById('address').value = data.address || '';
            
            // Fill fees form
            document.getElementById('consultation-fee').value = data.fees || '';
            document.getElementById('slot-duration').value = data.slotDurationMinutes || 30;
            
            // Fill payment form
            document.getElementById('upi-id').value = data.upiId || '';
            document.getElementById('account-number').value = data.accountNumber || '';
            document.getElementById('bank-name').value = data.bankName || '';
            document.getElementById('ifsc-code').value = data.cifNumber || ''; // Using cifNumber as IFSC
            document.getElementById('account-holder').value = data.fullName || '';
        })
        .catch(error => {
            console.error('Error loading doctor profile:', error);
            alert('Failed to load profile information. Please try again.');
        });
}

// Initialize tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Initialize forms
function initializeForms() {
    // Profile form
    const profileForm = document.getElementById('profile-form');
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const doctorId = localStorage.getItem('doctorId');
        const formData = new FormData(this);
        
        // Add doctor ID
        formData.append('doctorId', doctorId);
        
        // Call API to update profile
        fetch(`http://localhost:8080/api/v1/doctors/${doctorId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            return response.json();
        })
        .then(data => {
            alert('Profile updated successfully');
            
            // Update sidebar info
            document.getElementById('doctor-name').textContent = data.fullName || 'Doctor';
            document.getElementById('doctor-specialization').textContent = data.specialization || 'Specialist';
            
            if (data.profileImage) {
                document.getElementById('doctor-avatar').src = data.profileImage;
            }
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        });
    });
    
    // Password form
    const passwordForm = document.getElementById('password-form');
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate passwords
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        
        const doctorId = localStorage.getItem('doctorId');
        
        // Create password update object
        const passwordUpdate = {
            currentPassword,
            newPassword
        };
        
        // Call API to update password
        fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwordUpdate)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update password');
            }
            return response.json();
        })
        .then(data => {
            alert('Password updated successfully');
            passwordForm.reset();
        })
        .catch(error => {
            console.error('Error updating password:', error);
            alert('Failed to update password. Please check your current password and try again.');
        });
    });
    
    // Account preferences form
    const accountPreferencesForm = document.getElementById('account-preferences-form');
    accountPreferencesForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const twoFactor = document.getElementById('two-factor').checked;
        const emailNotifications = document.getElementById('email-notifications').checked;
        const smsNotifications = document.getElementById('sms-notifications').checked;
        
        // In a real app, you would call an API to update preferences
        alert('Account preferences saved successfully');
    });
    
    // Fees form
    const feesForm = document.getElementById('fees-form');
    feesForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const doctorId = localStorage.getItem('doctorId');
        const fees = document.getElementById('consultation-fee').value;
        const slotDurationMinutes = document.getElementById('slot-duration').value;
        
        // Create fees update object
        const feesUpdate = {
            fees,
            slotDurationMinutes
        };
        
        // Call API to update fees
        fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/fees`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feesUpdate)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update fees');
            }
            return response.json();
        })
        .then(data => {
            alert('Fees updated successfully');
        })
        .catch(error => {
            console.error('Error updating fees:', error);
            alert('Failed to update fees. Please try again.');
        });
    });
    
    // Payment form
    const paymentForm = document.getElementById('payment-form');
    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const doctorId = localStorage.getItem('doctorId');
        const upiId = document.getElementById('upi-id').value;
        const accountNumber = document.getElementById('account-number').value;
        const bankName = document.getElementById('bank-name').value;
        const ifscCode = document.getElementById('ifsc-code').value;
        
        // Create payment update object
        const paymentUpdate = {
            upiId,
            accountNumber,
            bankName,
            cifNumber: ifscCode // Using cifNumber field for IFSC
        };
        
        // Call API to update payment details
        fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/payment-details`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentUpdate)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update payment details');
            }
            return response.json();
        })
        .then(data => {
            alert('Payment details updated successfully');
        })
        .catch(error => {
            console.error('Error updating payment details:', error);
            alert('Failed to update payment details. Please try again.');
        });
    });
    
    // Notifications form
    const notificationsForm = document.getElementById('notifications-form');
    notificationsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // In a real app, you would call an API to update notification preferences
        alert('Notification preferences saved successfully');
    });
    
    // Deactivate account button
    const deactivateAccountButton = document.getElementById('deactivate-account');
    deactivateAccountButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
            const doctorId = localStorage.getItem('doctorId');
            
            // Call API to deactivate account
            fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/deactivate`, {
                method: 'PUT'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to deactivate account');
                }
                return response.json();
            })
            .then(data => {
                alert('Your account has been deactivated. You will be logged out.');
                localStorage.clear();
                window.location.href = 'login.html';
            })
            .catch(error => {
                console.error('Error deactivating account:', error);
                alert('Failed to deactivate account. Please try again.');
            });
        }
    });
}

// Initialize profile image upload
function initializeProfileImageUpload() {
    const profileImage = document.getElementById('profile-image');
    const profilePreview = document.getElementById('profile-preview');
    const changeImageButton = document.getElementById('change-image');
    
    changeImageButton.addEventListener('click', function() {
        profileImage.click();
    });
    
    profileImage.addEventListener('change', function() {
        const file = this.files[0];
        
        if (file) {
            // Validate file type
            if (!file.type.match('image.*')) {
                alert('Please select an image file');
                return;
            }
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size should not exceed 2MB');
                return;
            }
            
            // Preview image
            const reader = new FileReader();
            reader.onload = function(e) {
                profilePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    sidebar.classList.toggle('active');
}