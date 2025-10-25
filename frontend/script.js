// Travel Organizer JavaScript

class TravelOrganizer {
    constructor() {
        this.trips = JSON.parse(localStorage.getItem('trips')) || [];
        this.calendar = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCalendar();
        this.loadTrips();
        this.updateStatistics();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });

        // Trip form
        document.getElementById('tripForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTrip();
        });

        // Date validation
        document.getElementById('startDate').addEventListener('change', this.validateDates.bind(this));
        document.getElementById('endDate').addEventListener('change', this.validateDates.bind(this));
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        document.getElementById(sectionId).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

        // Load section-specific data
        if (sectionId === 'calendar') {
            this.refreshCalendar();
        } else if (sectionId === 'statistics') {
            this.updateCharts();
        }
    }

    // Trip Management
    saveTrip() {
        const tripData = {
            id: Date.now().toString(),
            name: document.getElementById('tripName').value,
            destination: document.getElementById('destination').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            description: document.getElementById('description').value,
            budget: document.getElementById('budget').value || 0,
            createdAt: new Date().toISOString()
        };

        this.trips.push(tripData);
        this.saveTripsToStorage();
        this.loadTrips();
        this.updateStatistics();
        this.refreshCalendar();

        // Close modal and reset form
        bootstrap.Modal.getInstance(document.getElementById('tripModal')).hide();
        document.getElementById('tripForm').reset();

        this.showNotification('Trip saved successfully!', 'success');
    }

    loadTrips() {
        const tripsList = document.getElementById('tripsList');
        const recentTrips = document.getElementById('recentTrips');

        if (this.trips.length === 0) {
            tripsList.innerHTML = this.getEmptyState('trips');
            recentTrips.innerHTML = this.getEmptyState('recent');
            return;
        }

        // Sort trips by start date (most recent first)
        const sortedTrips = [...this.trips].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

        // Display all trips
        tripsList.innerHTML = sortedTrips.map(trip => this.createTripCard(trip)).join('');

        // Display recent trips (last 3)
        recentTrips.innerHTML = sortedTrips.slice(0, 3).map(trip => this.createRecentTripCard(trip)).join('');
    }

    createTripCard(trip) {
        const startDate = new Date(trip.startDate).toLocaleDateString();
        const endDate = new Date(trip.endDate).toLocaleDateString();
        const duration = this.calculateDuration(trip.startDate, trip.endDate);

        return `
            <div class="col-md-6 col-lg-4">
                <div class="trip-card">
                    <div class="trip-header">
                        <div>
                            <h5 class="trip-title">${trip.name}</h5>
                            <p class="trip-destination">
                                <i class="fas fa-map-marker-alt me-1"></i>${trip.destination}
                            </p>
                        </div>
                    </div>
                    <div class="trip-dates">
                        <div class="date-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${startDate}</span>
                        </div>
                        <div class="date-item">
                            <i class="fas fa-calendar-check"></i>
                            <span>${endDate}</span>
                        </div>
                        <div class="date-item">
                            <i class="fas fa-clock"></i>
                            <span>${duration} days</span>
                        </div>
                    </div>
                    ${trip.description ? `<p class="text-muted">${trip.description}</p>` : ''}
                    ${trip.budget > 0 ? `<p class="text-success"><strong>Budget: $${parseInt(trip.budget).toLocaleString()}</strong></p>` : ''}
                    <div class="trip-actions">
                        <button class="btn btn-primary btn-sm" onclick="travelApp.editTrip('${trip.id}')">
                            <i class="fas fa-edit me-1"></i>Edit
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="travelApp.viewTrip('${trip.id}')">
                            <i class="fas fa-eye me-1"></i>View
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="travelApp.deleteTrip('${trip.id}')">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createRecentTripCard(trip) {
        const startDate = new Date(trip.startDate).toLocaleDateString();
        const duration = this.calculateDuration(trip.startDate, trip.endDate);

        return `
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h6 class="card-title">${trip.name}</h6>
                        <p class="card-text text-muted">
                            <i class="fas fa-map-marker-alt me-1"></i>${trip.destination}
                        </p>
                        <p class="card-text">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>${startDate} • ${duration} days
                            </small>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    editTrip(tripId) {
        const trip = this.trips.find(t => t.id === tripId);
        if (!trip) return;

        // Populate form with trip data
        document.getElementById('tripName').value = trip.name;
        document.getElementById('destination').value = trip.destination;
        document.getElementById('startDate').value = trip.startDate;
        document.getElementById('endDate').value = trip.endDate;
        document.getElementById('description').value = trip.description;
        document.getElementById('budget').value = trip.budget;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('tripModal'));
        modal.show();

        // Update save button to edit mode
        const saveBtn = document.querySelector('#tripModal .btn-primary');
        saveBtn.textContent = 'Update Trip';
        saveBtn.onclick = () => this.updateTrip(tripId);
    }

    updateTrip(tripId) {
        const tripIndex = this.trips.findIndex(t => t.id === tripId);
        if (tripIndex === -1) return;

        this.trips[tripIndex] = {
            ...this.trips[tripIndex],
            name: document.getElementById('tripName').value,
            destination: document.getElementById('destination').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            description: document.getElementById('description').value,
            budget: document.getElementById('budget').value || 0,
            updatedAt: new Date().toISOString()
        };

        this.saveTripsToStorage();
        this.loadTrips();
        this.updateStatistics();
        this.refreshCalendar();

        bootstrap.Modal.getInstance(document.getElementById('tripModal')).hide();
        this.showNotification('Trip updated successfully!', 'success');
    }

    deleteTrip(tripId) {
        if (confirm('Are you sure you want to delete this trip?')) {
            this.trips = this.trips.filter(t => t.id !== tripId);
            this.saveTripsToStorage();
            this.loadTrips();
            this.updateStatistics();
            this.refreshCalendar();
            this.showNotification('Trip deleted successfully!', 'success');
        }
    }

    viewTrip(tripId) {
        const trip = this.trips.find(t => t.id === tripId);
        if (!trip) return;

        // Create a detailed view modal
        const modalHtml = `
            <div class="modal fade" id="viewTripModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${trip.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Destination</h6>
                                    <p><i class="fas fa-map-marker-alt me-2"></i>${trip.destination}</p>
                                    
                                    <h6>Duration</h6>
                                    <p><i class="fas fa-calendar me-2"></i>${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}</p>
                                    <p><i class="fas fa-clock me-2"></i>${this.calculateDuration(trip.startDate, trip.endDate)} days</p>
                                </div>
                                <div class="col-md-6">
                                    ${trip.budget > 0 ? `
                                        <h6>Budget</h6>
                                        <p><i class="fas fa-dollar-sign me-2"></i>$${parseInt(trip.budget).toLocaleString()}</p>
                                    ` : ''}
                                    
                                    <h6>Created</h6>
                                    <p><i class="fas fa-calendar-plus me-2"></i>${new Date(trip.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            ${trip.description ? `
                                <div class="mt-3">
                                    <h6>Description</h6>
                                    <p>${trip.description}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="travelApp.editTrip('${trip.id}'); bootstrap.Modal.getInstance(document.getElementById('viewTripModal')).hide();">
                                <i class="fas fa-edit me-1"></i>Edit Trip
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('viewTripModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('viewTripModal'));
        modal.show();
    }

    // Calendar Management
    initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: false, // We'll use our custom header
            events: this.getCalendarEvents(),
            eventClick: (info) => {
                this.viewTrip(info.event.id);
            },
            eventDidMount: (info) => {
                info.el.style.borderRadius = '8px';
                info.el.style.border = 'none';
                this.updateEventColors(info);
            },
            viewDidMount: (view) => {
                this.updateCalendarTitle(view);
                this.updateCalendarStats();
            }
        });
        this.calendar.render();
        this.updateCalendarTitle(this.calendar.view);
        this.updateCalendarStats();
    }

    changeCalendarView(viewType) {
        if (this.calendar) {
            this.calendar.changeView(viewType);
            
            // Update active button
            document.querySelectorAll('.btn-group .btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const activeBtn = document.getElementById(viewType + 'Btn');
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        }
    }

    navigateCalendar(direction) {
        if (this.calendar) {
            if (direction === 'prev') {
                this.calendar.prev();
            } else if (direction === 'next') {
                this.calendar.next();
            } else if (direction === 'today') {
                this.calendar.today();
            }
        }
    }

    updateCalendarTitle(view) {
        const titleEl = document.getElementById('calendarTitle');
        if (titleEl && view) {
            titleEl.textContent = view.title;
        }
    }

    updateCalendarStats() {
        const upcomingTrips = this.trips.filter(trip => new Date(trip.startDate) > new Date()).length;
        const destinations = new Set(this.trips.map(trip => trip.destination)).size;
        const totalDays = this.trips.reduce((total, trip) => {
            return total + this.calculateDuration(trip.startDate, trip.endDate);
        }, 0);
        const totalBudget = this.trips.reduce((total, trip) => total + (parseFloat(trip.budget) || 0), 0);

        document.getElementById('upcomingTripsCount').textContent = upcomingTrips;
        document.getElementById('destinationsCount').textContent = destinations;
        document.getElementById('totalDaysCount').textContent = totalDays;
        document.getElementById('totalBudgetCount').textContent = `$${totalBudget.toLocaleString()}`;
    }

    updateEventColors(info) {
        const trip = this.trips.find(t => t.id === info.event.id);
        if (trip) {
            const now = new Date();
            const startDate = new Date(trip.startDate);
            const endDate = new Date(trip.endDate);
            
            if (startDate <= now && endDate >= now) {
                // Current trip
                info.el.style.backgroundColor = '#2ecc71';
                info.el.style.borderColor = '#2ecc71';
            } else if (startDate > now) {
                // Upcoming trip
                info.el.style.backgroundColor = '#3498db';
                info.el.style.borderColor = '#3498db';
            } else {
                // Past trip
                info.el.style.backgroundColor = '#95a5a6';
                info.el.style.borderColor = '#95a5a6';
            }
        }
    }

    refreshCalendar() {
        if (this.calendar) {
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(this.getCalendarEvents());
            this.updateCalendarStats();
        }
    }

    getCalendarEvents() {
        return this.trips.map(trip => ({
            id: trip.id,
            title: trip.name,
            start: trip.startDate,
            end: trip.endDate,
            backgroundColor: this.getEventColor(trip.destination),
            borderColor: this.getEventColor(trip.destination),
            extendedProps: {
                destination: trip.destination,
                description: trip.description,
                budget: trip.budget
            }
        }));
    }

    getEventColor(destination) {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
        const hash = destination.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return colors[Math.abs(hash) % colors.length];
    }

    syncCalendar() {
        this.showCalendarSyncModal();
    }

    showCalendarSyncModal() {
        const modalHtml = `
            <div class="modal fade" id="calendarSyncModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-sync me-2"></i>Calendar Sync Options
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-download fa-3x text-primary mb-3"></i>
                                            <h5 class="card-title">Export to ICS File</h5>
                                            <p class="card-text">Download your trips as an ICS file that can be imported into any calendar application.</p>
                                            <button class="btn btn-primary" onclick="travelApp.exportToICS()">
                                                <i class="fas fa-download me-2"></i>Export ICS
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-body text-center">
                                            <i class="fab fa-google fa-3x text-danger mb-3"></i>
                                            <h5 class="card-title">Google Calendar</h5>
                                            <p class="card-text">Add your trips directly to Google Calendar (opens in new tab).</p>
                                            <button class="btn btn-danger" onclick="travelApp.exportToGoogleCalendar()">
                                                <i class="fab fa-google me-2"></i>Add to Google Calendar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row mt-4">
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-calendar-plus fa-3x text-success mb-3"></i>
                                            <h5 class="card-title">Outlook Calendar</h5>
                                            <p class="card-text">Generate Outlook calendar links for your trips.</p>
                                            <button class="btn btn-success" onclick="travelApp.exportToOutlook()">
                                                <i class="fas fa-calendar-plus me-2"></i>Add to Outlook
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-body text-center">
                                            <i class="fas fa-mobile-alt fa-3x text-info mb-3"></i>
                                            <h5 class="card-title">Apple Calendar</h5>
                                            <p class="card-text">Generate Apple Calendar links for your trips.</p>
                                            <button class="btn btn-info" onclick="travelApp.exportToAppleCalendar()">
                                                <i class="fas fa-mobile-alt me-2"></i>Add to Apple Calendar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('calendarSyncModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('calendarSyncModal'));
        modal.show();
    }

    exportToICS() {
        if (this.trips.length === 0) {
            this.showNotification('No trips to export!', 'warning');
            return;
        }

        const icsContent = this.generateICSContent();
        this.downloadFile(icsContent, 'travel-trips.ics', 'text/calendar');
        this.showNotification('ICS file downloaded successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('calendarSyncModal')).hide();
    }

    generateICSContent() {
        let ics = 'BEGIN:VCALENDAR\n';
        ics += 'VERSION:2.0\n';
        ics += 'PRODID:-//Travel Organizer//Travel Trips//EN\n';
        ics += 'CALSCALE:GREGORIAN\n';
        ics += 'METHOD:PUBLISH\n';

        this.trips.forEach(trip => {
            const startDate = this.formatDateForICS(trip.startDate);
            const endDate = this.formatDateForICS(trip.endDate);
            const createdDate = this.formatDateForICS(trip.createdAt);
            const uid = `trip-${trip.id}@travelorganizer.com`;

            ics += 'BEGIN:VEVENT\n';
            ics += `UID:${uid}\n`;
            ics += `DTSTART:${startDate}\n`;
            ics += `DTEND:${endDate}\n`;
            ics += `DTSTAMP:${createdDate}\n`;
            ics += `SUMMARY:${trip.name}\n`;
            ics += `DESCRIPTION:${trip.description || 'Travel trip to ' + trip.destination}\n`;
            ics += `LOCATION:${trip.destination}\n`;
            if (trip.budget > 0) {
                ics += `COMMENT:Budget: $${trip.budget}\n`;
            }
            ics += 'END:VEVENT\n';
        });

        ics += 'END:VCALENDAR';
        return ics;
    }

    formatDateForICS(dateString) {
        const date = new Date(dateString);
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    exportToGoogleCalendar() {
        if (this.trips.length === 0) {
            this.showNotification('No trips to export!', 'warning');
            return;
        }

        // Open Google Calendar with the first trip as an example
        const firstTrip = this.trips[0];
        const startDate = this.formatDateForGoogleCalendar(firstTrip.startDate);
        const endDate = this.formatDateForGoogleCalendar(firstTrip.endDate);
        
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(firstTrip.name)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(firstTrip.description || 'Travel trip to ' + firstTrip.destination)}&location=${encodeURIComponent(firstTrip.destination)}`;
        
        window.open(googleCalendarUrl, '_blank');
        this.showNotification('Google Calendar opened! You can add more trips manually.', 'info');
        bootstrap.Modal.getInstance(document.getElementById('calendarSyncModal')).hide();
    }

    exportToOutlook() {
        if (this.trips.length === 0) {
            this.showNotification('No trips to export!', 'warning');
            return;
        }

        // Generate Outlook calendar links for each trip
        const outlookLinks = this.trips.map(trip => {
            const startDate = this.formatDateForOutlook(trip.startDate);
            const endDate = this.formatDateForOutlook(trip.endDate);
            const subject = encodeURIComponent(trip.name);
            const body = encodeURIComponent(`${trip.description || 'Travel trip to ' + trip.destination}\n\nDestination: ${trip.destination}\nBudget: $${trip.budget || 'Not set'}`);
            const location = encodeURIComponent(trip.destination);
            
            return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&startdt=${startDate}&enddt=${endDate}&body=${body}&location=${location}`;
        });

        // Open the first trip in Outlook
        window.open(outlookLinks[0], '_blank');
        
        if (outlookLinks.length > 1) {
            this.showNotification(`Opened first trip in Outlook. ${outlookLinks.length - 1} more trips available.`, 'info');
        } else {
            this.showNotification('Opened trip in Outlook!', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('calendarSyncModal')).hide();
    }

    exportToAppleCalendar() {
        if (this.trips.length === 0) {
            this.showNotification('No trips to export!', 'warning');
            return;
        }

        // Generate Apple Calendar links for each trip
        const appleLinks = this.trips.map(trip => {
            const startDate = this.formatDateForApple(trip.startDate);
            const endDate = this.formatDateForApple(trip.endDate);
            const title = encodeURIComponent(trip.name);
            const notes = encodeURIComponent(`${trip.description || 'Travel trip to ' + trip.destination}\n\nDestination: ${trip.destination}\nBudget: $${trip.budget || 'Not set'}`);
            const location = encodeURIComponent(trip.destination);
            
            return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${notes}&location=${location}`;
        });

        // Open the first trip
        window.open(appleLinks[0], '_blank');
        
        if (appleLinks.length > 1) {
            this.showNotification(`Opened first trip. ${appleLinks.length - 1} more trips available.`, 'info');
        } else {
            this.showNotification('Opened trip!', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('calendarSyncModal')).hide();
    }

    formatDateForGoogleCalendar(dateString) {
        const date = new Date(dateString);
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    formatDateForOutlook(dateString) {
        const date = new Date(dateString);
        return date.toISOString();
    }

    formatDateForApple(dateString) {
        const date = new Date(dateString);
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    addEvent() {
        this.showSection('trips');
        document.querySelector('[data-bs-target="#tripModal"]').click();
    }

    // Statistics
    updateStatistics() {
        const totalTrips = this.trips.length;
        const countriesVisited = new Set(this.trips.map(trip => trip.destination)).size;
        const upcomingTrips = this.trips.filter(trip => new Date(trip.startDate) > new Date()).length;
        const daysTraveled = this.trips.reduce((total, trip) => {
            return total + this.calculateDuration(trip.startDate, trip.endDate);
        }, 0);

        document.getElementById('totalTrips').textContent = totalTrips;
        document.getElementById('countriesVisited').textContent = countriesVisited;
        document.getElementById('upcomingTrips').textContent = upcomingTrips;
        document.getElementById('daysTraveled').textContent = daysTraveled;
    }

    initializeCharts() {
        this.createMonthlyChart();
        this.createDestinationsChart();
        this.createTimelineChart();
    }

    updateCharts() {
        this.createMonthlyChart();
        this.createDestinationsChart();
        this.createTimelineChart();
    }

    createMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        const monthlyData = this.getMonthlyData();
        
        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Trips',
                    data: monthlyData.data,
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createDestinationsChart() {
        const ctx = document.getElementById('destinationsChart').getContext('2d');
        
        if (this.charts.destinations) {
            this.charts.destinations.destroy();
        }

        const destinationsData = this.getDestinationsData();
        
        this.charts.destinations = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: destinationsData.labels,
                datasets: [{
                    data: destinationsData.data,
                    backgroundColor: [
                        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
                        '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createTimelineChart() {
        const ctx = document.getElementById('timelineChart').getContext('2d');
        
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        const timelineData = this.getTimelineData();
        
        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timelineData.labels,
                datasets: [{
                    label: 'Cumulative Trips',
                    data: timelineData.data,
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    getMonthlyData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = new Array(12).fill(0);
        
        this.trips.forEach(trip => {
            const month = new Date(trip.startDate).getMonth();
            data[month]++;
        });
        
        return {
            labels: months,
            data: data
        };
    }

    getDestinationsData() {
        const destinationCount = {};
        this.trips.forEach(trip => {
            destinationCount[trip.destination] = (destinationCount[trip.destination] || 0) + 1;
        });
        
        const sorted = Object.entries(destinationCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);
        
        return {
            labels: sorted.map(([dest]) => dest),
            data: sorted.map(([,count]) => count)
        };
    }

    getTimelineData() {
        const sortedTrips = [...this.trips].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        const data = [];
        const labels = [];
        let cumulative = 0;
        
        sortedTrips.forEach((trip, index) => {
            cumulative++;
            data.push(cumulative);
            labels.push(new Date(trip.startDate).toLocaleDateString());
        });
        
        return {
            labels: labels,
            data: data
        };
    }

    // Utility Functions
    calculateDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    validateDates() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            document.getElementById('endDate').setCustomValidity('End date must be after start date');
        } else {
            document.getElementById('endDate').setCustomValidity('');
        }
    }

    saveTripsToStorage() {
        localStorage.setItem('trips', JSON.stringify(this.trips));
    }

    getEmptyState(type) {
        if (type === 'trips') {
            return `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-suitcase"></i>
                        <h3>No trips yet</h3>
                        <p>Start planning your next adventure!</p>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#tripModal">
                            <i class="fas fa-plus me-2"></i>Add Your First Trip
                        </button>
                    </div>
                </div>
            `;
        } else if (type === 'recent') {
            return `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <h3>No recent trips</h3>
                        <p>Your recent trips will appear here</p>
                    </div>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const notification = document.createElement('div');
        notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the application
const travelApp = new TravelOrganizer();

// Global functions for HTML onclick handlers
function showSection(sectionId) {
    travelApp.showSection(sectionId);
}

function saveTrip() {
    travelApp.saveTrip();
}

function syncCalendar() {
    travelApp.syncCalendar();
}

function addEvent() {
    travelApp.addEvent();
}
