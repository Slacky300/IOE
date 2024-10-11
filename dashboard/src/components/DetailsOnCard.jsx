import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DetailsOnCard = () => {
  const [stats, setStats] = useState({
    totalDistance: 0,
    totalTime: '',
    totalCalories: 0,
    averageSpeed: 0,
    totalRides: 0,
  });

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/gpsdata/weekly');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching weekly stats:', error);
      }
    };

    fetchWeeklyStats();
  }, []);

  return (
    <div className="card mb-4 shadow-sm">
      <div className="card-header bg-primary text-white">
        Weekly Ride Report
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6 mb-3">
            <h5>Total Distance Travelled</h5>
            <p className="text-muted">{stats.totalDistance.toFixed(2)} km</p>
          </div>
          <div className="col-md-6 mb-3">
            <h5>Total Time</h5>
            <p className="text-muted">{stats.totalTime}</p>
          </div>
          <div className="col-md-6 mb-3">
            <h5>Calories Burned</h5>
            <p className="text-muted">{stats.totalCalories.toFixed(2)} kcal</p>
          </div>
          <div className="col-md-6 mb-3">
            <h5>Average Speed</h5>
            <p className="text-muted">{stats.averageSpeed} km/h</p>
          </div>
          {/* <div className="col-md-6 mb-3">
            <h5>Rides Completed</h5>
            <p className="text-muted">{stats.totalRides} rides</p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default DetailsOnCard;
