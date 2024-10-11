// Dashboard.js
import React from 'react';
import ChartComponent from './ChartComponent';
import MapComponent from './MapComponent';
import WeeklyReport from './WeeklyReport';
import DetailsOnCard from './DetailsOnCard';

const Dashboard = () => {
  return (
    <div className="container">
      <h1 className="my-4 text-center">Bicycle Tracker Dashboard</h1>
      <div className="row">
        <div className='col-md-12'>
          <DetailsOnCard />
        </div>
        <div className="col-md-6">
          <ChartComponent />
        </div>
        <div className="col-md-6">
          <MapComponent />
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <WeeklyReport />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
