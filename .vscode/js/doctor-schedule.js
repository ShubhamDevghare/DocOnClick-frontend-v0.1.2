// doctor-schedule.js (continued)

// Initialize event listeners
function initializeEventListeners() {
    // Add availability button
    const addAvailabilityBtn = document.getElementById('add-availability-btn');
    addAvailabilityBtn.addEventListener('click', function() {
        openAddAvailabilityModal();
    });
    
    // Add time range buttons
    const addTimeRangeButtons = document.querySelectorAll('.add-time-range-btn');
    addTimeRangeButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent event bubbling
            const day = this.getAttribute('data-day');
            openAddAvailabilityModal(day);
        });
    });
    
    // Add override button
    const addOverrideBtn = document.getElementById('add-override-btn');
    addOverrideBtn.addEventListener('click', function() {
        openAddOverrideModal();
    });
    
    // Add holiday buttons
    const addHolidayBtns = document.querySelectorAll('#add-holiday-btn, #add-holiday-btn-tab');
    addHolidayBtns.forEach(button => {
        button.addEventListener('click', function() {
            openAddHolidayModal();
        });
    });
    
    // Update slot duration button
    const updateSlotDurationBtn = document.getElementById('update-slot-duration-btn');
    updateSlotDurationBtn.addEventListener('click', function() {
        openSlotDurationModal();
    });
}

// Validate time range for overlaps
async function validateTimeRange(day, startTime, endTime, excludeId = null) {
    const doctorId = localStorage.getItem('doctorId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/v1/doctor-availability/doctor/${doctorId}/day/${day}`);
        
        if (response.ok) {
            const availabilities = await response.json();
            
            // Check for overlaps with existing time ranges
            for (const availability of availabilities) {
                // Skip the current availability being edited
                if (excludeId && availability.id == excludeId) {
                    continue;
                }
                
                const existingStart = availability.startTime;
                const existingEnd = availability.endTime;
                
                // Check if time ranges overlap
                if ((startTime < existingEnd && existingStart < endTime)) {
                    return {
                        valid: false,
                        message: `This time range overlaps with an existing range (${formatTime(existingStart)} - ${formatTime(existingEnd)})`
                    };
                }
            }
            
            return { valid: true };
        } else {
            throw new Error('Failed to validate time range');
        }
    } catch (error) {
        console.error('Error validating time range:', error);
        return {
            valid: false,
            message: 'Error validating time range. Please try again.'
        };
    }
}

// Validate override time range for overlaps
async function validateOverrideTimeRange(date, startTime, endTime, excludeId = null) {
    const doctorId = localStorage.getItem('doctorId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/v1/doctor-availability-override/doctor/${doctorId}/date/${date}`);
        
        if (response.ok) {
            const overrides = await response.json();
            
            // Check for overlaps with existing overrides
            for (const override of overrides) {
                // Skip the current override being edited
                if (excludeId && override.id == excludeId) {
                    continue;
                }
                
                // Only check available overrides
                if (!override.available) {
                    continue;
                }
                
                const existingStart = override.startTime;
                const existingEnd = override.endTime;
                
                // Check if time ranges overlap
                if ((startTime < existingEnd && existingStart < endTime)) {
                    return {
                        valid: false,
                        message: `This time range overlaps with an existing override (${formatTime(existingStart)} - ${formatTime(existingEnd)})`
                    };
                }
            }
            
            return { valid: true };
        } else {
            throw new Error('Failed to validate override time range');
        }
    } catch (error) {
        console.error('Error validating override time range:', error);
        return {
            valid: false,
            message: 'Error validating override time range. Please try again.'
        };
    }
}

// Enhanced save availability with validation
async function saveAvailability() {
    const form = document.getElementById('availability-form');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const availabilityId = document.getElementById('availability-id').value;
    const dayOfWeek = document.getElementById('availability-day').value;
    const startTime = document.getElementById('availability-start').value;
    const endTime = document.getElementById('availability-end').value;
    const timeRangeOrder = document.getElementById('availability-order').value;
    
    // Validate time range
    if (startTime >= endTime) {
        alert('Start time must be before end time');
        return;
    }
    
    // Validate for overlaps
    const validation = await validateTimeRange(dayOfWeek, startTime, endTime, availabilityId);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }
    
    // Create availability object
    const availability = {
        dayOfWeek,
        startTime,
        endTime,
        timeRangeOrder: parseInt(timeRangeOrder)
    };
    
    try {
        const doctorId = localStorage.getItem('doctorId');
        let response;
        
        if (availabilityId) {
            // Update existing availability
            availability.id = parseInt(availabilityId);
            response = await fetch(`http://localhost:8080/api/v1/doctor-availability/${availabilityId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(availability)
            });
        } else {
            // Add new availability
            response = await fetch(`http://localhost:8080/api/v1/doctor-availability/${doctorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(availability)
            });
        }
        
        if (response.ok) {
            // Close modal
            document.getElementById('availability-modal').classList.remove('active');
            
            // Reload availabilities
            loadWeeklyAvailability();
            
            // Show success message
            alert(availabilityId ? 'Availability updated successfully' : 'Availability added successfully');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save availability');
        }
    } catch (error) {
        console.error('Error saving availability:', error);
        alert(`Error: ${error.message || 'Failed to save availability. Please try again.'}`);
    }
}

