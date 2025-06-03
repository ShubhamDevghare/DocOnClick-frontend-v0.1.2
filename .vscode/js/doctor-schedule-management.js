// Constants and Global Variables
const BASE_URL = 'http://localhost:8080/api/v1';
const DAYS_OF_WEEK = [
    { name: 'Monday', value: 'MONDAY' },
    { name: 'Tuesday', value: 'TUESDAY' },
    { name: 'Wednesday', value: 'WEDNESDAY' },
    { name: 'Thursday', value: 'THURSDAY' },
    { name: 'Friday', value: 'FRIDAY' },
    { name: 'Saturday', value: 'SATURDAY' },
    { name: 'Sunday', value: 'SUNDAY' }
];

let currentDoctorId = null;
let currentDayOfWeek = null;
let currentScheduleId = null;
let currentDateOverrideId = null;
let currentCalendarDate = new Date();
let bookedSlots = [];
let availableSlots = [];
let holidaysList = [];
let dateOverridesList = [];

// DOM Elements
const doctorProfile = {
    img: document.getElementById('doctorProfileImg'),
    name: document.getElementById('doctorName'),
    specialization: document.getElementById('doctorSpecialization')
};

const dashboard = {
    todayAppointments: document.getElementById('todayAppointments'),
    availableSlotsToday: document.getElementById('availableSlotsToday'),
    upcomingHolidays: document.getElementById('upcomingHolidays'),
    specialSchedules: document.getElementById('specialSchedules'),
    miniCalendar: document.getElementById('miniCalendar'),
    todaySchedule: document.getElementById('todaySchedule')
};

const calendarView = {
    container: document.getElementById('calendar-view'),
    currentMonthYear: document.getElementById('currentMonthYear'),
    prevMonthBtn: document.getElementById('prevMonth'),
    nextMonthBtn: document.getElementById('nextMonth'),
    calendarDays: document.getElementById('calendarDays'),
    selectedDateHeader: document.getElementById('selectedDateHeader'),
    dayStatus: document.getElementById('dayStatus'),
    dayDetailsContent: document.getElementById('dayDetailsContent')
};

const weeklySchedule = {
    container: document.getElementById('weekly-schedule'),
    daysContainer: document.querySelector('.days-container'),
    timeSlotsContainer: document.getElementById('timeSlotsContainer'),
    selectedDayHeader: document.getElementById('selectedDayHeader'),
    dayAvailabilityToggle: document.getElementById('dayAvailabilityToggle'),
    timeSlotsList: document.getElementById('timeSlotsList'),
    startTime: document.getElementById('startTime'),
    endTime: document.getElementById('endTime'),
    addTimeSlotBtn: document.getElementById('addTimeSlotBtn')
};

const dateOverrideElements = {
    container: document.getElementById('date-overrides'),
    dateInput: document.getElementById('overrideDate'),
    checkDateBtn: document.getElementById('checkDateBtn'),
    selectedDate: document.getElementById('selectedOverrideDate'),
    availabilityToggle: document.getElementById('overrideDayAvailabilityToggle'),
    timeSlotsList: document.getElementById('overrideTimeSlotsList'),
    startTime: document.getElementById('overrideStartTime'),
    endTime: document.getElementById('overrideEndTime'),
    addTimeSlotBtn: document.getElementById('addOverrideTimeSlotBtn'),
    saveBtn: document.getElementById('saveOverrideBtn'),
    deleteBtn: document.getElementById('deleteOverrideBtn')
};

const holidayElements = {
    container: document.getElementById('holidays'),
    markTodayBtn: document.getElementById('markTodayHolidayBtn'),
    dateInput: document.getElementById('holidayDate'),
    reasonInput: document.getElementById('holidayReason'),
    markDateBtn: document.getElementById('markDateHolidayBtn'),
    list: document.getElementById('holidaysList')
};

const settings = {
    container: document.getElementById('settings'),
    slotDuration: document.getElementById('slotDuration'),
    updateDurationBtn: document.getElementById('updateSlotDurationBtn'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    generateSlotsBtn: document.getElementById('generateSlotsBtn'),
    themeSelector: document.getElementById('themeSelector'),
    applyThemeBtn: document.getElementById('applyThemeBtn')
};

const modal = {
    slotDetails: document.getElementById('slotDetailsModal'),
    slotDetailsTitle: document.getElementById('slotDetailsTitle'),
    slotDetailsBody: document.getElementById('slotDetailsBody'),
    closeSlotDetailsBtn: document.getElementById('closeSlotDetailsBtn')
};

const ui = {
    toast: document.getElementById('toast'),
    toastIcon: document.getElementById('toastIcon'),
    toastMessage: document.getElementById('toastMessage'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    logoutBtn: document.getElementById('logoutBtn'),
    sidebarNavItems: document.querySelectorAll('.sidebar-nav li')
};

// Helper Functions
function showLoading() {
    ui.loadingOverlay.classList.add('show');
}

function hideLoading() {
    ui.loadingOverlay.classList.remove('show');
}

function showToast(message, success = true) {
    ui.toastIcon.className = success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    ui.toastMessage.textContent = message;
    ui.toast.classList.add('show');
    
    setTimeout(() => {
        ui.toast.classList.remove('show');
    }, 3000);
}

function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateShort(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function setDateInputMinimum() {
    const today = new Date().toISOString().split('T')[0];
    dateOverrideElements.dateInput.min = today;
    holidayElements.dateInput.min = today;
    settings.startDate.min = today;
    settings.endDate.min = today;
}

function showModal(modal) {
    modal.classList.add('show');
}

function hideModal(modal) {
    modal.classList.remove('show');
}

// API Calls
async function fetchWithAuth(url, options = {}) {
    try {
        showLoading();
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `API request failed with status ${response.status}`);
        }
        
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message || 'An error occurred during the request', false);
        throw error;
    } finally {
        hideLoading();
    }
}

