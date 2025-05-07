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
    
    // Initialize weekly schedule
    initializeWeeklySchedule();
    
    // Initialize holidays
    initializeHolidays();
    
    // Initialize date overrides
    initializeDateOverrides();
    
    // Initialize time slots
    initializeTimeSlots();
    
    // Initialize modals
    initializeModals();
    
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
            // Update doctor info
            document.getElementById('doctor-specialization').textContent = data.specialization || 'Specialist';
            
            if (data.profileImage) {
                document.getElementById('doctor-avatar').src = data.profileImage;
            }
        })
        .catch(error => {
            console.error('Error loading doctor profile:', error);
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

// Initialize weekly schedule
function initializeWeeklySchedule() {
    const doctorId = localStorage.getItem('doctorId');
    const saveButton = document.getElementById('save-schedule');
    
    // Initialize day toggles
    const dayToggles = document.querySelectorAll('.schedule-day input[type="checkbox"]');
    
    dayToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const day = this.id.split('-')[0];
            const hoursContainer = document.getElementById(`${day}-hours`);
            
            if (this.checked) {
                hoursContainer.style.display = 'block';
            } else {
                hoursContainer.style.display = 'none';
            }
        });
    });
    
    // Load current schedule
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/schedule`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load schedule');
            }
            return response.json();
        })
        .then(schedule => {
            // Update schedule form
            if (schedule && schedule.weeklySchedule) {
                const weeklySchedule = schedule.weeklySchedule;
                
                // Update each day
                Object.keys(weeklySchedule).forEach(day => {
                    const daySchedule = weeklySchedule[day];
                    const dayToggle = document.getElementById(`${day.toLowerCase()}-toggle`);
                    const startTime = document.getElementById(`${day.toLowerCase()}-start`);
                    const endTime = document.getElementById(`${day.toLowerCase()}-end`);
                    
                    if (daySchedule.available) {
                        dayToggle.checked = true;
                        document.getElementById(`${day.toLowerCase()}-hours`).style.display = 'block';
                    } else {
                        dayToggle.checked = false;
                        document.getElementById(`${day.toLowerCase()}-hours`).style.display = 'none';
                    }
                    
                    if (daySchedule.startTime) {
                        startTime.value = daySchedule.startTime;
                    }
                    
                    if (daySchedule.endTime) {
                        endTime.value = daySchedule.endTime;
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error loading schedule:', error);
            alert('Failed to load schedule. Please try again.');
        });
    
    // Save schedule
    saveButton.addEventListener('click', function() {
        const doctorId = localStorage.getItem('doctorId');
        
        // Collect schedule data
        const weeklySchedule = {
            MONDAY: {
                available: document.getElementById('monday-toggle').checked,
                startTime: document.getElementById('monday-start').value,
                endTime: document.getElementById('monday-end').value
            },
            TUESDAY: {
                available: document.getElementById('tuesday-toggle').checked,
                startTime: document.getElementById('tuesday-start').value,
                endTime: document.getElementById('tuesday-end').value
            },
            WEDNESDAY: {
                available: document.getElementById('wednesday-toggle').checked,
                startTime: document.getElementById('wednesday-start').value,
                endTime: document.getElementById('wednesday-end').value
            },
            THURSDAY: {
                available: document.getElementById('thursday-toggle').checked,
                startTime: document.getElementById('thursday-start').value,
                endTime: document.getElementById('thursday-end').value
            },
            FRIDAY: {
                available: document.getElementById('friday-toggle').checked,
                startTime: document.getElementById('friday-start').value,
                endTime: document.getElementById('friday-end').value
            },
            SATURDAY: {
                available: document.getElementById('saturday-toggle').checked,
                startTime: document.getElementById('saturday-start').value,
                endTime: document.getElementById('saturday-end').value
            },
            SUNDAY: {
                available: document.getElementById('sunday-toggle').checked,
                startTime: document.getElementById('sunday-start').value,
                endTime: document.getElementById('sunday-end').value
            }
        };
        
        // Validate schedule
        for (const day in weeklySchedule) {
            if (weeklySchedule[day].available) {
                const startTime = weeklySchedule[day].startTime;
                const endTime = weeklySchedule[day].endTime;
                
                if (!startTime || !endTime) {
                    alert(`Please set both start and end time for ${day.charAt(0) + day.slice(1).toLowerCase()}`);
                    return;
                }
                
                if (startTime >= endTime) {
                    alert(`End time must be after start time for ${day.charAt(0) + day.slice(1).toLowerCase()}`);
                    return;
                }
            }
        }
        
        // Create schedule object
        const schedule = {
            doctorId,
            weeklySchedule
        };
        
        // Call API to save schedule
        fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/schedule`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(schedule)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save schedule');
            }
            return response.json();
        })
        .then(data => {
            alert('Schedule saved successfully');
        })
        .catch(error => {
            console.error('Error saving schedule:', error);
            alert('Failed to save schedule. Please try again.');
        });
    });
}

