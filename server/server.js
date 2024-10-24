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
            await mongoose.connect('mongodb+srv://rehmankhan300a:XhId8jvbJSctfduX@cluster0.plrckac.mongodb.net/ioe_empty?retryWrites=true&w=majority');
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



app.post('/receive', async (req, res) => {
    try {
        const { latitude, longitude, altitude, date, time } = req.body;

        const timestamp = new Date(`${date}T${time}`);

        const currPoint = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };

        const speed = 10; 

        const distanceTravelled = calculateDistance(lastPoint, currPoint);

        const caloriesBurned = calculateCalories(speed, distanceTravelled);

        const gpsData = new GpsData({
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            speed: speed,
            timestamp,
            distanceTravelled,
            caloriesBurned
        });

        await gpsData.save();

        lastPoint = currPoint;

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
    const { page = 1, limit = 50, startDate, endDate } = req.query;

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
    const { startDate, endDate } = req.query;

    const now = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(now);
    if (!startDate) start.setDate(now.getDate() - 7);

    try {
        const weeklyData = await GpsData.aggregate([
            {
                $match: {
                    timestamp: { $gte: start, $lte: now }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$timestamp" },
                    totalDistance: { $sum: "$distanceTravelled" },
                    avgSpeed: { $avg: "$speed" },
                    count: { $sum: 1 },
                    timestamps: { $push: "$timestamp" } // Collect all timestamps for this day
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result to include human-readable day names and timestamps
        const formattedData = weeklyData.map(dayData => {
            return {
                dayOfWeek: dayData._id,
                totalDistance: dayData.totalDistance,
                avgSpeed: dayData.avgSpeed,
                count: dayData.count,
                timestamps: dayData.timestamps // Include the timestamps
            };
        });

        res.json({ weeklyData: formattedData });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch weekly data' });
    }
});



app.get('/api/gpsdata/weekly', async (req, res) => {
    const { startDate, endDate } = req.query;

    // Set default values for startDate and endDate
    const today = endDate ? new Date(endDate) : new Date();  // Defaults to today's date if endDate is not provided
    const startOfWeek = startDate ? new Date(startDate) : new Date(today.setDate(today.getDate() - today.getDay()));  // Defaults to start of the week if startDate is not provided

    try {
        const gpsData = await GpsData.find({ timestamp: { $gte: startOfWeek, $lte: today } });

        // Calculate total distance, calories burned, and time spent
        const totalDistance = gpsData.reduce((acc, data) => acc + data.distanceTravelled, 0);
        const totalCalories = gpsData.reduce((acc, data) => acc + data.caloriesBurned, 0);
        const totalTime = gpsData.reduce((acc, data) => acc + (data.distanceTravelled / data.speed), 0); // Total time in hours
        const totalRides = gpsData.length;
        const averageSpeed = totalRides > 0 ? (totalDistance / totalTime).toFixed(2) : 0;  // Avoid division by zero

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