// Enhanced save override with validation
async function saveOverride() {
    const form = document.getElementById('override-form');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const overrideId = document.getElementById('override-id').value;
    const date = document.getElementById('override-date').value;
    const available = document.getElementById('override-available').checked;
    
    // Create override object
    const override = {
        date,
        available
    };
    
    // Add time fields if available
    if (available) {
        const startTime = document.getElementById('override-start').value;
        const endTime = document.getElementById('override-end').value;
        
        // Validate time range
        if (startTime >= endTime) {
            alert('Start time must be before end time');
            return;
        }
        
        // Validate for overlaps
        const validation = await validateOverrideTimeRange(date, startTime, endTime, overrideId);
        if (!validation.valid) {
            alert(validation.message);
            return;
        }
        
        override.startTime = startTime;
        override.endTime = endTime;
    }
    
    try {
        const doctorId = localStorage.getItem('doctorId');
        let response;
        
        if (overrideId) {
            // Update existing override
            override.id = parseInt(overrideId);
            response = await fetch(`http://localhost:8080/api/v1/doctor-availability-override/${overrideId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(override)
            });
        } else {
            // Add new override
            response = await fetch(`http://localhost:8080/api/v1/doctor-availability-override/${doctorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(override)
            });
        }
        
        if (response.ok) {
            // Close modal
            document.getElementById('override-modal').classList.remove('active');
            
            // Reload calendar and overrides
            const currentMonth = new Date(date).getMonth();
            const currentYear = new Date(date).getFullYear();
            loadMonthOverrides(currentMonth, currentYear);
            loadUpcomingOverrides();
            
            // Show success message
            alert(overrideId ? 'Override updated successfully' : 'Override added successfully');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save override');
        }
    } catch (error) {
        console.error('Error saving override:', error);
        alert(`Error: ${error.message || 'Failed to save override. Please try again.'}`);
    }
}