// Initialize holidays
function initializeHolidays() {
    const doctorId = localStorage.getItem('doctorId');
    const markTodayButton = document.getElementById('mark-today');
    const addHolidayButton = document.getElementById('add-holiday');
    
    // Load holidays
    loadHolidays();
    
    // Mark today as holiday
    markTodayButton.addEventListener('click', function() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        
        document.getElementById('holiday-date').value = formattedDate;
        document.getElementById('holiday-reason').value = 'Personal leave';
        document.getElementById('holiday-modal').style.display = 'block';
    });
    
    // Add holiday button
    addHolidayButton.addEventListener('click', function() {
        document.getElementById('holiday-form').reset();
        document.getElementById('holiday-modal').style.display = 'block';
    });
    
    // Holiday form submission
    document.getElementById('holiday-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const date = document.getElementById('holiday-date').value;
        const reason = document.getElementById('holiday-reason').value;
        
        // Create holiday object
        const holiday = {
            doctorId,
            date,
            reason
        };
        
        // Call API to add holiday
        fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/holidays`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(holiday)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add holiday');
            }
            return response.json();
        })
        .then(data => {
            alert('Holiday added successfully');
            document.getElementById('holiday-modal').style.display = 'none';
            loadHolidays();
        })
        .catch(error => {
            console.error('Error adding holiday:', error);
            alert('Failed to add holiday. Please try again.');
        });
    });
}

// Load holidays
function loadHolidays() {
    const doctorId = localStorage.getItem('doctorId');
    const tableBody = document.querySelector('#holidays-table tbody');
    
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading holidays...</td></tr>';
    
    // Call API to get holidays
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/holidays`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load holidays');
            }
            return response.json();
        })
        .then(holidays => {
            // Clear loading row
            tableBody.innerHTML = '';
            
            if (!holidays || holidays.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No holidays found</td></tr>';
                return;
            }
            
            // Sort holidays by date (most recent first)
            holidays.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            });
            
            holidays.forEach(holiday => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(holiday.date);
                const formattedDate = date.toLocaleDateString();
                
                // Get day of week
                const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
                
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${dayOfWeek}</td>
                    <td>${holiday.reason || 'N/A'}</td>
                    <td>
                        <button class="action-button danger delete-holiday" data-id="${holiday.holidayId}">Delete</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-holiday').forEach(button => {
                button.addEventListener('click', function() {
                    const holidayId = this.getAttribute('data-id');
                    deleteHoliday(holidayId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading holidays:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading holidays. Please try again.</td></tr>';
        });
}

// Delete holiday
function deleteHoliday(holidayId) {
    if (!confirm('Are you sure you want to delete this holiday?')) {
        return;
    }
    
    const doctorId = localStorage.getItem('doctorId');
    
    // Call API to delete holiday
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/holidays/${holidayId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete holiday');
        }
        return response.json();
    })
    .then(data => {
        alert('Holiday deleted successfully');
        loadHolidays();
    })
    .catch(error => {
        console.error('Error deleting holiday:', error);
        alert('Failed to delete holiday. Please try again.');
    });
}

