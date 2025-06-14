import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

function Phrases() {
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState([]);

  // --- UPDATED: More generic name for form data and state to track editing ---
  const [formData, setFormData] = useState({ phrase: '', definition: '', language_id: '', level: '' });
  const [editingId, setEditingId] = useState(null); // null = Create Mode, id = Edit Mode

  useEffect(() => {
    getPhrases();
    getLanguages();
  }, []);

  async function getPhrases() {
    setLoading(true);
    const { data, error } = await supabase.from('phrases').select(`*, languages ( name )`);
    if (error) { console.error('Error fetching phrases:', error); }
    else { setPhrases(data); }
    setLoading(false);
  }

  async function getLanguages() {
    const { data, error } = await supabase.from('languages').select('*');
    if (error) { console.error('Error fetching languages:', error); }
    else { setLanguages(data); }
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // --- UPDATED: This function now handles both Create and Update ---
  async function handleFormSubmit(event) {
    event.preventDefault();
    if (!formData.phrase || !formData.language_id || !formData.level) {
      alert('Please fill out the phrase, select a language, and choose a level.');
      return;
    }

    if (editingId) {
      // UPDATE existing phrase
      const { error } = await supabase.from('phrases')
        .update({ 
          phrase: formData.phrase, 
          definition: formData.definition, 
          language_id: formData.language_id, 
          level: formData.level 
        })
        .eq('id', editingId);
      if (error) { console.error('Error updating phrase:', error); }

    } else {
      // CREATE new phrase
      const { error } = await supabase.from('phrases').insert([
        { 
          phrase: formData.phrase, 
          definition: formData.definition, 
          language_id: formData.language_id, 
          level: formData.level 
        }
      ]);
      if (error) { console.error('Error inserting new phrase:', error); }
    }

    // Reset form and refresh list
    resetForm();
    getPhrases();
  }

  // --- NEW: Function to populate the form for editing ---
  function handleEdit(phrase) {
    setEditingId(phrase.id);
    setFormData({
      phrase: phrase.phrase,
      definition: phrase.definition,
      language_id: phrase.language_id,
      level: phrase.level,
    });
  }

  // --- NEW: Function to reset the form and exit edit mode ---
  function resetForm() {
    setEditingId(null);
    setFormData({ phrase: '', definition: '', language_id: '', level: '' });
  }

  // --- NEW: Function to delete a phrase ---
  async function handleDelete(phraseId) {
    const isConfirmed = window.confirm('Are you sure you want to delete this phrase?');
    if (isConfirmed) {
      const { error } = await supabase.from('phrases').delete().eq('id', phraseId);
      if (error) {
        console.error('Error deleting phrase:', error);
      } else {
        getPhrases(); // Refresh the list
      }
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">&larr; Back to Library</Link>
      <h1>Phrase Manager</h1>

      <form onSubmit={handleFormSubmit} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        {/* --- UPDATED: Dynamic form title --- */}
        <h2>{editingId ? 'Edit Phrase' : 'Add New Phrase'}</h2>
        <input name="phrase" placeholder="New phrase or word" value={formData.phrase} onChange={handleInputChange} style={{ display: 'block', marginBottom: '10px' }} />
        <input name="definition" placeholder="Definition" value={formData.definition} onChange={handleInputChange} style={{ display: 'block', marginBottom: '10px' }} />
        <select name="language_id" value={formData.language_id} onChange={handleInputChange} style={{ display: 'block', marginBottom: '10px' }}>
          <option value="" disabled>Select a language</option>
          {languages.map(lang => (<option key={lang.id} value={lang.id}>{lang.name}</option>))}
        </select>
        <select name="level" value={formData.level} onChange={handleInputChange} style={{ display: 'block', marginBottom: '10px' }}>
          <option value="" disabled>Select a level</option>
          <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
        </select>
        <button type="submit">{editingId ? 'Update Phrase' : 'Save Phrase'}</button>
        {/* --- NEW: Cancel button appears when editing --- */}
        {editingId && <button type="button" onClick={resetForm} style={{ marginLeft: '10px' }}>Cancel</button>}
      </form>

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
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '10px' }}>No phrases yet.</td></tr>
          ) : (
            phrases.map(phrase => (
              <tr key={phrase.id}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.phrase}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.definition}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.languages ? phrase.languages.name : 'N/A'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.level}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {/* --- NEW: Edit and Delete buttons --- */}
                  <button onClick={() => handleEdit(phrase)}>Edit</button>
                  <button onClick={() => handleDelete(phrase.id)} style={{ marginLeft: '10px' }}>Delete</button>
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