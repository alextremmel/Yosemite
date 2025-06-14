import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Library from './pages/Library';
import ContentPage from './pages/ContentPage';
import Phrases from './pages/Phrases'; // 1. Import the new component

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        {/* We will add a main navigation header here later */}
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/content/:id" element={<ContentPage />} />
          {/* 2. Add the new route for the phrases page */}
          <Route path="/phrases" element={<Phrases />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;