// Doctor API Calls
async function fetchDoctorDetails(doctorId) {
    return fetchWithAuth(`${BASE_URL}/doctors/${doctorId}`);
}

async function updateSlotDuration(doctorId, durationMinutes) {
    return fetchWithAuth(`${BASE_URL}/doctors/${doctorId}/slot-duration?durationMinutes=${durationMinutes}`, {
        method: 'PATCH'
    });
}

// Weekly Schedule API Calls
async function fetchWeeklySchedules(doctorId) {
    return fetchWithAuth(`${BASE_URL}/weekly-schedules/doctor/${doctorId}`);
}

async function fetchWeeklyScheduleByDay(doctorId, dayOfWeek) {
    try {
        return await fetchWithAuth(`${BASE_URL}/weekly-schedules/doctor/${doctorId}/day/${dayOfWeek}`);
    } catch (error) {
        // If not found, return a default empty schedule
        return {
            doctorId,
            dayOfWeek,
            isAvailable: false,
            timeSlots: []
        };
    }
}

async function toggleDayAvailability(doctorId, dayOfWeek) {
    return fetchWithAuth(`${BASE_URL}/weekly-schedules/doctor/${doctorId}/day/${dayOfWeek}/toggle`, {
        method: 'POST'
    });
}

async function createOrUpdateWeeklySchedule(doctorId, scheduleData) {
    return fetchWithAuth(`${BASE_URL}/weekly-schedules/doctor/${doctorId}`, {
        method: 'POST',
        body: JSON.stringify(scheduleData)
    });
}

// Date Override API Calls
async function fetchDateOverride(doctorId, date) {
    try {
        return await fetchWithAuth(`${BASE_URL}/date-overrides/doctor/${doctorId}/date/${date}`);
    } catch (error) {
        if (error.message.includes('404')) {
            // Override doesn't exist yet
            return null;
        }
        throw error;
    }
}

async function fetchDateOverridesInRange(doctorId, startDate, endDate) {
    return fetchWithAuth(`${BASE_URL}/date-overrides/doctor/${doctorId}/range?startDate=${startDate}&endDate=${endDate}`);
}

async function createOrUpdateDateOverride(doctorId, overrideData) {
    return fetchWithAuth(`${BASE_URL}/date-overrides/doctor/${doctorId}`, {
        method: 'POST',
        body: JSON.stringify(overrideData)
    });
}

async function deleteDateOverride(overrideId) {
    return fetchWithAuth(`${BASE_URL}/date-overrides/${overrideId}`, {
        method: 'DELETE'
    });
}

// Holiday API Calls
async function fetchDoctorHolidays(doctorId) {
    return fetchWithAuth(`${BASE_URL}/doctor-holidays/doctor/${doctorId}`);
}

async function fetchDoctorHolidaysInRange(doctorId, startDate, endDate) {
    // This endpoint might not exist in your API, but we can filter the results client-side
    const allHolidays = await fetchDoctorHolidays(doctorId);
    return allHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.holidayDate);
        return holidayDate >= new Date(startDate) && holidayDate <= new Date(endDate);
    });
}

async function markTodayAsHoliday(doctorId) {
    return fetchWithAuth(`${BASE_URL}/doctor-holidays/${doctorId}/today`, {
        method: 'POST'
    });
}

async function addHoliday(doctorId, holidayData) {
    return fetchWithAuth(`${BASE_URL}/doctor-holidays/${doctorId}`, {
        method: 'POST',
        body: JSON.stringify(holidayData)
    });
}

async function removeHoliday(holidayId) {
    return fetchWithAuth(`${BASE_URL}/doctor-holidays/${holidayId}`, {
        method: 'DELETE'
    });
}

// Appointment Slot API Calls
async function generateAppointmentSlots(doctorId, startDate, endDate) {
    return fetchWithAuth(`${BASE_URL}/appointment-slots/generate/doctor/${doctorId}/range?startDate=${startDate}&endDate=${endDate}`, {
        method: 'POST'
    });
}

async function getAvailableSlots(doctorId, date) {
    return fetchWithAuth(`${BASE_URL}/appointment-slots/doctor/${doctorId}/date/${date}`);
}

async function getAvailableSlotsInRange(doctorId, startDate, endDate) {
    return fetchWithAuth(`${BASE_URL}/appointment-slots/doctor/${doctorId}/range?startDate=${startDate}&endDate=${endDate}`);
}

