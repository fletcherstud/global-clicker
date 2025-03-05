import { useState } from 'react'
import GlobeComponent from './components/Globe'
import StatsTable from './components/StatsTable'
import './App.css'

function App() {
  const [stats] = useState({
    'United States': 1234,
    'United Kingdom': 856,
    'Japan': 654,
    'Germany': 432,
    'France': 321,
    'Canada': 298,
    'Australia': 245,
    'Brazil': 198
  })

  return (
    <div className="app">
      <GlobeComponent />
      <div className="stats-overlay">
        <StatsTable stats={stats} />
      </div>
    </div>
  )
}

export default App