// Check if date is a holiday
async function checkIfHoliday(date) {
    const doctorId = localStorage.getItem('doctorId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/v1/doctor-holidays/doctor/${doctorId}/check?date=${date}`);
        
        if (response.ok) {
            const result = await response.json();
            return result.isHoliday;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error checking holiday:', error);
        return false;
    }
}

// Check if date has appointments
async function checkIfDateHasAppointments(date) {
    const doctorId = localStorage.getItem('doctorId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/v1/appointments/doctor/${doctorId}/date/${date}/count`);
        
        if (response.ok) {
            const result = await response.json();
            return result.count > 0;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error checking appointments:', error);
        return false;
    }
}

// Enhanced save holiday with validation
async function saveHoliday() {
    const form = document.getElementById('holiday-form');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const holidayDate = document.getElementById('holiday-date').value;
    const reason = document.getElementById('holiday-reason').value;
    
    // Check if date is in the past
    const selectedDate = new Date(holidayDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        alert('Cannot add holiday for a past date');
        return;
    }
    
    // Check if date already has appointments
    const hasAppointments = await checkIfDateHasAppointments(holidayDate);
    if (hasAppointments) {
        if (!confirm('This date already has appointments. Adding a holiday will cancel all non-booked slots. Continue?')) {
            return;
        }
    }
    
    // Create holiday object
    const holiday = {
        holidayDate,
        reason
    };
    
    try {
        const doctorId = localStorage.getItem('doctorId');
        const response = await fetch(`http://localhost:8080/api/v1/doctor-holidays/${doctorId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(holiday)
        });
        
        if (response.ok) {
            // Close modal
            document.getElementById('holiday-modal').classList.remove('active');
            
            // Reload holidays
            loadHolidays();
            
            // Reload calendar
            const currentMonth = new Date(holidayDate).getMonth();
            const currentYear = new Date(holidayDate).getFullYear();
            loadMonthHolidays(currentMonth, currentYear);
            
            // Show success message
            alert('Holiday added successfully');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add holiday');
        }
    } catch (error) {
        console.error('Error adding holiday:', error);
        alert(`Error: ${error.message || 'Failed to add holiday. Please try again.'}`);
    }
}

// Get next available order for a day
async function getNextAvailableOrder(day) {
    const doctorId = localStorage.getItem('doctorId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/v1/doctor-availability/doctor/${doctorId}/day/${day}`);
        
        if (response.ok) {
            const availabilities = await response.json();
            
            if (availabilities.length === 0) {
                return 1;
            }
            
            // Find the highest order
            const maxOrder = Math.max(...availabilities.map(a => a.timeRangeOrder || 0));
            return maxOrder + 1;
        } else {
            return 1;
        }
    } catch (error) {
        console.error('Error getting next available order:', error);
        return 1;
    }
}

// Open add availability modal with next available order
async function openAddAvailabilityModal(day = 'MONDAY') {
    const modal = document.getElementById('availability-modal');
    const modalTitle = document.getElementById('availability-modal-title');
    const form = document.getElementById('availability-form');
    
    // Reset form
    form.reset();
    document.getElementById('availability-id').value = '';
    
    // Set day
    document.getElementById('availability-day').value = day;
    document.getElementById('availability-day-display').value = formatDayName(day);
    
    // Set default times
    document.getElementById('availability-start').value = '09:00';
    document.getElementById('availability-end').value = '17:00';
    
    // Get next available order
    const nextOrder = await getNextAvailableOrder(day);
    document.getElementById('availability-order').value = nextOrder;
    
    // Update modal title
    modalTitle.textContent = 'Add Availability';
    
    // Show modal
    modal.classList.add('active');
}

// Check for existing override
async function checkForExistingOverride(date) {
    const doctorId = localStorage.getItem('doctorId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/v1/doctor-availability-override/doctor/${doctorId}/date/${date}`);
        
        if (response.ok) {
            const overrides = await response.json();
            
            if (overrides.length > 0) {
                return {
                    exists: true,
                    override: overrides[0]
                };
            } else {
                return { exists: false };
            }
        } else {
            return { exists: false };
        }
    } catch (error) {
        console.error('Error checking for existing override:', error);
        return { exists: false };
    }
}

// Enhanced open add override modal
async function openAddOverrideModal(date = null) {
    const modal = document.getElementById('override-modal');
    const modalTitle = document.getElementById('override-modal-title');
    const form = document.getElementById('override-form');
    
    // Reset form
    form.reset();
    document.getElementById('override-id').value = '';
    
    // Set date if provided
    if (date) {
        document.getElementById('override-date').value = date;
        
        // Check if date is a holiday
        const isHoliday = await checkIfHoliday(date);
        if (isHoliday) {
            alert('This date is marked as a holiday. Please remove the holiday first before adding an override.');
            return;
        }
        
        // Check if override already exists
        const existingOverride = await checkForExistingOverride(date);
        if (existingOverride.exists) {
            // Open edit modal instead
            openEditOverrideModal(existingOverride.override.id);
            return;
        }
    } else {
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('override-date').value = tomorrow.toISOString().split('T')[0];
    }
    
    // Set default times
    document.getElementById('override-start').value = '09:00';
    document.getElementById('override-end').value = '17:00';
    
    // Make sure time fields are visible if available is checked
    const overrideAvailableCheckbox = document.getElementById('override-available');
    const overrideTimeFields = document.getElementById('override-time-fields');
    
    if (overrideAvailableCheckbox.checked) {
        overrideTimeFields.style.display = 'block';
    } else {
        overrideTimeFields.style.display = 'none';
    }
    
    // Update modal title
    modalTitle.textContent = 'Add Date Override';
    
    // Show modal
    modal.classList.add('active');
}

// Export calendar as iCal
function exportCalendarAsICal() {
    const doctorId = localStorage.getItem('doctorId');
    const doctorName = localStorage.getItem('userName') || 'Doctor';
    
    // Redirect to API endpoint for iCal download
    window.location.href = `http://localhost:8080/api/v1/doctor-availability/doctor/${doctorId}/ical?doctorName=${encodeURIComponent(doctorName)}`;
}

// Add export calendar button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add export calendar button to the header
    const headerActions = document.querySelector('.header-actions');
    
    if (headerActions) {
        const exportButton = document.createElement('button');
        exportButton.id = 'export-calendar-btn';
        exportButton.className = 'btn btn-outline';
        exportButton.innerHTML = '<i class="fas fa-calendar-alt"></i> Export Calendar';
        
        headerActions.appendChild(exportButton);
        
        // Add event listener
        exportButton.addEventListener('click', exportCalendarAsICal);
    }
});