// New method to get booked slots
async function getBookedSlots(doctorId, date) {
    // This endpoint might not exist in your API, so we'll create a custom implementation
    // We'll fetch all slots and filter the booked ones
    try {
        const response = await fetch(`${BASE_URL}/appointment-slots/doctor/${doctorId}/date/${date}/all`);
        
        if (!response.ok) {
            // If the endpoint doesn't exist, we'll use a workaround
            // We'll assume that booked slots are not returned by the getAvailableSlots endpoint
            // So we'll need to compare with the expected slots based on the schedule
            
            // Get the day's schedule
            const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][new Date(date).getDay()];
            const schedule = await fetchWeeklyScheduleByDay(doctorId, dayOfWeek);
            
            // Check if there's a date override
            const dateOverride = await fetchDateOverride(doctorId, date);
            
            // Check if it's a holiday
            const isHoliday = await isDoctorOnHoliday(doctorId, date);
            
            if (isHoliday) {
                return []; // No slots on holidays
            }
            
            // Get available slots
            const availableSlots = await getAvailableSlots(doctorId, date);
            
            // If there's a date override, use its time slots
            if (dateOverride && dateOverride.isAvailable) {
                const allPossibleSlots = generateSlotsFromTimeRanges(dateOverride.timeSlots, date);
                return allPossibleSlots.filter(slot => 
                    !availableSlots.some(availableSlot => 
                        availableSlot.startTime === slot.startTime && availableSlot.endTime === slot.endTime
                    )
                );
            }
            
            // Otherwise use the weekly schedule
            if (schedule && schedule.isAvailable) {
                const allPossibleSlots = generateSlotsFromTimeRanges(schedule.timeSlots, date);
                return allPossibleSlots.filter(slot => 
                    !availableSlots.some(availableSlot => 
                        availableSlot.startTime === slot.startTime && availableSlot.endTime === slot.endTime
                    )
                );
            }
            
            return []; // No schedule or not available
        }
        
        const allSlots = await response.json();
        return allSlots.filter(slot => slot.isBooked);
    } catch (error) {
        console.error('Error fetching booked slots:', error);
        return []; // Return empty array on error
    }
}

function generateSlotsFromTimeRanges(timeRanges, date) {
    const slots = [];
    
    timeRanges.forEach(range => {
        const startTime = range.startTime;
        const endTime = range.endTime;
        
        slots.push({
            date,
            startTime,
            endTime,
            isBooked: true // We're generating this for comparison, so we assume it's booked
        });
    });
    
    return slots;
}

async function isDoctorOnHoliday(doctorId, date) {
    try {
        const response = await fetch(`${BASE_URL}/doctor-holidays/doctor/${doctorId}/check?date=${date}`);
        
        if (!response.ok) {
            // If the endpoint doesn't exist, we'll check manually
            const holidays = await fetchDoctorHolidays(doctorId);
            return holidays.some(holiday => holiday.holidayDate === date);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error checking holiday:', error);
        return false; // Assume not a holiday on error
    }
}

// UI Handlers
function populateDoctorProfile(doctor) {
    doctorProfile.img.src = doctor.profileImage || '/placeholder.svg?height=100&width=100';
    doctorProfile.name.textContent = doctor.fullName;
    doctorProfile.specialization.textContent = doctor.specialization;
}

function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update active state in sidebar
    ui.sidebarNavItems.forEach(item => {
        if (item.dataset.target === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Perform section-specific initialization
    if (sectionId === 'dashboard') {
        initializeDashboard();
    } else if (sectionId === 'calendar-view') {
        renderCalendar(currentCalendarDate);
    }
}

// Dashboard Section
async function initializeDashboard() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch today's available slots
        const availableSlots = await getAvailableSlots(currentDoctorId, today);
        dashboard.availableSlotsToday.textContent = availableSlots.length;
        
        // Fetch today's booked slots
        const bookedSlots = await getBookedSlots(currentDoctorId, today);
        dashboard.todayAppointments.textContent = bookedSlots.length;
        
        // Fetch upcoming holidays (next 30 days)
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        const upcomingHolidays = await fetchDoctorHolidaysInRange(
            currentDoctorId, 
            today, 
            thirtyDaysLater.toISOString().split('T')[0]
        );
        dashboard.upcomingHolidays.textContent = upcomingHolidays.length;
        
        // Fetch special schedules (date overrides)
        const specialSchedules = await fetchDateOverridesInRange(
            currentDoctorId,
            today,
            thirtyDaysLater.toISOString().split('T')[0]
        );
        dashboard.specialSchedules.textContent = specialSchedules.length;
        
        // Render mini calendar
        renderMiniCalendar(new Date());
        
        // Render today's schedule
        renderTodaySchedule(today);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showToast('Failed to load dashboard data', false);
    }
}

function renderMiniCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const miniCalendar = dashboard.miniCalendar;
    miniCalendar.innerHTML = '';
    
    // Add weekday headers
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    weekdays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'weekday';
        dayElement.textContent = day;
        miniCalendar.appendChild(dayElement);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'day';
        miniCalendar.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.textContent = i;
        
        const currentDate = new Date(year, month, i);
        
        // Check if it's today
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Add click event
        dayElement.addEventListener('click', () => {
            switchSection('calendar-view');
            currentCalendarDate = new Date(year, month, i);
            renderCalendar(currentCalendarDate);
            handleCalendarDayClick(currentDate);
        });
        
        miniCalendar.appendChild(dayElement);
    }
}