// Initialize date overrides
function initializeDateOverrides() {
    const doctorId = localStorage.getItem('doctorId');
    const addOverrideButton = document.getElementById('add-override');
    
    // Load date overrides
    loadDateOverrides();
    
    // Add override button
    addOverrideButton.addEventListener('click', function() {
        document.getElementById('override-form').reset();
        document.getElementById('override-modal').style.display = 'block';
        
        // Show/hide hours based on status
        document.getElementById('override-status').value = 'available';
        document.getElementById('override-hours').style.display = 'block';
    });
    
    // Override status change
    document.getElementById('override-status').addEventListener('change', function() {
        const hoursContainer = document.getElementById('override-hours');
        
        if (this.value === 'available') {
            hoursContainer.style.display = 'block';
        } else {
            hoursContainer.style.display = 'none';
        }
    });
    
    // Override form submission
    document.getElementById('override-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const date = document.getElementById('override-date').value;
        const status = document.getElementById('override-status').value;
        let startTime = null;
        let endTime = null;
        
        if (status === 'available') {
            startTime = document.getElementById('override-start').value;
            endTime = document.getElementById('override-end').value;
            
            // Validate times
            if (!startTime || !endTime) {
                alert('Please set both start and end time');
                return;
            }
            
            if (startTime >= endTime) {
                alert('End time must be after start time');
                return;
            }
        }
        
        // Create override object
        const override = {
            doctorId,
            date,
            available: status === 'available',
            startTime,
            endTime
        };
        
        // Call API to add override
        fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/overrides`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(override)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add date override');
            }
            return response.json();
        })
        .then(data => {
            alert('Date override added successfully');
            document.getElementById('override-modal').style.display = 'none';
            loadDateOverrides();
        })
        .catch(error => {
            console.error('Error adding date override:', error);
            alert('Failed to add date override. Please try again.');
        });
    });
}

// Load date overrides
function loadDateOverrides() {
    const doctorId = localStorage.getItem('doctorId');
    const tableBody = document.querySelector('#overrides-table tbody');
    
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading date overrides...</td></tr>';
    
    // Call API to get date overrides
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/overrides`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load date overrides');
            }
            return response.json();
        })
        .then(overrides => {
            // Clear loading row
            tableBody.innerHTML = '';
            
            if (!overrides || overrides.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No date overrides found</td></tr>';
                return;
            }
            
            // Sort overrides by date (most recent first)
            overrides.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            });
            
            overrides.forEach(override => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(override.date);
                const formattedDate = date.toLocaleDateString();
                
                // Format hours
                let hours = 'N/A';
                if (override.available && override.startTime && override.endTime) {
                    hours = `${formatTime(override.startTime)} - ${formatTime(override.endTime)}`;
                }
                
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td><span class="status-badge ${override.available ? 'confirmed' : 'cancelled'}">${override.available ? 'Available' : 'Unavailable'}</span></td>
                    <td>${hours}</td>
                    <td>
                        <button class="action-button danger delete-override" data-id="${override.overrideId}">Delete</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-override').forEach(button => {
                button.addEventListener('click', function() {
                    const overrideId = this.getAttribute('data-id');
                    deleteOverride(overrideId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading date overrides:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading date overrides. Please try again.</td></tr>';
        });
}

// Delete override
function deleteOverride(overrideId) {
    if (!confirm('Are you sure you want to delete this date override?')) {
        return;
    }
    
    const doctorId = localStorage.getItem('doctorId');
    
    // Call API to delete override
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/overrides/${overrideId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete date override');
        }
        return response.json();
    })
    .then(data => {
        alert('Date override deleted successfully');
        loadDateOverrides();
    })
    .catch(error => {
        console.error('Error deleting date override:', error);
        alert('Failed to delete date override. Please try again.');
    });
}

