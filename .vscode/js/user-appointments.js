document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize user menu dropdown
    initUserMenu();
    
    // Initialize filter tabs
    initFilterTabs();
    
    // Initialize search functionality
    initSearch();
    
    // Load appointments (default: all)
    loadAppointments('all');
    
    // Check if there's an appointment ID in the URL (for direct viewing)
    const urlParams = new URLSearchParams(window.location.search);
    const appointmentId = urlParams.get('id');
    if (appointmentId) {
        viewAppointmentDetails(appointmentId);
    }
    
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

function initFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Load appointments based on filter
            const filter = this.getAttribute('data-filter');
            loadAppointments(filter);
        });
    });
}

function initSearch() {
    const searchInput = document.getElementById('search-appointments');
    const searchBtn = document.getElementById('search-btn');
    
    // Search on button click
    searchBtn.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            searchAppointments(searchTerm);
        } else {
            // If search is empty, load based on current filter
            const activeFilter = document.querySelector('.filter-tab.active').getAttribute('data-filter');
            loadAppointments(activeFilter);
        }
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchBtn.click();
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
    
    // Cancel appointment button
    document.getElementById('cancel-appointment-btn').addEventListener('click', function() {
        const appointmentId = this.getAttribute('data-appointment-id');
        if (appointmentId) {
            document.getElementById('appointment-details-modal').classList.remove('active');
            document.getElementById('confirm-cancel-modal').classList.add('active');
            
            // Set appointment ID for confirmation
            document.getElementById('confirm-cancel-btn').setAttribute('data-appointment-id', appointmentId);
        }
    });
    
    // Confirm cancel button
    document.getElementById('confirm-cancel-btn').addEventListener('click', function() {
        const appointmentId = this.getAttribute('data-appointment-id');
        if (appointmentId) {
            cancelAppointment(appointmentId);
        }
    });
    
    // Rating stars
    const ratingStars = document.querySelectorAll('.rating-stars i');
    ratingStars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            document.getElementById('rating-value').value = rating;
            
            // Update star UI
            ratingStars.forEach(s => {
                if (parseInt(s.getAttribute('data-rating')) <= rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
    
    // Submit review button
    document.getElementById('submit-review-btn').addEventListener('click', function() {
        const appointmentId = this.getAttribute('data-appointment-id');
        const doctorId = this.getAttribute('data-doctor-id');
        const rating = document.getElementById('rating-value').value;
        const comment = document.getElementById('review-comment').value;
        
        if (!rating) {
            showMessage('Please select a rating', 'error', 'review-status-message');
            return;
        }
        
        submitReview(appointmentId, doctorId, rating, comment);
    });
}

function loadAppointments(filter, page = 0) {
    const userId = localStorage.getItem('userId');
    const appointmentsContainer = document.getElementById('appointments-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    // Show loading spinner
    appointmentsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading appointments...</p>
        </div>
    `;
    
    // Determine API endpoint based on filter
    let endpoint;
    switch (filter) {
        case 'upcoming':
            endpoint = `http://localhost:8080/api/v1/appointments/upcoming?userId=${userId}&size=5&page=${page}`;
            break;
        case 'completed':
            endpoint = `http://localhost:8080/api/v1/appointments/filter?status=COMPLETED&userId=${userId}&size=5&page=${page}`;
            break;
        case 'cancelled':
            endpoint = `http://localhost:8080/api/v1/appointments/filter?status=CANCELLED&userId=${userId}&size=5&page=${page}`;
            break;
        case 'pending':
            endpoint = `http://localhost:8080/api/v1/appointments/filter?status=PENDING&userId=${userId}&size=5&page=${page}`;
            break;
        default:
            endpoint = `http://localhost:8080/api/v1/appointments/all?userId=${userId}&size=5&page=${page}`;
    }
    
    fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load appointments');
            }
            return response.json();
        })
        .then(data => {
            appointmentsContainer.innerHTML = '';
            
            if (data.content && data.content.length > 0) {
                data.content.forEach(appointment => {
                    const appointmentDate = new Date(appointment.appointmentDate + 'T' + appointment.appointmentTime);
                    const formattedDate = appointmentDate.toLocaleDateString();
                    const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    const appointmentItem = document.createElement('div');
                    appointmentItem.className = 'appointment-item';
                    
                    // Determine available actions based on appointment status
                    let actions = `
                        <button class="action-btn view" title="View Details" onclick="viewAppointmentDetails(${appointment.appointmentId})">
                            <i class="fas fa-eye"></i>
                        </button>
                    `;
                    
                    if (appointment.appointmentStatus === 'CONFIRMED' || appointment.appointmentStatus === 'PENDING') {
                        actions += `
                            <button class="action-btn cancel" title="Cancel Appointment" onclick="showCancelConfirmation(${appointment.appointmentId})">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                    }
                    
                    if (appointment.appointmentStatus === 'COMPLETED') {
                        actions += `
                            <button class="action-btn review" title="Review Doctor" onclick="showReviewForm(${appointment.appointmentId}, ${appointment.doctorId}, '${appointment.doctorName}')">
                                <i class="fas fa-star"></i>
                            </button>
                        `;
                    }
                    
                    appointmentItem.innerHTML = `
                        <div class="appointment-left">
                            <img src="/placeholder.svg?height=80&width=80" alt="Doctor" class="doctor-image">
                            <div class="appointment-details">
                                <h3>Dr. ${appointment.doctorName}</h3>
                                <div class="appointment-speciality">${appointment.doctorSpecialization}</div>
                                <div class="appointment-meta">
                                    <div class="meta-item">
                                        <i class="far fa-calendar-alt"></i> ${formattedDate}
                                    </div>
                                    <div class="meta-item">
                                        <i class="far fa-clock"></i> ${formattedTime}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="appointment-right">
                            <div class="appointment-status status-${appointment.appointmentStatus.toLowerCase()}">${appointment.appointmentStatus}</div>
                            <div class="appointment-actions">
                                ${actions}
                            </div>
                        </div>
                    `;
                    
                    appointmentsContainer.appendChild(appointmentItem);
                });
                
                // Create pagination
                createPagination(data, filter);
            } else {
                appointmentsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="far fa-calendar-times"></i>
                        <p>No appointments found</p>
                        <a href="book-appointment.html" class="btn btn-primary">Book an Appointment</a>
                    </div>
                `;
                paginationContainer.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error loading appointments:', error);
            appointmentsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load appointments</p>
                    <button class="btn btn-primary" onclick="loadAppointments('${filter}', ${page})">Try Again</button>
                </div>
            `;
            paginationContainer.innerHTML = '';
        });
}

function createPagination(data, filter) {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';
    
    if (data.totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = `page-item ${data.first ? 'disabled' : ''}`;
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    if (!data.first) {
        prevButton.addEventListener('click', () => loadAppointments(filter, data.number - 1));
    }
    paginationContainer.appendChild(prevButton);
    
    // Page numbers
    for (let i = 0; i < data.totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `page-item ${i === data.number ? 'active' : ''}`;
        pageButton.textContent = i + 1;
        pageButton.addEventListener('click', () => loadAppointments(filter, i));
        paginationContainer.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = `page-item ${data.last ? 'disabled' : ''}`;
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    if (!data.last) {
        nextButton.addEventListener('click', () => loadAppointments(filter, data.number + 1));
    }
    paginationContainer.appendChild(nextButton);
}

function searchAppointments(searchTerm) {
    const userId = localStorage.getItem('userId');
    const appointmentsContainer = document.getElementById('appointments-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    // Show loading spinner
    appointmentsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Searching appointments...</p>
        </div>
    `;
    
    // In a real application, you would have a dedicated search endpoint
    // For this example, we'll fetch all appointments and filter client-side
    fetch(`http://localhost:8080/api/v1/appointments/all?userId=${userId}&size=100&page=0`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to search appointments');
            }
            return response.json();
        })
        .then(data => {
            appointmentsContainer.innerHTML = '';
            
            if (data.content && data.content.length > 0) {
                // Filter appointments by doctor name
                const filteredAppointments = data.content.filter(appointment => 
                    appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                if (filteredAppointments.length > 0) {
                    filteredAppointments.forEach(appointment => {
                        const appointmentDate = new Date(appointment.appointmentDate + 'T' + appointment.appointmentTime);
                        const formattedDate = appointmentDate.toLocaleDateString();
                        const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        const appointmentItem = document.createElement('div');
                        appointmentItem.className = 'appointment-item';
                        
                        // Determine available actions based on appointment status
                        let actions = `
                            <button class="action-btn view" title="View Details" onclick="viewAppointmentDetails(${appointment.appointmentId})">
                                <i class="fas fa-eye"></i>
                            </button>
                        `;
                        
                        if (appointment.appointmentStatus === 'CONFIRMED' || appointment.appointmentStatus === 'PENDING') {
                            actions += `
                                <button class="action-btn cancel" title="Cancel Appointment" onclick="showCancelConfirmation(${appointment.appointmentId})">
                                    <i class="fas fa-times"></i>
                                </button>
                            `;
                        }
                        
                        if (appointment.appointmentStatus === 'COMPLETED') {
                            actions += `
                                <button class="action-btn review" title="Review Doctor" onclick="showReviewForm(${appointment.appointmentId}, ${appointment.doctorId}, '${appointment.doctorName}')">
                                    <i class="fas fa-star"></i>
                                </button>
                            `;
                        }
                        
                        appointmentItem.innerHTML = `
                            <div class="appointment-left">
                                <img src="/placeholder.svg?height=80&width=80" alt="Doctor" class="doctor-image">
                                <div class="appointment-details">
                                    <h3>Dr. ${appointment.doctorName}</h3>
                                    <div class="appointment-speciality">${appointment.doctorSpecialization}</div>
                                    <div class="appointment-meta">
                                        <div class="meta-item">
                                            <i class="far fa-calendar-alt"></i> ${formattedDate}
                                        </div>
                                        <div class="meta-item">
                                            <i class="far fa-clock"></i> ${formattedTime}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="appointment-right">
                                <div class="appointment-status status-${appointment.appointmentStatus.toLowerCase()}">${appointment.appointmentStatus}</div>
                                <div class="appointment-actions">
                                    ${actions}
                                </div>
                            </div>
                        `;
                        
                        appointmentsContainer.appendChild(appointmentItem);
                    });
                } else {
                    appointmentsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <p>No appointments found matching "${searchTerm}"</p>
                            <button class="btn btn-outline" onclick="resetSearch()">Clear Search</button>
                        </div>
                    `;
                }
                
                // Hide pagination for search results
                paginationContainer.innerHTML = '';
            } else {
                appointmentsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="far fa-calendar-times"></i>
                        <p>No appointments found</p>
                        <button class="btn btn-outline" onclick="resetSearch()">Clear Search</button>
                    </div>
                `;
                paginationContainer.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error searching appointments:', error);
            appointmentsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to search appointments</p>
                    <button class="btn btn-primary" onclick="searchAppointments('${searchTerm}')">Try Again</button>
                </div>
            `;
            paginationContainer.innerHTML = '';
        });
}

function resetSearch() {
    document.getElementById('search-appointments').value = '';
    const activeFilter = document.querySelector('.filter-tab.active').getAttribute('data-filter');
    loadAppointments(activeFilter);
}

function viewAppointmentDetails(appointmentId) {
    const detailsModal = document.getElementById('appointment-details-modal');
    const detailsContent = document.getElementById('appointment-details-content');
    const cancelBtn = document.getElementById('cancel-appointment-btn');
    
    // Show loading state
    detailsContent.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading appointment details...</p>
        </div>
    `;
    
    detailsModal.classList.add('active');
    
    fetch(`http://localhost:8080/api/v1/appointments/${appointmentId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load appointment details');
            }
            return response.json();
        })
        .then(appointment => {
            const appointmentDate = new Date(appointment.appointmentDate + 'T' + appointment.appointmentTime);
            const formattedDate = appointmentDate.toLocaleDateString();
            const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            detailsContent.innerHTML = `
                <div class="appointment-detail-row">
                    <div class="detail-label">Doctor</div>
                    <div class="detail-value">Dr. ${appointment.doctorName}</div>
                </div>
                <div class="appointment-detail-row">
                    <div class="detail-label">Specialization</div>
                    <div class="detail-value">${appointment.doctorSpecialization}</div>
                </div>
                <div class="appointment-detail-row">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formattedDate}</div>
                </div>
                <div class="appointment-detail-row">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${formattedTime}</div>
                </div>
                <div class="appointment-detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="appointment-status status-${appointment.appointmentStatus.toLowerCase()}">${appointment.appointmentStatus}</span>
                    </div>
                </div>
                <div class="appointment-detail-row">
                    <div class="detail-label">Payment Status</div>
                    <div class="detail-value">${appointment.paymentStatus}</div>
                </div>
            `;
            
            // Set appointment ID for cancel button
            cancelBtn.setAttribute('data-appointment-id', appointmentId);
            
            // Show/hide cancel button based on appointment status
            if (appointment.appointmentStatus === 'CONFIRMED' || appointment.appointmentStatus === 'PENDING') {
                cancelBtn.style.display = 'block';
            } else {
                cancelBtn.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error loading appointment details:', error);
            detailsContent.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load appointment details</p>
                    <button class="btn btn-primary" onclick="viewAppointmentDetails(${appointmentId})">Try Again</button>
                </div>
            `;
        });
}

function showCancelConfirmation(appointmentId) {
    const confirmModal = document.getElementById('confirm-cancel-modal');
    document.getElementById('confirm-cancel-btn').setAttribute('data-appointment-id', appointmentId);
    confirmModal.classList.add('active');
}

function cancelAppointment(appointmentId) {
    const confirmModal = document.getElementById('confirm-cancel-modal');
    const confirmBtn = document.getElementById('confirm-cancel-btn');
    
    // Disable button and show loading state
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
    
    fetch(`http://localhost:8080/api/v1/appointments/${appointmentId}/cancel`, {
        method: 'PUT'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to cancel appointment');
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        confirmModal.classList.remove('active');
        
        // Show success message (you could add a toast notification here)
        alert('Appointment cancelled successfully');
        
        // Reload appointments
        const activeFilter = document.querySelector('.filter-tab.active').getAttribute('data-filter');
        loadAppointments(activeFilter);
    })
    .catch(error => {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel appointment. Please try again.');
    })
    .finally(() => {
        // Reset button state
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = 'Yes, Cancel Appointment';
    });
}

function showReviewForm(appointmentId, doctorId, doctorName) {
    const reviewModal = document.getElementById('review-doctor-modal');
    const doctorNameElement = document.getElementById('review-doctor-name');
    const submitBtn = document.getElementById('submit-review-btn');
    
    // Reset form
    document.getElementById('review-form').reset();
    document.getElementById('review-status-message').textContent = '';
    document.getElementById('review-status-message').className = 'status-message';
    
    // Reset rating stars
    const ratingStars = document.querySelectorAll('.rating-stars i');
    ratingStars.forEach(star => star.classList.remove('active'));
    
    // Set doctor name and IDs
    doctorNameElement.textContent = 'Dr. ' + doctorName;
    submitBtn.setAttribute('data-appointment-id', appointmentId);
    submitBtn.setAttribute('data-doctor-id', doctorId);
    
    // Show modal
    reviewModal.classList.add('active');
}

function submitReview(appointmentId, doctorId, rating, comment) {
    const reviewModal = document.getElementById('review-doctor-modal');
    const submitBtn = document.getElementById('submit-review-btn');
    const userId = localStorage.getItem('userId');
    
    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    // Create review data
    const reviewData = {
        appointmentId: appointmentId,
        doctorId: doctorId,
        patientId: userId, // In a real app, you'd get the patient ID from the appointment
        rating: parseInt(rating),
        comment: comment
    };
    
    fetch('http://localhost:8080/api/v1/reviews', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to submit review');
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showMessage('Review submitted successfully!', 'success', 'review-status-message');
        
        // Close modal after a delay
        setTimeout(() => {
            reviewModal.classList.remove('active');
            
            // Reload appointments
            const activeFilter = document.querySelector('.filter-tab.active').getAttribute('data-filter');
            loadAppointments(activeFilter);
        }, 2000);
    })
    .catch(error => {
        console.error('Error submitting review:', error);
        showMessage('Failed to submit review. Please try again.', 'error', 'review-status-message');
    })
    .finally(() => {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Review';
    });
}

function showMessage(message, type, elementId) {
    const statusMessage = document.getElementById(elementId);
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    statusMessage.classList.add(type);
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