async function renderTodaySchedule(today) {
    try {
        const todaySchedule = dashboard.todaySchedule;
        todaySchedule.innerHTML = '';
        
        // Check if it's a holiday
        const isHoliday = await isDoctorOnHoliday(currentDoctorId, today);
        
        if (isHoliday) {
            const holidayMessage = document.createElement('div');
            holidayMessage.className = 'schedule-item';
            holidayMessage.innerHTML = `
                <div class="time">All Day</div>
                <div>You are on holiday today</div>
            `;
            todaySchedule.appendChild(holidayMessage);
            return;
        }
        
        // Get available and booked slots
        const availableSlots = await getAvailableSlots(currentDoctorId, today);
        const bookedSlots = await getBookedSlots(currentDoctorId, today);
        
        if (availableSlots.length === 0 && bookedSlots.length === 0) {
            const noSlotsMessage = document.createElement('div');
            noSlotsMessage.className = 'schedule-item';
            noSlotsMessage.innerHTML = `
                <div>No appointments scheduled for today</div>
            `;
            todaySchedule.appendChild(noSlotsMessage);
            return;
        }
        
        // Combine and sort all slots
        const allSlots = [...availableSlots, ...bookedSlots].sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        // Render each slot
        allSlots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'schedule-item';
            slotElement.innerHTML = `
                <div class="time">${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}</div>
                <div>
                    Appointment Slot
                    <span class="status ${slot.isBooked ? 'booked' : 'available'}">
                        ${slot.isBooked ? 'Booked' : 'Available'}
                    </span>
                </div>
            `;
            todaySchedule.appendChild(slotElement);
        });
    } catch (error) {
        console.error('Error rendering today\'s schedule:', error);
        dashboard.todaySchedule.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i> Failed to load today's schedule
            </div>
        `;
    }
}

// Calendar View Section
function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Update header
    calendarView.currentMonthYear.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const calendarDays = calendarView.calendarDays;
    calendarDays.innerHTML = '';
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDays.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.innerHTML = `<div class="day-number">${i}</div>`;
        
        const currentDate = new Date(year, month, i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Store the date in a data attribute
        dayElement.dataset.date = dateString;
        
        // Check if it's today
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Add click event
        dayElement.addEventListener('click', () => handleCalendarDayClick(currentDate));
        
        calendarDays.appendChild(dayElement);
    }
    
    // Add empty cells for days after the last day of the month
    const totalCells = calendarDays.children.length;
    const cellsToAdd = 42 - totalCells; // 6 rows of 7 days
    
    for (let i = 0; i < cellsToAdd; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDays.appendChild(emptyDay);
    }
    
    // Fetch and update calendar data
    updateCalendarData(year, month);
}

async function updateCalendarData(year, month) {
    try {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];
        
        // Fetch holidays
        const holidaysInRange = await fetchDoctorHolidaysInRange(currentDoctorId, startDate, endDate);
        
        // Fetch date overrides
        const overridesInRange = await fetchDateOverridesInRange(currentDoctorId, startDate, endDate);
        
        // Fetch available slots
        const availableSlotsInRange = await getAvailableSlotsInRange(currentDoctorId, startDate, endDate);
        
        // Group available slots by date
        const availableSlotsByDate = {};
        availableSlotsInRange.forEach(slot => {
            if (!availableSlotsByDate[slot.date]) {
                availableSlotsByDate[slot.date] = [];
            }
            availableSlotsByDate[slot.date].push(slot);
        });
        
        // Update calendar days with data
        const calendarDays = calendarView.calendarDays.querySelectorAll('.calendar-day:not(.other-month)');
        
        calendarDays.forEach(dayElement => {
            const dateString = dayElement.dataset.date;
            
            if (!dateString) return;
            
            // Check if it's a holiday
            const isHoliday = holidaysInRange.some(holiday => holiday.holidayDate === dateString);
            
            if (isHoliday) {
                dayElement.classList.add('holiday');
                dayElement.innerHTML += `<div class="day-indicator"></div>`;
                return;
            }
            
            // Check if it has a date override
            const hasOverride = overridesInRange.some(override => override.overrideDate === dateString);
            
            if (hasOverride) {
                dayElement.classList.add('special-day');
            }
            
            // Check available slots
            const availableSlots = availableSlotsByDate[dateString] || [];
            
            if (availableSlots.length > 0) {
                dayElement.innerHTML += `
                    <div class="day-indicator available"></div>
                `;
            }
        });
    } catch (error) {
        console.error('Error updating calendar data:', error);
        showToast('Failed to load calendar data', false);
    }
}

async function handleCalendarDayClick(date) {
    try {
        // Update selected day in UI
        const calendarDays = calendarView.calendarDays.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => day.classList.remove('selected'));
        
        const dateString = date.toISOString().split('T')[0];
        const selectedDay = Array.from(calendarDays).find(day => day.dataset.date === dateString);
        
        if (selectedDay) {
            selectedDay.classList.add('selected');
        }
        
        // Update header
        calendarView.selectedDateHeader.textContent = formatDate(dateString);
        
        // Check if it's a holiday
        const isHoliday = await isDoctorOnHoliday(currentDoctorId, dateString);
        
        if (isHoliday) {
            calendarView.dayStatus.textContent = 'Holiday';
            calendarView.dayStatus.className = 'day-status holiday';
            
            // Get holiday details
            const holidays = await fetchDoctorHolidays(currentDoctorId);
            const holiday = holidays.find(h => h.holidayDate === dateString);
            
            calendarView.dayDetailsContent.innerHTML = `
                <div class="holiday-details">
                    <h4>Holiday Information</h4>
                    <p>${holiday?.reason || 'No reason specified'}</p>
                </div>
            `;
            return;
        }
        
        // Check if it has a date override
        const dateOverride = await fetchDateOverride(currentDoctorId, dateString);
        
        if (dateOverride) {
            calendarView.dayStatus.textContent = 'Special Schedule';
            calendarView.dayStatus.className = 'day-status special-day';
            
            if (!dateOverride.isAvailable) {
                calendarView.dayDetailsContent.innerHTML = `
                    <div class="no-slots-message">
                        <i class="fas fa-calendar-times"></i>
                        <p>You are not available on this day</p>
                    </div>
                `;
                return;
            }
        } else {
            calendarView.dayStatus.textContent = 'Regular Schedule';
            calendarView.dayStatus.className = 'day-status available';
        }
        
        // Get available and booked slots
        const availableSlots = await getAvailableSlots(currentDoctorId, dateString);
        const bookedSlots = await getBookedSlots(currentDoctorId, dateString);
        
        if (availableSlots.length === 0 && bookedSlots.length === 0) {
            calendarView.dayDetailsContent.innerHTML = `
                <div class="no-slots-message">
                    <i class="fas fa-calendar-times"></i>
                    <p>No appointment slots available for this day</p>
                </div>
            `;
            return;
        }
        
        // Combine and sort all slots
        const allSlots = [...availableSlots, ...bookedSlots].sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        // Render slots
        calendarView.dayDetailsContent.innerHTML = `
            <div class="time-slot-grid">
                ${allSlots.map(slot => `
                    <div class="time-slot-card" data-slot-id="${slot.id}">
                        <div class="time">${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}</div>
                        <div class="status ${slot.isBooked ? 'booked' : 'available'}">
                            ${slot.isBooked ? 'Booked' : 'Available'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add click event to slots
        calendarView.dayDetailsContent.querySelectorAll('.time-slot-card').forEach(card => {
            card.addEventListener('click', () => {
                const slotId = card.dataset.slotId;
                const slot = allSlots.find(s => s.id === parseInt(slotId));
                
                if (slot) {
                    showSlotDetails(slot);
                }
            });
        });
    } catch (error) {
        console.error('Error handling calendar day click:', error);
        calendarView.dayDetailsContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i> Failed to load day details
            </div>
        `;
    }
}

function showSlotDetails(slot) {
    modal.slotDetailsTitle.textContent = `Appointment Slot: ${formatDate(slot.date)}`;
    
    modal.slotDetailsBody.innerHTML = `
        <div class="slot-details">
            <div class="detail-item">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value ${slot.isBooked ? 'text-danger' : 'text-success'}">
                    ${slot.isBooked ? 'Booked' : 'Available'}
                </span>
            </div>
            ${slot.isBooked ? `
                <div class="detail-item">
                    <span class="detail-label">Patient:</span>
                    <span class="detail-value">Information not available</span>
                </div>
            ` : ''}
        </div>
    `;
    
    showModal(modal.slotDetails);
}

// Weekly Schedule Section
function renderWeeklyScheduleDays(schedules) {
    const daysContainer = weeklySchedule.daysContainer;
    daysContainer.innerHTML = '';
    
    DAYS_OF_WEEK.forEach(day => {
        const schedule = schedules.find(s => s.dayOfWeek === day.value) || {
            isAvailable: false,
            timeSlots: []
        };
        
        const slotCount = schedule.timeSlots ? schedule.timeSlots.length : 0;
        const isAvailable = schedule.available === true || schedule.isAvailable === true;
        
        const dayElement = document.createElement('div');
        dayElement.className = 'day-item';
        dayElement.dataset.day = day.value;
        dayElement.innerHTML = `
            <h3>${day.name}</h3>
            <p>
                <span class="status ${isAvailable ? 'available' : 'unavailable'}"></span>
                ${isAvailable ? 'Available' : 'Unavailable'}
            </p>
            <p>${isAvailable ? `${slotCount} time slot(s)` : 'No slots'}</p>
        `;
        
        dayElement.addEventListener('click', () => handleDaySelection(day.value));
        daysContainer.appendChild(dayElement);
    });
}

async function handleDaySelection(dayOfWeek) {
    // Update UI
    document.querySelectorAll('.day-item').forEach(item => {
        if (item.dataset.day === dayOfWeek) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    currentDayOfWeek = dayOfWeek;
    weeklySchedule.selectedDayHeader.textContent = `${DAYS_OF_WEEK.find(d => d.value === dayOfWeek).name} Schedule`;
    
    // Fetch day's schedule
    const schedule = await fetchWeeklyScheduleByDay(currentDoctorId, dayOfWeek);
    currentScheduleId = schedule.id;
    
    // Update availability toggle
    weeklySchedule.dayAvailabilityToggle.checked = schedule.available === true || schedule.isAvailable === true;
    
    // Render time slots
    renderTimeSlots(schedule.timeSlots || []);
}

function renderTimeSlots(timeSlots) {
    const timeSlotsList = weeklySchedule.timeSlotsList;
    timeSlotsList.innerHTML = '';
    
    if (timeSlots.length === 0) {
        timeSlotsList.innerHTML = '<p>No time slots added yet.</p>';
        return;
    }
    
    timeSlots.forEach(slot => {
        const timeSlotElement = document.createElement('div');
        timeSlotElement.className = 'time-slot-item';
        timeSlotElement.innerHTML = `
            <div class="time-slot-time">
                ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}
            </div>
            <div class="time-slot-actions">
                <button class="delete-time-slot" data-id="${slot.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        timeSlotsList.appendChild(timeSlotElement);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-time-slot').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDeleteTimeSlot(button.dataset.id);
        });
    });
}

async function handleDeleteTimeSlot(timeSlotId) {
    // For the weekly schedule, we need to get the current slots,
    // filter out the one to delete, and then update the schedule
    const schedule = await fetchWeeklyScheduleByDay(currentDoctorId, currentDayOfWeek);
    
    const updatedTimeSlots = schedule.timeSlots.filter(slot => slot.id !== parseInt(timeSlotId));
    
    const updatedSchedule = {
        ...schedule,
        timeSlots: updatedTimeSlots
    };
    
    try {
        await createOrUpdateWeeklySchedule(currentDoctorId, updatedSchedule);
        showToast('Time slot deleted successfully');
        renderTimeSlots(updatedTimeSlots);
    } catch (error) {
        showToast('Failed to delete time slot', false);
    }
}

async function handleAddTimeSlot() {
    const startTime = weeklySchedule.startTime.value;
    const endTime = weeklySchedule.endTime.value;
    
    if (!startTime || !endTime) {
        showToast('Please select both start and end times', false);
        return;
    }
    
    if (startTime >= endTime) {
        showToast('End time must be after start time', false);
        return;
    }
    
    // Get current schedule
    const schedule = await fetchWeeklyScheduleByDay(currentDoctorId, currentDayOfWeek);
    
    // Add new time slot
    const newTimeSlot = {
        startTime,
        endTime
    };
    
    const updatedSchedule = {
        ...schedule,
        timeSlots: [...schedule.timeSlots, newTimeSlot]
    };
    
    try {
        const result = await createOrUpdateWeeklySchedule(currentDoctorId, updatedSchedule);
        showToast('Time slot added successfully');
        renderTimeSlots(result.timeSlots);
        
        // Clear inputs
        weeklySchedule.startTime.value = '';
        weeklySchedule.endTime.value = '';
    } catch (error) {
        showToast('Failed to add time slot', false);
    }
}

async function handleToggleDayAvailability() {
    const isAvailable = weeklySchedule.dayAvailabilityToggle.checked;
    
    try {
        // Create a schedule object with the correct field name
        const scheduleData = {
            doctorId: currentDoctorId,
            dayOfWeek: currentDayOfWeek,
            available: isAvailable,
            timeSlots: []
        };
        
        // Update the schedule with the new availability
        const updatedSchedule = await createOrUpdateWeeklySchedule(currentDoctorId, scheduleData);
        showToast(`Day ${isAvailable ? 'enabled' : 'disabled'} successfully`);
        
        // Refresh weekly schedule
        const schedules = await fetchWeeklySchedules(currentDoctorId);
        renderWeeklyScheduleDays(schedules);
        
        // Update current day's slots
        renderTimeSlots(updatedSchedule.timeSlots || []);
    } catch (error) {
        console.error('Error toggling day availability:', error);
        showToast('Failed to update day availability', false);
        // Revert toggle state
        weeklySchedule.dayAvailabilityToggle.checked = !isAvailable;
    }
}

// Date Override Section
async function handleCheckDateOverride() {
    const date = dateOverrideElements.dateInput.value;
    
    if (!date) {
        showToast('Please select a date', false);
        return;
    }
    
    try {
        // Try to fetch existing override
        const override = await fetchDateOverride(currentDoctorId, date);
        
        // Update UI
        dateOverrideElements.selectedDate.textContent = formatDate(date);
        
        if (override) {
            // Existing override
            currentDateOverrideId = override.id;
            dateOverrideElements.availabilityToggle.checked = override.available === true || override.isAvailable === true;
            renderOverrideTimeSlots(override.timeSlots || []);
        } else {
            // No override exists, get the regular schedule for this day
            const dayOfWeek = DAYS_OF_WEEK[new Date(date).getDay() === 0 ? 6 : new Date(date).getDay() - 1].value;
            const regularSchedule = await fetchWeeklyScheduleByDay(currentDoctorId, dayOfWeek);
            
            currentDateOverrideId = null;
            dateOverrideElements.availabilityToggle.checked = regularSchedule.available === true || regularSchedule.isAvailable === true;
            renderOverrideTimeSlots(regularSchedule.timeSlots || []);
            showToast('No special schedule exists for this date. Showing regular schedule.');
        }
    } catch (error) {
        console.error('Error checking date override:', error);
        showToast('Failed to check date override', false);
    }
}

function renderOverrideTimeSlots(timeSlots) {
    const timeSlotsList = dateOverrideElements.timeSlotsList;
    timeSlotsList.innerHTML = '';
    
    if (timeSlots.length === 0) {
        timeSlotsList.innerHTML = '<p>No time slots added yet.</p>';
        return;
    }
    
    timeSlots.forEach(slot => {
        const timeSlotElement = document.createElement('div');
        timeSlotElement.className = 'time-slot-item';
        timeSlotElement.innerHTML = `
            <div class="time-slot-time">
                ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}
            </div>
            <div class="time-slot-actions">
                <button class="delete-override-time-slot" data-id="${slot.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        timeSlotsList.appendChild(timeSlotElement);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-override-time-slot').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const slotId = parseInt(button.dataset.id);
            // Remove from UI immediately for better UX
            button.closest('.time-slot-item').remove();
            
            // If there are no more slots, show the empty message
            if (timeSlotsList.querySelectorAll('.time-slot-item').length === 0) {
                timeSlotsList.innerHTML = '<p>No time slots added yet.</p>';
            }
        });
    });
}

