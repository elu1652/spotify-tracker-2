import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.tsx';
import Menu from './pages/Menu.tsx';
import MostPlayed from './pages/MostPlayed.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/most-played" element={<MostPlayed />} />
      </Routes>
    </Router>
  );
}

export default App;