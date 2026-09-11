import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <Routes>
      <Route path="/registro" element={<RegisterPage />} />
      {/* Temporal: redirige la raíz a /registro hasta que exista /login en HU-04 */}
      <Route path="/" element={<Navigate to="/registro" />} />
    </Routes>
  );
}

export default App;