async function handleAddOverrideTimeSlot() {
    const startTime = dateOverrideElements.startTime.value;
    const endTime = dateOverrideElements.endTime.value;
    
    if (!startTime || !endTime) {
        showToast('Please select both start and end times', false);
        return;
    }
    
    if (startTime >= endTime) {
        showToast('End time must be after start time', false);
        return;
    }
    
    // Add to UI immediately for better UX
    const timeSlotsList = dateOverrideElements.timeSlotsList;
    
    // Remove empty message if present
    if (timeSlotsList.querySelector('p')) {
        timeSlotsList.innerHTML = '';
    }
    
    const timeSlotElement = document.createElement('div');
    timeSlotElement.className = 'time-slot-item';
    timeSlotElement.innerHTML = `
        <div class="time-slot-time">
            ${formatTime(startTime)} - ${formatTime(endTime)}
        </div>
        <div class="time-slot-actions">
            <button class="delete-override-time-slot">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    timeSlotsList.appendChild(timeSlotElement);
    
    // Add event listener to delete button
    timeSlotElement.querySelector('.delete-override-time-slot').addEventListener('click', (e) => {
        e.stopPropagation();
        timeSlotElement.remove();
        
        // If there are no more slots, show the empty message
        if (timeSlotsList.querySelectorAll('.time-slot-item').length === 0) {
            timeSlotsList.innerHTML = '<p>No time slots added yet.</p>';
        }
    });
    
    // Clear inputs
    dateOverrideElements.startTime.value = '';
    dateOverrideElements.endTime.value = '';
}

async function handleSaveOverride() {
    const date = dateOverrideElements.dateInput.value;
    
    if (!date) {
        showToast('Please select a date', false);
        return;
    }
    
    // Collect all time slots from UI
    const timeSlotElements = dateOverrideElements.timeSlotsList.querySelectorAll('.time-slot-item');
    const timeSlots = [];
    
    timeSlotElements.forEach(element => {
        const timeText = element.querySelector('.time-slot-time').textContent.trim();
        const [startTime, endTime] = timeText.split(' - ');
        
        timeSlots.push({
            startTime,
            endTime
        });
    });
    
    const overrideData = {
        id: currentDateOverrideId, // Will be null for new overrides
        doctorId: currentDoctorId,
        overrideDate: date,
        available: dateOverrideElements.availabilityToggle.checked,
        timeSlots
    };
    
    try {
        const result = await createOrUpdateDateOverride(currentDoctorId, overrideData);
        currentDateOverrideId = result.id;
        showToast('Special schedule saved successfully');
    } catch (error) {
        console.error('Error saving date override:', error);
        showToast('Failed to save special schedule', false);
    }
}

async function handleDeleteOverride() {
    if (!currentDateOverrideId) {
        showToast('No special schedule exists for this date', false);
        return;
    }
    
    try {
        await deleteDateOverride(currentDateOverrideId);
        showToast('Special schedule deleted successfully');
        
        // Reset UI
        currentDateOverrideId = null;
        dateOverrideElements.selectedDate.textContent = 'Select a date';
        dateOverrideElements.availabilityToggle.checked = false;
        dateOverrideElements.timeSlotsList.innerHTML = '<p>No time slots added yet.</p>';
    } catch (error) {
        showToast('Failed to delete special schedule', false);
    }
}

// Holiday Section
async function renderHolidays(holidaysList) {
    const holidaysContainer = holidayElements.list;
    holidaysContainer.innerHTML = '';
    
    if (!holidaysList || holidaysList.length === 0) {
        holidaysContainer.innerHTML = '<p>No holidays scheduled.</p>';
        return;
    }
    
    holidaysList.forEach(holiday => {
        const holidayElement = document.createElement('div');
        holidayElement.className = 'holiday-item';
        holidayElement.innerHTML = `
            <div class="holiday-details">
                <h4>${formatDate(holiday.holidayDate)}</h4>
                <p>${holiday.reason || 'No reason specified'}</p>
            </div>
            <div class="holiday-actions">
                <button class="btn btn-danger delete-holiday" data-id="${holiday.id}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
        
        holidaysContainer.appendChild(holidayElement);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-holiday').forEach(button => {
        button.addEventListener('click', () => handleRemoveHoliday(button.dataset.id));
    });
}

