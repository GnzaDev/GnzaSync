import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import Overlay from './pages/Overlay';

export default function App() {
  const [isOverlay] = useState(window.location.pathname === '/overlay');

  useEffect(() => {
    if (isOverlay) {
      document.body.style.backgroundColor = 'transparent';
    } else {
      document.body.style.backgroundColor = '#0f1115';
    }
  }, [isOverlay]);

  return isOverlay ? <Overlay /> : <Dashboard />;
}
