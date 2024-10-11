const express = require('express');
const mongoose = require('mongoose');
const app = express();
const haversine = require('haversine-distance');
const cors = require('cors');

app.use(express.json());

const gpsSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    speed: Number,
    timestamp: Date,
    distanceTravelled: Number,
    caloriesBurned: Number
});

const GpsData = mongoose.model('GpsData', gpsSchema);

app.use(cors());

const calculateCalories = (speed, distance) => {
    const MET = (speed < 16) ? 6 : (speed < 20) ? 8 : 10; 
    const weight = 70; 
    const hours = distance / speed;
    return MET * weight * hours;
};

const calculateDistance = (prevPoint, currPoint) => {
    if (!prevPoint) return 0; 
    const start = { latitude: prevPoint.latitude, longitude: prevPoint.longitude };
    const end = { latitude: currPoint.latitude, longitude: currPoint.longitude };
    return haversine(start, end) / 1000;  
};

let lastPoint = null; 

const startServer = async () => {

    const connectDb = async () => {
        try {
            await mongoose.connect('mongodb://localhost:27017/ioe_empty');
            console.log('MongoDB connected 🤖');
        } catch (err) {
            console.error(err.message);
            process.exit(1);
        }
    }

    await connectDb();

    app.listen(8080, '0.0.0.0', () => {
        console.log('Server started on http://localhost:8080');
    });
}

startServer();

app.post('/api/gpsdata', async (req, res) => {
    const { latitude, longitude, speed, timestamp } = req.body;

    if(!latitude || !longitude || !speed || !timestamp){
        console.log("Missing");
        return res.status(400).json({ error: 'Missing required data' });
    }


    const currPoint = { latitude, longitude };
    const distanceTravelled = calculateDistance(lastPoint, currPoint);

    const caloriesBurned = calculateCalories(speed, distanceTravelled);

    const gpsData = new GpsData({
        latitude,
        longitude,
        speed,
        timestamp: new Date(timestamp),
        distanceTravelled,
        caloriesBurned
    });

    await gpsData.save();

    lastPoint = { latitude, longitude };

    res.status(201).json({
        message: 'Data saved successfully',
        distanceTravelled,
        caloriesBurned
    });
});

app.post('/receive', async (req, res) => {
    try {
        const { latitude, longitude, altitude, date, time } = req.body;

        // Combine date and time to create a timestamp
        const timestamp = new Date(`${date}T${time}`);

        const currPoint = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };

        // Assuming speed is calculated elsewhere or comes with the data
        const speed = 10; // Placeholder speed in km/h for now

        // Calculate distance traveled from the last known point
        const distanceTravelled = calculateDistance(lastPoint, currPoint);

        // Calculate calories burned based on speed and distance
        const caloriesBurned = calculateCalories(speed, distanceTravelled);

        // Create a new GpsData document
        const gpsData = new GpsData({
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            speed: speed,
            timestamp,
            distanceTravelled,
            caloriesBurned
        });

        // Save the GPS data to the database
        await gpsData.save();

        // Update the last known point
        lastPoint = currPoint;

        // Respond with success
        res.status(201).json({
            message: 'Data saved successfully',
            distanceTravelled,
            caloriesBurned
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/gpsdata', async (req, res) => {
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    try {
        const gpsData = await GpsData.find(filter)
            .sort({ timestamp: -1 }) // Sort by timestamp in descending order
            .limit(limit * 1) // Limit the number of results per page
            .skip((page - 1) * limit); // Skip results for pagination

        const count = await GpsData.countDocuments(filter); // Get total count for pagination

        res.json({
            gpsData: gpsData.map(data => ({
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: data.timestamp,
                speed: data.speed,
                distanceTravelled: data.distanceTravelled,
                caloriesBurned: data.caloriesBurned
            })),
            totalPages: Math.ceil(count / limit), // Calculate total pages
            currentPage: page // Current page number
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' }); // Handle errors
    }
});


app.get('/api/weeklyreport', async (req, res) => {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    try {
        const weeklyData = await GpsData.aggregate([
            {
                $match: { timestamp: { $gte: oneWeekAgo, $lte: now } }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$timestamp" },
                    totalDistance: { $sum: "$distanceTravelled" },
                    avgSpeed: { $avg: "$speed" },  // Assuming you have speed data
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({ weeklyData });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch weekly data' });
    }
});



app.get('/api/gpsdata/weekly', async (req, res) => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Get start of the week (Sunday)

    try {
        const gpsData = await GpsData.find({ timestamp: { $gte: startOfWeek } });

        // Calculate total distance and calories burned
        const totalDistance = gpsData.reduce((acc, data) => acc + data.distanceTravelled, 0);
        const totalCalories = gpsData.reduce((acc, data) => acc + data.caloriesBurned, 0);
        const totalTime = gpsData.reduce((acc, data) => acc + data.distanceTravelled / data.speed, 0); // Total time in hours
        const totalRides = gpsData.length;
        const averageSpeed = (totalDistance / totalTime).toFixed(2);

        res.json({
            totalDistance,
            totalCalories,
            totalTime: `${Math.floor(totalTime)} hours ${Math.round((totalTime % 1) * 60)} minutes`,
            averageSpeed,
            totalRides
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


app.get('/api/gpsdata', async (req, res) => {
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    try {
        const gpsData = await GpsData.find(filter)
            .sort({ timestamp: -1 }) 
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await GpsData.countDocuments(filter);

        res.json({
            gpsData,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
