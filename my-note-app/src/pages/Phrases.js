import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

function Phrases() {
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: State for the form and for the languages dropdown ---
  const [languages, setLanguages] = useState([]);
  const [newPhrase, setNewPhrase] = useState({ phrase: '', definition: '', language_id: '', level: '' });

  useEffect(() => {
    // Fetch both phrases and languages when the component loads
    getPhrases();
    getLanguages();
  }, []);

  async function getPhrases() {
    setLoading(true);
    const { data, error } = await supabase
      .from('phrases')
      .select(`*, languages ( name )`);

    if (error) { console.error('Error fetching phrases:', error); }
    else { setPhrases(data); }
    setLoading(false);
  }

  // --- NEW: Function to fetch languages for the dropdown ---
  async function getLanguages() {
    const { data, error } = await supabase.from('languages').select('*');
    if (error) { console.error('Error fetching languages:', error); }
    else { setLanguages(data); }
  }

  // --- NEW: Function to handle changes in the form inputs ---
  function handleInputChange(event) {
    const { name, value } = event.target;
    setNewPhrase(prev => ({ ...prev, [name]: value }));
  }

  // --- NEW: Function to handle form submission ---
  async function handleFormSubmit(event) {
    event.preventDefault(); // Prevent page refresh
    if (!newPhrase.phrase || !newPhrase.language_id || !newPhrase.level) {
      alert('Please fill out the phrase, select a language, and choose a level.');
      return;
    }

    const { error } = await supabase.from('phrases').insert([
      { 
        phrase: newPhrase.phrase, 
        definition: newPhrase.definition, 
        language_id: newPhrase.language_id,
        level: newPhrase.level
      }
    ]);

    if (error) {
      console.error('Error inserting new phrase:', error);
    } else {
      // Clear the form and refresh the phrases list
      setNewPhrase({ phrase: '', definition: '', language_id: '', level: '' });
      getPhrases();
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">&larr; Back to Library</Link>
      <h1>Phrase Manager</h1>

      {/* --- NEW: Form for creating new phrases --- */}
      <form onSubmit={handleFormSubmit} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h2>Add New Phrase</h2>
        <input name="phrase" placeholder="New phrase or word" value={newPhrase.phrase} onChange={handleInputChange} style={{ display: 'block', marginBottom: '10px' }} />
        <input name="definition" placeholder="Definition" value={newPhrase.definition} onChange={handleInputChange} style={{ display: 'block', marginBottom: '10px' }} />
        <select name="language_id" value={newPhrase.language_id} onChange={handleInputChange} style={{ display: 'block', marginBottom: '10px' }}>
          <option value="" disabled>Select a language</option>
          {languages.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.name}</option>
          ))}
        </select>
        <select name="level" value={newPhrase.level} onChange={handleInputChange} style={{ display: 'block', marginBottom: '10px' }}>
          <option value="" disabled>Select a level</option>
          <option value="1">1 (Easy)</option>
          <option value="2">2 (Medium)</option>
          <option value="3">3 (Hard)</option>
          <option value="4">4 (Very Hard)</option>
          <option value="5">5 (Proper Noun)</option>
        </select>
        <button type="submit">Save Phrase</button>
      </form>

      {/* This is the table that displays the phrases */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Phrase</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Definition</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Language</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Level</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {phrases.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '10px' }}>No phrases yet.</td>
            </tr>
          ) : (
            phrases.map(phrase => (
              <tr key={phrase.id}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.phrase}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.definition}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.languages ? phrase.languages.name : 'N/A'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.level}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {/* Edit and Delete buttons will go here */}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Phrases;