// Add bulk holiday functionality
function openBulkHolidayModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('bulk-holiday-modal')) {
        const modalHTML = `
            <div id="bulk-holiday-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Add Multiple Holidays</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="bulk-holiday-form">
                            <div class="form-group">
                                <label for="holiday-start-date">Start Date</label>
                                <input type="date" id="holiday-start-date" name="startDate" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="holiday-end-date">End Date</label>
                                <input type="date" id="holiday-end-date" name="endDate" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="holiday-reason-bulk">Reason (Optional)</label>
                                <textarea id="holiday-reason-bulk" name="reason"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <div class="checkbox-group">
                                    <input type="checkbox" id="include-weekends" name="includeWeekends">
                                    <label for="include-weekends">Include Weekends</label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline close-modal">Cancel</button>
                        <button class="btn btn-primary" id="save-bulk-holiday">Save</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners
        const bulkHolidayModal = document.getElementById('bulk-holiday-modal');
        const closeButtons = bulkHolidayModal.querySelectorAll('.close-modal');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                bulkHolidayModal.classList.remove('active');
            });
        });
        
        window.addEventListener('click', function(event) {
            if (event.target === bulkHolidayModal) {
                bulkHolidayModal.classList.remove('active');
            }
        });
        
        const saveBulkHolidayButton = document.getElementById('save-bulk-holiday');
        saveBulkHolidayButton.addEventListener('click', saveBulkHoliday);
    }
    
    // Reset form
    document.getElementById('bulk-holiday-form').reset();
    
    // Set default dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('holiday-start-date').value = tomorrow.toISOString().split('T')[0];
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('holiday-end-date').value = nextWeek.toISOString().split('T')[0];
    
    // Show modal
    document.getElementById('bulk-holiday-modal').classList.add('active');
}

// Save bulk holidays
async function saveBulkHoliday() {
    const form = document.getElementById('bulk-holiday-form');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const startDate = document.getElementById('holiday-start-date').value;
    const endDate = document.getElementById('holiday-end-date').value;
    const reason = document.getElementById('holiday-reason-bulk').value;
    const includeWeekends = document.getElementById('include-weekends').checked;
    
    // Validate date range
    if (startDate > endDate) {
        alert('Start date must be before end date');
        return;
    }
    
    // Check if dates are in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (new Date(startDate) < today) {
        alert('Cannot add holidays for past dates');
        return;
    }
    
    // Create bulk holiday object
    const bulkHoliday = {
        startDate,
        endDate,
        reason,
        includeWeekends
    };
    
    try {
        const doctorId = localStorage.getItem('doctorId');
        const response = await fetch(`http://localhost:8080/api/v1/doctor-holidays/${doctorId}/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bulkHoliday)
        });
        
        if (response.ok) {
            // Close modal
            document.getElementById('bulk-holiday-modal').classList.remove('active');
            
            // Reload holidays
            loadHolidays();
            
            // Reload calendar
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            loadMonthHolidays(currentMonth, currentYear);
            
            // Show success message
            const result = await response.json();
            alert(`Successfully added ${result.count} holidays`);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add holidays');
        }
    } catch (error) {
        console.error('Error adding bulk holidays:', error);
        alert(`Error: ${error.message || 'Failed to add holidays. Please try again.'}`);
    }
}

// Add bulk holiday button to holidays tab
document.addEventListener('DOMContentLoaded', function() {
    // Add bulk holiday button to the holidays tab
    const holidaysHeader = document.querySelector('#holidays .section-header');
    
    if (holidaysHeader) {
        const bulkHolidayButton = document.createElement('button');
        bulkHolidayButton.id = 'add-bulk-holiday-btn';
        bulkHolidayButton.className = 'btn btn-outline';
        bulkHolidayButton.innerHTML = '<i class="fas fa-calendar-minus"></i> Add Multiple';
        
        // Insert before the add holiday button
        const addHolidayButton = document.getElementById('add-holiday-btn-tab');
        holidaysHeader.insertBefore(bulkHolidayButton, addHolidayButton);
        
        // Add event listener
        bulkHolidayButton.addEventListener('click', openBulkHolidayModal);
    }
});