// Initialize time slots
function initializeTimeSlots() {
    const doctorId = localStorage.getItem('doctorId');
    const updateDurationButton = document.getElementById('update-duration');
    const generateSlotsButton = document.getElementById('generate-slots');
    
    // Initialize calendar
    initializeSlotCalendar();
    
    // Update duration button
    updateDurationButton.addEventListener('click', function() {
        const slotDuration = document.getElementById('slot-duration').value;
        
        if (!slotDuration || slotDuration < 5) {
            alert('Please enter a valid slot duration (minimum 5 minutes)');
            return;
        }
        
        // Call API to update slot duration
        fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/slot-duration`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ slotDurationMinutes: slotDuration })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update slot duration');
            }
            return response.json();
        })
        .then(data => {
            alert('Slot duration updated successfully');
        })
        .catch(error => {
            console.error('Error updating slot duration:', error);
            alert('Failed to update slot duration. Please try again.');
        });
    });
    
    // Generate slots button
    generateSlotsButton.addEventListener('click', function() {
        const slotDuration = document.getElementById('slot-duration').value;
        
        if (!slotDuration || slotDuration < 5) {
            alert('Please enter a valid slot duration (minimum 5 minutes)');
            return;
        }
        
        // Call API to generate slots
        fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/generate-slots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ slotDurationMinutes: slotDuration })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to generate time slots');
            }
            return response.json();
        })
        .then(data => {
            alert('Time slots generated successfully');
            // Refresh calendar
            initializeSlotCalendar();
        })
        .catch(error => {
            console.error('Error generating time slots:', error);
            alert('Failed to generate time slots. Please try again.');
        });
    });
}

// Initialize slot calendar
function initializeSlotCalendar() {
    const calendarGrid = document.getElementById('slot-calendar-grid');
    const calendarMonth = document.getElementById('calendar-month');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    
    // Get current date
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Render calendar
    renderCalendar(currentMonth, currentYear);
    
    // Previous month button
    prevMonthButton.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });
    
    // Next month button
    nextMonthButton.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });
    
    // Render calendar function
    function renderCalendar(month, year) {
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        calendarMonth.textContent = `${monthNames[month]} ${year}`;
        
        // Clear calendar
        calendarGrid.innerHTML = '';
        
        // Add day names
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day-name';
            dayElement.textContent = day;
            calendarGrid.appendChild(dayElement);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day disabled';
            calendarGrid.appendChild(emptyCell);
        }
        
        // Add days of month
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = i;
            
            // Check if day is today
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            // Check if day is in the past
            const dayDate = new Date(year, month, i);
            if (dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                dayElement.classList.add('disabled');
            } else {
                // Add click event to view slots
                dayElement.addEventListener('click', function() {
                    // Remove selected class from all days
                    document.querySelectorAll('.calendar-day').forEach(day => {
                        day.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked day
                    this.classList.add('selected');
                    
                    // Load slots for this day
                    const selectedDate = new Date(year, month, i);
                    loadDaySlots(selectedDate);
                });
            }
            
            calendarGrid.appendChild(dayElement);
        }
        
        // Add empty cells for days after last day of month
        const totalCells = firstDay + daysInMonth;
        const emptyCellsAfter = 7 - (totalCells % 7);
        if (emptyCellsAfter < 7) {
            for (let i = 0; i < emptyCellsAfter; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day disabled';
                calendarGrid.appendChild(emptyCell);
            }
        }
        
        // Load slots for current month to mark days with slots
        loadMonthSlots(month, year);
    }
}

// Load month slots
function loadMonthSlots(month, year) {
    const doctorId = localStorage.getItem('doctorId');
    
    // Format dates for API request
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    // Call API to get slots for month
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/slots?startDate=${startDate}&endDate=${endDate}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load month slots');
            }
            return response.json();
        })
        .then(data => {
            // Group slots by date
            const slotsByDate = {};
            
            data.forEach(slot => {
                const date = slot.date.split('T')[0];
                if (!slotsByDate[date]) {
                    slotsByDate[date] = [];
                }
                slotsByDate[date].push(slot);
            });
            
            // Mark days with slots
            Object.keys(slotsByDate).forEach(date => {
                const day = new Date(date).getDate();
                const calendarDays = document.querySelectorAll('.calendar-day:not(.disabled)');
                
                calendarDays.forEach(dayElement => {
                    if (parseInt(dayElement.textContent) === day) {
                        dayElement.classList.add('has-slots');
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error loading month slots:', error);
        });
}

// Load day slots
function loadDaySlots(date) {
    const doctorId = localStorage.getItem('doctorId');
    const slotsContainer = document.getElementById('slots-container');
    const selectedDate = document.getElementById('selected-date');
    
    // Format date
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    selectedDate.textContent = formattedDate;
    
    // Show loading state
    slotsContainer.innerHTML = '<p class="text-center">Loading time slots...</p>';
    
    // Format date for API request
    const apiDate = date.toISOString().split('T')[0];
    
    // Call API to get slots for day
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/slots/${apiDate}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load day slots');
            }
            return response.json();
        })
        .then(slots => {
            // Clear loading message
            slotsContainer.innerHTML = '';
            
            if (!slots || slots.length === 0) {
                slotsContainer.innerHTML = '<p class="text-center">No time slots available for this day</p>';
                return;
            }
            
            // Sort slots by time
            slots.sort((a, b) => {
                return a.startTime.localeCompare(b.startTime);
            });
            
            // Create slot elements
            slots.forEach(slot => {
                const slotElement = document.createElement('div');
                slotElement.className = `time-slot ${slot.booked ? 'booked' : 'available'}`;
                slotElement.textContent = `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
                
                if (!slot.booked) {
                    slotElement.addEventListener('click', function() {
                        toggleSlotAvailability(slot.slotId, !slot.available);
                    });
                }
                
                slotsContainer.appendChild(slotElement);
            });
        })
        .catch(error => {
            console.error('Error loading day slots:', error);
            slotsContainer.innerHTML = '<p class="text-center text-danger">Error loading time slots. Please try again.</p>';
        });
}