async function handleMarkTodayAsHoliday() {
    try {
        await markTodayAsHoliday(currentDoctorId);
        showToast('Today marked as holiday successfully');
        
        // Refresh holidays list
        const holidays = await fetchDoctorHolidays(currentDoctorId);
        renderHolidays(holidays);
    } catch (error) {
        showToast('Failed to mark today as holiday', false);
    }
}

async function handleMarkDateAsHoliday() {
    const date = holidayElements.dateInput.value;
    const reason = holidayElements.reasonInput.value;
    
    if (!date) {
        showToast('Please select a date', false);
        return;
    }
    
    const holidayData = {
        doctorId: currentDoctorId,
        holidayDate: date,
        reason
    };
    
    try {
        await addHoliday(currentDoctorId, holidayData);
        showToast('Holiday added successfully');
        
        // Clear inputs
        holidayElements.dateInput.value = '';
        holidayElements.reasonInput.value = '';
        
        // Refresh holidays list
        const holidaysList = await fetchDoctorHolidays(currentDoctorId);
        renderHolidays(holidaysList);
    } catch (error) {
        console.error('Error adding holiday:', error);
        showToast('Failed to add holiday', false);
    }
}

async function handleRemoveHoliday(holidayId) {
    try {
        await removeHoliday(holidayId);
        showToast('Holiday removed successfully');
        
        // Refresh holidays list
        const holidays = await fetchDoctorHolidays(currentDoctorId);
        renderHolidays(holidays);
    } catch (error) {
        showToast('Failed to remove holiday', false);
    }
}

