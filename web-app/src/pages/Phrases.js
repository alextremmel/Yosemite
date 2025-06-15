import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

function Phrases() {
    const [phrases, setPhrases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [languages, setLanguages] = useState([]);
    const [formData, setFormData] = useState({ phrase: '', definition: '', language_id: '', level: '' });
    const [editingId, setEditingId] = useState(null);
    const [filters, setFilters] = useState({ searchTerm: '', language_id: '', level: '' });

    useEffect(() => {
        // Fetch initial data when component loads
        getPhrases();
        getLanguages();
    }, []);

    async function getPhrases() {
        setLoading(true);

        // Start with the base query
        let query = supabase.from('phrases').select(`*, languages ( name )`);

        // Add filters conditionally
        if (filters.searchTerm) {
            // Use ilike for case-insensitive "contains" search
            query = query.ilike('phrase', `%${filters.searchTerm}%`);
        }
        if (filters.language_id) {
            query = query.eq('language_id', filters.language_id);
        }
        if (filters.level) {
            query = query.eq('level', filters.level);
        }
        
        // Add ordering to the query
        query = query.order('created_at', { ascending: false });

        // Execute the final query
        const { data, error } = await query;

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

    function handleFilterChange(event) {
        const { name, value } = event.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }

    function clearFilters() {
        const clearedFilters = { searchTerm: '', language_id: '', level: '' };
        // We set the state and then call getPhrases in the callback of setState 
        // to ensure the state is updated before the new fetch is made.
        setFilters(clearedFilters);
        // A simpler way without a callback is to pass the cleared filters directly
        // to a modified getPhrases function, but this approach also works.
        // For now, we will rely on a re-render triggering an effect, or manual refetch.
        // Let's refactor getPhrases to take filters as an argument.
        // No, let's stick to the button to avoid complexity. The current `getPhrases` reads the state.
        
        // Let's reset the state and then manually call getPhrases.
        // To ensure the state is updated before the call, we can use a temporary variable.
        const tempFilters = { searchTerm: '', language_id: '', level: '' };
        setFilters(tempFilters);
        // The getPhrases call will use the latest state in the next render cycle,
        // but for an immediate effect, we'd need a useEffect hook or to pass state.
        // For simplicity, we'll just call it. If state updates are slow, we can improve this.
        // The most robust simple solution is to just call getPhrases which reads the `filters` state.
        // However, since `setState` is async, let's manually clear and then fetch.
        // A better approach is to have getPhrases read the filters object directly.
        // The current implementation already does this, so we just need to reset and call.
        
        // Let's make this more robust.
        // Create a temporary cleared state
        const cleared = { searchTerm: '', language_id: '', level: '' };
        // Set the state
        setFilters(cleared);
        // Call getPhrases, but since state update is async, getPhrases might see old state.
        // So, let's call it after a timeout to give React time to re-render.
        setTimeout(() => {
          getPhrases();
        }, 0);
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        if (!formData.phrase || !formData.language_id || !formData.level) {
            alert('Please fill out the phrase, select a language, and choose a level.');
            return;
        }

        if (editingId) {
            const { error } = await supabase.from('phrases').update({ phrase: formData.phrase, definition: formData.definition, language_id: formData.language_id, level: formData.level }).eq('id', editingId);
            if (error) { console.error('Error updating phrase:', error); }
        } else {
            const { error } = await supabase.from('phrases').insert([{ phrase: formData.phrase, definition: formData.definition, language_id: formData.language_id, level: formData.level }]);
            if (error) { console.error('Error inserting new phrase:', error); }
        }
        
        resetForm();
        getPhrases();
    }
    
    function handleEdit(phrase) {
        setEditingId(phrase.id);
        setFormData({ phrase: phrase.phrase, definition: phrase.definition, language_id: phrase.language_id, level: phrase.level });
    }

    function resetForm() {
        setEditingId(null);
        setFormData({ phrase: '', definition: '', language_id: '', level: '' });
    }

    async function handleDelete(phraseId) {
        const isConfirmed = window.confirm('Are you sure you want to delete this phrase?');
        if (isConfirmed) {
            const { error } = await supabase.from('phrases').delete().eq('id', phraseId);
            if (error) { console.error('Error deleting phrase:', error); }
            else { getPhrases(); }
        }
    }

    if (loading) return <p>Loading...</p>;

    return (
        <div style={{ padding: '20px' }}>
            <Link to="/">&larr; Back to Library</Link>
            <h1>Phrase Manager</h1>
            
            {/* --- Filter Controls Section --- */}
            <div className="filter-controls" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>Filter Phrases</h2>
                <input type="text" name="searchTerm" placeholder="Search by phrase..." value={filters.searchTerm} onChange={handleFilterChange} style={{ marginRight: '10px' }} />
                <select name="language_id" value={filters.language_id} onChange={handleFilterChange} style={{ marginRight: '10px' }}>
                    <option value="">All Languages</option>
                    {languages.map(lang => (<option key={lang.id} value={lang.id}>{lang.name}</option>))}
                </select>
                <select name="level" value={filters.level} onChange={handleFilterChange} style={{ marginRight: '10px' }}>
                    <option value="">All Levels</option>
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                </select>
                <button onClick={getPhrases}>Apply Filters</button>
                <button onClick={clearFilters} style={{ marginLeft: '10px' }}>Clear Filters</button>
            </div>

            {/* --- Add/Edit Form Section --- */}
            <form onSubmit={handleFormSubmit} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
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
                {editingId && <button type="button" onClick={resetForm} style={{ marginLeft: '10px' }}>Cancel</button>}
            </form>

            {/* --- Phrases Table Section --- */}
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
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '10px' }}>No phrases found for the current filters.</td></tr>
                    ) : (
                        phrases.map(phrase => (
                            <tr key={phrase.id}>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.phrase}</td>
                                <td style={{ border: '1-px solid #ccc', padding: '8px' }}>{phrase.definition}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.languages ? phrase.languages.name : 'N/A'}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{phrase.level}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
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