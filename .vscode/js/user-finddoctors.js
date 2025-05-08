document.addEventListener('DOMContentLoaded', function() {
    // Initialize user menu dropdown
    initUserMenu();
    
    // Load specialties for filter
    loadSpecialties();
    
    // Load locations for filter (client-side only)
    loadLocations();
    
    // Load doctors (initial load)
    loadDoctors();
    
    // Initialize search functionality
    initSearch();
    
    // Initialize filter functionality
    initFilters();
    
    // Initialize sort functionality
    initSort();
    
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
    const userProfileImage = localStorage.getItem('userProfileImage') || '/placeholder.svg?height=40&width=40';
    
    document.getElementById('user-name').textContent = userName;
    
    const headerProfileImage = document.getElementById('header-profile-image');
    headerProfileImage.src = userProfileImage;
    headerProfileImage.onerror = function() {
        this.src = '/placeholder.svg?height=40&width=40';
    };
}

function loadSpecialties() {
    const specialtyFilter = document.getElementById('specialty-filter');
    
    fetch('http://localhost:8081/api/v1/specialties')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load specialties');
            }
            return response.json();
        })
        .then(specialties => {
            specialties.forEach(specialty => {
                const option = document.createElement('option');
                option.value = specialty.id;
                option.textContent = specialty.name;
                specialtyFilter.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading specialties:', error);
        });
}

function loadLocations() {
    const locationFilter = document.getElementById('location-filter');
    
    // Client-side only locations since backend doesn't support location filtering
    const locations = [
        { id: 'new_york', name: 'New York' },
        { id: 'los_angeles', name: 'Los Angeles' },
        { id: 'chicago', name: 'Chicago' },
        { id: 'houston', name: 'Houston' },
        { id: 'phoenix', name: 'Phoenix' }
    ];
    
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        locationFilter.appendChild(option);
    });
}

function loadDoctors(page = 0, filters = {}, sort = 'fullName,asc', searchTerm = '') {
    const doctorsContainer = document.getElementById('doctors-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    // Show loading spinner
    doctorsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading doctors...</p>
        </div>
    `;
    
    // Build query parameters for the existing endpoint
    let queryParams = `page=${page}&size=9`;
    
    // Add sort parameter (using backend-compatible format)
    if (sort) {
        queryParams += `&sort=${sort}`;
    }
    
    // Map search term to speciality parameter (backend expects 'speciality')
    if (searchTerm) {
        queryParams += `&speciality=${encodeURIComponent(searchTerm)}`;
    }
    
    // Only specialty filter is supported by backend
    if (filters.specialty) {
        queryParams += `&specialityId=${filters.specialty}`;
    }
    
    // Note: Other filters (location, availability, gender, rating) are ignored
    
    fetch(`http://localhost:8081/api/v1/doctors/search?${queryParams}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load doctors');
            }
            return response.json();
        })
        .then(data => {
            doctorsContainer.innerHTML = '';
            
            if (data.content && data.content.length > 0) {
                data.content.forEach(doctor => {
                    const doctorCard = createDoctorCard(doctor);
                    doctorsContainer.appendChild(doctorCard);
                });
                
                // Create pagination
                createPagination(data, page, filters, sort, searchTerm);
            } else {
                doctorsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-md"></i>
                        <p>No doctors found matching your criteria</p>
                        <button class="btn btn-primary" onclick="resetFilters()">Clear Filters</button>
                    </div>
                `;
                paginationContainer.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error loading doctors:', error);
            doctorsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load doctors</p>
                    <button class="btn btn-primary" onclick="loadDoctors()">Try Again</button>
                </div>
            `;
            paginationContainer.innerHTML = '';
        });
}

