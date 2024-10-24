import React, { useEffect, useState } from 'react';
import axios from 'axios';

const WeeklyReport = () => {
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    // Fetch the weekly data from the backend
    const fetchWeeklyData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/weeklyreport`, {
          params: {
              page: 1, // or any other page number
              limit: 10, // or any other limit
              startDate: '2024-10-6', // start date for filtering
              endDate: '2024-10-12' // today's date in 'YYYY-MM-DD' format
          }
      });
        const data = response.data.weeklyData.map((item) => {
          const timeInHours = item.avgSpeed > 0 ? item.totalDistance / item.avgSpeed : 0;
          const timeInMinutes = timeInHours * 60;

          return {
            day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][item.dayOfWeek - 1],
            distance: `${item.totalDistance.toFixed(2)} km`,
            time: `${timeInMinutes.toFixed(0)} mins`
          };
        });
        setReportData(data);
      } catch (error) {
        console.error('Failed to fetch weekly data:', error);
      }
    };

    fetchWeeklyData();
  }, []);

  return (
    <div className="card mb-4">
      <div className="card-header">Weekly Ride Report</div>
      <div className="card-body">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Day</th>
              <th>Distance</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((item, index) => (
              <tr key={index}>
                <td>{item.day}</td>
                <td>{item.distance}</td>
                <td>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyReport;
