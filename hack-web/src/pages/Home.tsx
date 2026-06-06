import React from 'react';
import { Link } from 'react-router';

export default function Home() {
  return (
    <div>
      <h1>Welcome to the App</h1>
      <h3>Choose a view to enter:</h3>
      <nav>
        <ul>
          <li><Link to="/usuario">👤 Go to Usuario View</Link></li>
          <li><Link to="/admin">⚙️ Go to Admin View</Link></li>
          <li><Link to="/repartidor">🛵 Go to Repartidor View</Link></li>
        </ul>
      </nav>
    </div>
  );
};