// Settings Section
async function handleUpdateSlotDuration() {
    const duration = settings.slotDuration.value;
    
    if (!duration || duration < 10) {
        showToast('Please enter a valid duration (minimum 10 minutes)', false);
        return;
    }
    
    try {
        await updateSlotDuration(currentDoctorId, parseInt(duration));
        showToast('Slot duration updated successfully');
    } catch (error) {
        showToast('Failed to update slot duration', false);
    }
}

async function handleGenerateSlots() {
    const startDate = settings.startDate.value;
    const endDate = settings.endDate.value;
    
    if (!startDate || !endDate) {
        showToast('Please select both start and end dates', false);
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showToast('End date must be after start date', false);
        return;
    }
    
    try {
        await generateAppointmentSlots(currentDoctorId, startDate, endDate);
        showToast('Appointment slots generated successfully');
        
        // Clear inputs
        settings.startDate.value = '';
        settings.endDate.value = '';
    } catch (error) {
        showToast('Failed to generate appointment slots', false);
    }
}

function handleApplyTheme() {
    const theme = settings.themeSelector.value;
    
    // Remove existing theme classes
    document.body.classList.remove('dark-theme', 'blue-theme');
    
    // Apply selected theme
    if (theme !== 'light') {
        document.body.classList.add(`${theme}-theme`);
    }
    
    // Save theme preference
    localStorage.setItem('theme', theme);
    
    showToast('Theme applied successfully');
}

