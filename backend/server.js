const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for demonstration
let trips = [
    {
        id: 1,
        name: "Weekend in Paris",
        destination: "Paris, France",
        startDate: "2024-02-15",
        endDate: "2024-02-18",
        description: "Romantic weekend getaway to the City of Light",
        budget: 1500.00,
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        name: "Business Trip to Tokyo",
        destination: "Tokyo, Japan",
        startDate: "2024-03-10",
        endDate: "2024-03-15",
        description: "Client meetings and project discussions",
        budget: 3000.00,
        createdAt: new Date().toISOString()
    }
];

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api/trips', (req, res) => {
    res.json(trips);
});

app.get('/api/trips/:id', (req, res) => {
    const trip = trips.find(t => t.id === parseInt(req.params.id));
    if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
});

app.post('/api/trips', (req, res) => {
    const { name, destination, startDate, endDate, description, budget } = req.body;
    
    if (!name || !destination || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newTrip = {
        id: trips.length + 1,
        name,
        destination,
        startDate,
        endDate,
        description: description || '',
        budget: budget || 0,
        createdAt: new Date().toISOString()
    };

    trips.push(newTrip);
    res.status(201).json(newTrip);
});

app.put('/api/trips/:id', (req, res) => {
    const tripIndex = trips.findIndex(t => t.id === parseInt(req.params.id));
    if (tripIndex === -1) {
        return res.status(404).json({ error: 'Trip not found' });
    }

    const { name, destination, startDate, endDate, description, budget } = req.body;
    
    trips[tripIndex] = {
        ...trips[tripIndex],
        name: name || trips[tripIndex].name,
        destination: destination || trips[tripIndex].destination,
        startDate: startDate || trips[tripIndex].startDate,
        endDate: endDate || trips[tripIndex].endDate,
        description: description || trips[tripIndex].description,
        budget: budget || trips[tripIndex].budget,
        updatedAt: new Date().toISOString()
    };

    res.json(trips[tripIndex]);
});

app.delete('/api/trips/:id', (req, res) => {
    const tripIndex = trips.findIndex(t => t.id === parseInt(req.params.id));
    if (tripIndex === -1) {
        return res.status(404).json({ error: 'Trip not found' });
    }

    trips.splice(tripIndex, 1);
    res.status(204).send();
});

// Statistics endpoints
app.get('/api/statistics/dashboard', (req, res) => {
    const totalTrips = trips.length;
    const upcomingTrips = trips.filter(trip => new Date(trip.startDate) > new Date()).length;
    const countriesVisited = new Set(trips.map(trip => trip.destination)).size;
    const totalDaysTraveled = trips.reduce((total, trip) => {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return total + diffDays;
    }, 0);
    const totalBudget = trips.reduce((total, trip) => total + (trip.budget || 0), 0);
    const averageBudget = totalTrips > 0 ? totalBudget / totalTrips : 0;

    res.json({
        totalTrips,
        upcomingTrips,
        countriesVisited,
        totalDaysTraveled,
        totalBudget,
        averageBudget
    });
});

app.get('/api/statistics/destinations', (req, res) => {
    const destinationCount = {};
    trips.forEach(trip => {
        destinationCount[trip.destination] = (destinationCount[trip.destination] || 0) + 1;
    });
    
    const destinationCounts = Object.entries(destinationCount)
        .map(([destination, count]) => [destination, count])
        .sort((a, b) => b[1] - a[1]);
    
    res.json(destinationCounts);
});

app.get('/api/statistics/monthly/:year', (req, res) => {
    const year = parseInt(req.params.year);
    const monthlyData = new Array(12).fill(0);
    
    trips.forEach(trip => {
        const tripDate = new Date(trip.startDate);
        if (tripDate.getFullYear() === year) {
            monthlyData[tripDate.getMonth()]++;
        }
    });
    
    const monthlyCounts = monthlyData.map((count, index) => [index + 1, count]);
    res.json(monthlyCounts);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Travel Organizer Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🗺️  API endpoints: http://localhost:${PORT}/api/trips`);
});
