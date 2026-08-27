import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import GenrePage from './pages/GenrePage';
import ActorPage from './pages/ActorPage';
import './index.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
});

export default function App() {
  const [dbConnected, setDbConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      const response = await apiClient.get('/health');
      setDbConnected(response.data.status === 'connected');
    } catch (error) {
      setDbConnected(false);
      console.error('Database connection check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!dbConnected) {
    return (
      <div className="container">
        <div className="header">
          <h1>🎬 Movie Recommendation Engine</h1>
        </div>
        <div className="error">
          <strong>⚠️ Database Connection Error</strong>
          <p>Unable to connect to the database. Please ensure:</p>
          <ul>
            <li>CognoDB instance is running</li>
            <li>Environment variables are properly configured (.env file)</li>
            <li>Backend server is running on port 5000</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/genre/:id" element={<GenrePage />} />
          <Route path="/actor/:id" element={<ActorPage />} />
        </Routes>
      </div>
    </Router>
  );
}
