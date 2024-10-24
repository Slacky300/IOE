import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';

const ChartComponent = () => {
  const [chartData, setChartData] = useState({
    labels: [], 
    datasets: [
      {
        label: 'Distance (km)',
        data: Array(7).fill(0),
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
      },
    ],
  });

 

  const generateLabelsForCurrentWeek = () => {
    const today = new Date();
    const labels = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - today.getDay() + i); 
      labels.push(day.toLocaleString('en-US', { weekday: 'short' })); 
    }
    return labels;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/weeklyreport`, {
          params: {
            page: 1, 
            limit: 10,
            startDate: '2024-10-06', 
            endDate: new Date().toISOString().split('T')[0], 
          },
        });

        const distanceData = Array(7).fill(0);

        response.data.weeklyData.forEach(item => {
          const dayIndex = item.dayOfWeek - 1; 
          distanceData[dayIndex] = item.totalDistance; 
        });

        const labels = generateLabelsForCurrentWeek();

        setChartData({
          labels, 
          datasets: [
            {
              ...chartData.datasets[0],
              data: distanceData,
            },
          ],
        });
      } catch (error) {
        console.error('Failed to fetch weekly report data:', error);
      }
    };

    fetchData();
  }, []); 

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
