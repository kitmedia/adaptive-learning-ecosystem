import React from 'react';
import Dashboard from './pages/Dashboard';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🎓 Adaptive Learning Ecosystem</h1>
        <p>EbroValley Digital - AI-Powered Education Platform</p>
      </header>
      
      <main className="app-main">
        <Dashboard />
      </main>
      
      <footer className="app-footer">
        <p>Developed by ToñoAdPAOS & Claudio Supreme</p>
      </footer>
    </div>
  );
};

export default App;
