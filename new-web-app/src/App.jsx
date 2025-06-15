import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Library from './pages/Library.jsx';
import ContentPage from './pages/ContentPage.jsx';
import Phrases from './pages/Phrases.jsx';
// We are no longer importing a separate Navbar component.

// We have removed the import for App.css to prevent style conflicts.

function App() {
  return (
    <BrowserRouter>
      {/* This main container provides the consistent padding for all pages */}
      <main className="container mx-auto p-6">
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/content/:id" element={<ContentPage />} />
            <Route path="/phrases" element={<Phrases />} />
          </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