function createDoctorCard(doctor) {
    const doctorCard = document.createElement('div');
    doctorCard.className = 'doctor-card';
    
    // Generate rating stars
    let ratingStars = '';
    const rating = doctor.rating || 0;
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            ratingStars += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            ratingStars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            ratingStars += '<i class="far fa-star"></i>';
        }
    }
    
    doctorCard.innerHTML = `
        <div class="doctor-image">
            <img src="${doctor.profileImage || '/placeholder.svg?height=200&width=200'}" alt="Dr. ${doctor.fullName}" onerror="this.src='/placeholder.svg?height=200&width=200'">
        </div>
        <div class="doctor-info">
            <h3 class="doctor-name">Dr. ${doctor.fullName}</h3>
            <div class="doctor-specialty">${doctor.specialization || 'General Practitioner'}</div>
            <div class="doctor-meta">
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i> ${doctor.address || 'Not specified'}
                </div>
                <div class="meta-item">
                    <i class="fas fa-briefcase"></i> ${doctor.experienceYears || '0'} years
                </div>
            </div>
            <div class="doctor-rating">
                <div class="rating-stars">${ratingStars}</div>
                <div class="rating-count">(${doctor.reviewCount || '0'} reviews)</div>
            </div>
            <div class="doctor-footer">
                <div class="consultation-fee">
                    Fee: <span class="fee-amount">&#8377;${doctor.fees || '50'}</span>
                </div>
                <div class="doctor-actions">
                    <button class="btn btn-sm btn-outline" onclick="viewDoctorDetails(${doctor.id})">View Profile</button>
                    <button class="btn btn-sm btn-primary" onclick="bookAppointment(${doctor.id})">Book Now</button>
                </div>
            </div>
        </div>
    `;
    
    return doctorCard;
}

function createPagination(data, currentPage, filters, sort, searchTerm) {
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
        prevButton.addEventListener('click', () => loadDoctors(currentPage - 1, filters, sort, searchTerm));
    }
    paginationContainer.appendChild(prevButton);
    
    // Page numbers
    for (let i = 0; i < data.totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i + 1;
        pageButton.addEventListener('click', () => loadDoctors(i, filters, sort, searchTerm));
        paginationContainer.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = `page-item ${data.last ? 'disabled' : ''}`;
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    if (!data.last) {
        nextButton.addEventListener('click', () => loadDoctors(currentPage + 1, filters, sort, searchTerm));
    }
    paginationContainer.appendChild(nextButton);
}

function initSearch() {
    const searchInput = document.getElementById('doctor-search');
    const searchBtn = document.getElementById('search-btn');
    
    // Search on button click
    searchBtn.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        loadDoctors(0, getFilters(), getSort(), searchTerm);
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchBtn.click();
        }
    });
}

function initFilters() {
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    // Apply filters (only specialty will affect the backend call)
    applyFiltersBtn.addEventListener('click', function() {
        loadDoctors(0, getFilters(), getSort(), document.getElementById('doctor-search').value.trim());
    });
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', function() {
        resetFilters();
    });
}

function getFilters() {
    // Only specialty filter is supported by backend
    return {
        specialty: document.getElementById('specialty-filter').value
        // Other filters are ignored:
        // location: document.getElementById('location-filter').value,
        // availability: document.getElementById('availability-filter').value,
        // gender: document.getElementById('gender-filter').value,
        // rating: document.getElementById('rating-filter').value
    };
}

function resetFilters() {
    document.getElementById('specialty-filter').value = '';
    document.getElementById('location-filter').value = '';
    document.getElementById('availability-filter').value = '';
    document.getElementById('gender-filter').value = '';
    document.getElementById('rating-filter').value = '';
    document.getElementById('doctor-search').value = '';
    
    // Reload doctors with no filters
    loadDoctors();
}

