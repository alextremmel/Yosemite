import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Library from './pages/Library';
import ContentPage from './pages/ContentPage';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* This route shows your Library component on the main page */}
          <Route path="/" element={<Library />} />

          {/* This route shows a specific piece of content */}
          <Route path="/content/:id" element={<ContentPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;