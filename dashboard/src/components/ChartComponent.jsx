import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';

const ChartComponent = () => {
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], // Default labels
    datasets: [
      {
        label: 'Distance (km)',
        data: [], // Initially empty
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
      },
    ],
  });

  const getTodayIndex = () => {
    const today = new Date();
    return today.getDay(); // 0 (Sunday) to 6 (Saturday)
  };

  const reorderDataToStartFromToday = (data) => {
    const todayIndex = getTodayIndex();
    // Shift the data array so that the week starts from today
    return [...data.slice(todayIndex), ...data.slice(0, todayIndex)];
  };

  useEffect(() => {
    // Function to fetch weekly distance data from the backend
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/weeklyreport'); // Replace with your actual API URL
        const reportData = response.data.weeklyData.map(item => item.totalDistance);

        // Reorder the data so it starts from today
        const reorderedData = reorderDataToStartFromToday(reportData);

        // Update the chart with fetched and reordered data
        setChartData(prevState => ({
          ...prevState,
          datasets: [
            {
              ...prevState.datasets[0],
              data: reorderedData, // Use the reordered data
            },
          ],
        }));
      } catch (error) {
        console.error('Failed to fetch weekly report data:', error);
      }
    };

    fetchData();
  }, []); // Empty dependency array to fetch data only once when the component mounts

  return (
    <div className="card mb-4">
      <div className="card-header">Weekly Distance Traveled</div>
      <div className="card-body">
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default ChartComponent;