function initSort() {
    const sortSelect = document.getElementById('sort-by');
    
    // Update options to match what backend can handle
    sortSelect.innerHTML = `
        <option value="fullName,asc">Name (A-Z)</option>
        <option value="fullName,desc">Name (Z-A)</option>
        <option value="rating,desc">Highest Rated</option>
        <option value="rating,asc">Lowest Rated</option>
        <option value="experience,desc">Most Experienced</option>
        <option value="consultationFee,asc">Lowest Fee</option>
        <option value="consultationFee,desc">Highest Fee</option>
    `;
    
    sortSelect.addEventListener('change', function() {
        loadDoctors(0, getFilters(), this.value, document.getElementById('doctor-search').value.trim());
    });
}

function getSort() {
    return document.getElementById('sort-by').value;
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
    
    // Book appointment button in doctor details modal
    document.getElementById('book-appointment-btn').addEventListener('click', function() {
        const doctorId = this.getAttribute('data-doctor-id');
        bookAppointment(doctorId);
    });
}

function viewDoctorDetails(doctorId) {
    const detailsModal = document.getElementById('doctor-details-modal');
    const detailsContent = document.getElementById('doctor-details-content');
    const bookBtn = document.getElementById('book-appointment-btn');
    
    // Show loading state
    detailsContent.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading doctor details...</p>
        </div>
    `;
    
    detailsModal.classList.add('active');
    
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load doctor details');
            }
            return response.json();
        })
        .then(doctor => {
            // Generate rating stars
            let ratingStars = '';
            const rating = doctor.rating || 0;
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(rating)) {
                    ratingStars += '<i class="fas fa-star"></i>';
                } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                    ratingStars += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    ratingStars += '<i class="far fa-star"></i>';
                }
            }
            
            // Generate schedule days (client-side only)
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const today = new Date();
            let scheduleHtml = '<div class="schedule-days">';
            
            days.forEach((day, index) => {
                const date = new Date(today);
                date.setDate(today.getDate() + ((index - today.getDay() + 7) % 7));
                const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                scheduleHtml += `
                    <div class="day-item ${index === 0 ? 'active' : ''}" data-day="${day.toLowerCase()}">
                        <div class="day-name">${day.substring(0, 3)}</div>
                        <div class="day-date">${formattedDate}</div>
                    </div>
                `;
            });
            
            scheduleHtml += '</div>';
            
            // Generate time slots (client-side only)
            scheduleHtml += '<div class="time-slots">';
            const timeSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
                              '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'];
            
            timeSlots.forEach((slot, index) => {
                const isBooked = index === 2 || index === 5 || index === 8;
                scheduleHtml += `
                    <div class="time-slot ${isBooked ? 'disabled' : ''}" ${isBooked ? '' : 'data-time="' + slot + '"'}>
                        ${slot}
                    </div>
                `;
            });
            
            scheduleHtml += '</div>';
            
            detailsContent.innerHTML = `
                <div class="doctor-profile">
                    <img src="${doctor.profileImage || '/placeholder.svg?height=150&width=150'}" alt="Dr. ${doctor.fullName}" class="doctor-profile-image" onerror="this.src='/placeholder.svg?height=150&width=150'">
                    <div class="doctor-profile-info">
                        <h3 class="doctor-profile-name">Dr. ${doctor.fullName}</h3>
                        <div class="doctor-profile-specialty">${doctor.specialization || 'General Practitioner'}</div>
                        <div class="doctor-profile-meta">
                            <div class="meta-item">
                                <i class="fas fa-map-marker-alt"></i> ${doctor.location || 'Not specified'}
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-briefcase"></i> ${doctor.experience || '0'} years experience
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-user-md"></i> ${doctor.gender || 'Not specified'}
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-language"></i> English, Spanish
                            </div>
                        </div>
                        <div class="doctor-rating">
                            <div class="rating-stars">${ratingStars}</div>
                            <div class="rating-count">(${doctor.reviewCount || '0'} reviews)</div>
                        </div>
                        <div class="consultation-fee">
                            Consultation Fee: <span class="fee-amount">$${doctor.consultationFee || '50'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="doctor-tabs">
                    <div class="tab-buttons">
                        <button class="tab-button active" data-tab="about">About</button>
                        <button class="tab-button" data-tab="schedule">Schedule</button>
                        <button class="tab-button" data-tab="reviews">Reviews</button>
                    </div>
                    
                    <div id="about-tab" class="tab-content active">
                        <div class="doctor-bio">
                            <h4>About Dr. ${doctor.fullName}</h4>
                            <p>${doctor.bio || 'No biography available for this doctor.'}</p>
                        </div>
                        
                        <div class="doctor-education">
                            <h4>Education</h4>
                            <div class="education-item">
                                <div class="education-degree">MD in ${doctor.specialization || 'Medicine'}</div>
                                <div class="education-institution">Harvard Medical School</div>
                                <div class="education-year">2010 - 2014</div>
                            </div>
                            <div class="education-item">
                                <div class="education-degree">Residency in ${doctor.specialization || 'Medicine'}</div>
                                <div class="education-institution">Johns Hopkins Hospital</div>
                                <div class="education-year">2014 - 2018</div>
                            </div>
                        </div>
                        
                        <div class="doctor-experience">
                            <h4>Experience</h4>
                            <div class="experience-item">
                                <div class="experience-position">Senior ${doctor.specialization || 'Doctor'}</div>
                                <div class="experience-hospital">Mayo Clinic</div>
                                <div class="experience-period">2018 - Present</div>
                            </div>
                            <div class="experience-item">
                                <div class="experience-position">Consultant ${doctor.specialization || 'Doctor'}</div>
                                <div class="experience-hospital">Cleveland Clinic</div>
                                <div class="experience-period">2016 - 2018</div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="schedule-tab" class="tab-content">
                        <div class="doctor-schedule">
                            <h4>Available Time Slots</h4>
                            ${scheduleHtml}
                        </div>
                    </div>
                    
                    <div id="reviews-tab" class="tab-content">
                        <div class="doctor-reviews">
                            <h4>Patient Reviews</h4>
                            <div class="review-item">
                                <div class="review-header">
                                    <div class="reviewer-name">John Doe</div>
                                    <div class="review-date">2 months ago</div>
                                </div>
                                <div class="review-rating">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </div>
                                <div class="review-text">
                                    Dr. ${doctor.fullName} was very professional and knowledgeable. The consultation was thorough and I felt well taken care of.
                                </div>
                            </div>
                            <div class="review-item">
                                <div class="review-header">
                                    <div class="reviewer-name">Jane Smith</div>
                                    <div class="review-date">3 months ago</div>
                                </div>
                                <div class="review-rating">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="far fa-star"></i>
                                </div>
                                <div class="review-text">
                                    Great doctor, but had to wait a bit longer than expected for my appointment. Otherwise, the treatment was excellent.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Initialize tabs
            initTabs();
            
            // Initialize schedule day selection
            initScheduleDays();
            
            // Initialize time slot selection
            initTimeSlots();
            
            // Set doctor ID for book appointment button
            bookBtn.setAttribute('data-doctor-id', doctorId);
        })
        .catch(error => {
            console.error('Error loading doctor details:', error);
            detailsContent.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load doctor details</p>
                    <button class="btn btn-primary" onclick="viewDoctorDetails(${doctorId})">Try Again</button>
                </div>
            `;
        });
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function initScheduleDays() {
    const dayItems = document.querySelectorAll('.day-item');
    
    dayItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all days
            dayItems.forEach(day => day.classList.remove('active'));
            
            // Add active class to clicked day
            this.classList.add('active');
        });
    });
}

function initTimeSlots() {
    const timeSlots = document.querySelectorAll('.time-slot:not(.disabled)');
    
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            // Remove active class from all time slots
            timeSlots.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked time slot
            this.classList.add('active');
        });
    });
}

function bookAppointment(doctorId) {
    window.location.href = `book-appointment.html?doctorId=${doctorId}`;
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