// Toggle slot availability
function toggleSlotAvailability(slotId, available) {
    const doctorId = localStorage.getItem('doctorId');
    
    // Call API to update slot availability
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/slots/${slotId}/availability`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ available })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update slot availability');
        }
        return response.json();
    })
    .then(data => {
        // Refresh slots
        const selectedDay = document.querySelector('.calendar-day.selected');
        if (selectedDay) {
            const day = parseInt(selectedDay.textContent);
            const month = document.getElementById('calendar-month').textContent.split(' ')[0];
            const year = parseInt(document.getElementById('calendar-month').textContent.split(' ')[1]);
            
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const monthIndex = monthNames.indexOf(month);
            
            const date = new Date(year, monthIndex, day);
            loadDaySlots(date);
        }
    })
    .catch(error => {
        console.error('Error updating slot availability:', error);
        alert('Failed to update slot availability. Please try again.');
    });
}

// Initialize modals
function initializeModals() {
    const holidayModal = document.getElementById('holiday-modal');
    const overrideModal = document.getElementById('override-modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            holidayModal.style.display = 'none';
            overrideModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === holidayModal) {
            holidayModal.style.display = 'none';
        }
        if (event.target === overrideModal) {
            overrideModal.style.display = 'none';
        }
    });
    
    document.getElementById('cancel-holiday').addEventListener('click', function() {
        holidayModal.style.display = 'none';
    });
    
    document.getElementById('cancel-override').addEventListener('click', function() {
        overrideModal.style.display = 'none';
    });
}

// Format time (HH:MM) to 12-hour format
function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    sidebar.classList.toggle('active');
}