// Event Listeners
function setupEventListeners() {
    // Tab navigation
    ui.sidebarNavItems.forEach(item => {
        item.addEventListener('click', () => switchSection(item.dataset.target));
    });
    
    // Logout
    ui.logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
    
    // Calendar navigation
    calendarView.prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar(currentCalendarDate);
    });
    
    calendarView.nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar(currentCalendarDate);
    });
    
    // Weekly Schedule
    weeklySchedule.dayAvailabilityToggle.addEventListener('change', handleToggleDayAvailability);
    weeklySchedule.addTimeSlotBtn.addEventListener('click', handleAddTimeSlot);
    
    // Date Overrides
    dateOverrideElements.checkDateBtn.addEventListener('click', handleCheckDateOverride);
    dateOverrideElements.addTimeSlotBtn.addEventListener('click', handleAddOverrideTimeSlot);
    dateOverrideElements.saveBtn.addEventListener('click', handleSaveOverride);
    dateOverrideElements.deleteBtn.addEventListener('click', handleDeleteOverride);
    
    // Holidays
    holidayElements.markTodayBtn.addEventListener('click', handleMarkTodayAsHoliday);
    holidayElements.markDateBtn.addEventListener('click', handleMarkDateAsHoliday);
    
    // Settings
    settings.updateDurationBtn.addEventListener('click', handleUpdateSlotDuration);
    settings.generateSlotsBtn.addEventListener('click', handleGenerateSlots);
    settings.applyThemeBtn.addEventListener('click', handleApplyTheme);
    
    // Modal
    modal.closeSlotDetailsBtn.addEventListener('click', () => hideModal(modal.slotDetails));
    document.querySelector('.close-modal').addEventListener('click', () => hideModal(modal.slotDetails));
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal.slotDetails) {
            hideModal(modal.slotDetails);
        }
    });
}

// Init
async function initialize() {
    try {
        // Set minimum date for date inputs
        setDateInputMinimum();
        
        // Setup event listeners
        setupEventListeners();
        
        // Apply saved theme if any
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            settings.themeSelector.value = savedTheme;
            handleApplyTheme();
        }
        
        // Get doctor info from localStorage
        const doctorData = JSON.parse(localStorage.getItem('doctorData'));
        
        if (!doctorData || !doctorData.doctorId) {
            // For demo purposes, use a default doctor ID
            currentDoctorId = 1;
            
            // In a real app, redirect to login page
            // window.location.href = 'login.html';
            // return;
        } else {
            currentDoctorId = doctorData.doctorId;
        }
        
        // Fetch doctor details
        const doctor = await fetchDoctorDetails(currentDoctorId);
        populateDoctorProfile(doctor);
        
        // Pre-fill slot duration in settings
        settings.slotDuration.value = doctor.slotDurationMinutes || 30;
        
        // Fetch and render weekly schedules
        const schedules = await fetchWeeklySchedules(currentDoctorId);
        renderWeeklyScheduleDays(schedules);
        
        // Select Monday as default day
        await handleDaySelection('MONDAY');
        
        // Set today's date as default for date inputs
        const today = new Date().toISOString().split('T')[0];
        dateOverrideElements.dateInput.value = today;
        settings.startDate.value = today;
        settings.endDate.value = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];
        
        // Fetch and render holidays
        const doctorHolidays = await fetchDoctorHolidays(currentDoctorId);
        renderHolidays(doctorHolidays);
        
        // Initialize dashboard
        initializeDashboard();
        
        // Hide loading overlay
        hideLoading();
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Failed to initialize the application', false);
        hideLoading();
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', initialize);