import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Phrases() {
    const [phrases, setPhrases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [languages, setLanguages] = useState([]);
    const [formData, setFormData] = useState({ phrase: '', definition: '', language_id: '', level: '' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        // Pass the initial empty form data to fetch all phrases on first load
        fetchWithFilters({ phrase: '', definition: '', language_id: '', level: '' });
        getLanguages();
    }, []);

    const fetchWithFilters = async (currentFilters) => {
        setLoading(true);
        let query = supabase.from('phrases').select(`*, languages ( name )`);
        
        if (currentFilters.phrase) {
            query = query.ilike('phrase', `%${currentFilters.phrase}%`); 
        }
        if (currentFilters.language_id) { 
            query = query.eq('language_id', currentFilters.language_id); 
        }
        if (currentFilters.level) { 
            query = query.eq('level', currentFilters.level); 
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) { 
            console.error("Error fetching phrases:", error); 
        } else { 
            setPhrases(data); 
        }
        setLoading(false);
    }

    async function getLanguages() {
        const { data } = await supabase.from('languages').select('*');
        setLanguages(data || []);
    }
  
    function handleInputChange(event) {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        if (!formData.phrase || !formData.language_id || !formData.level) {
            alert('To save, please provide a phrase and select a specific language and level.');
            return;
        }

        const dataToSave = {
            phrase: formData.phrase,
            definition: formData.definition,
            language_id: formData.language_id,
            level: formData.level
        };

        let error;
        if (editingId) {
            ({ error } = await supabase.from('phrases').update(dataToSave).eq('id', editingId));
        } else {
            ({ error } = await supabase.from('phrases').insert([dataToSave]));
        }

        if (error) {
            console.error('Error saving phrase:', error);
            alert('Could not save the phrase.');
        } else {
            resetForm();
            // After saving, refetch with no filters to show the complete list again
            fetchWithFilters({ phrase: '', definition: '', language_id: '', level: '' });
        }
    }
  
    function handleEditClick(phrase) {
        setEditingId(phrase.id);
        setFormData({ 
            phrase: phrase.phrase, 
            definition: phrase.definition,
            language_id: phrase.language_id,
            level: phrase.level
        });
    }

    function resetForm() {
        setEditingId(null);
        setFormData({ phrase: '', definition: '', language_id: '', level: '' });
    }

    async function handleDelete() {
        if (!editingId) return;
        const isConfirmed = window.confirm('Are you sure you want to permanently delete this phrase?');
        if (isConfirmed) {
            const { error } = await supabase.from('phrases').delete().eq('id', editingId);
            if (error) { 
                console.error('Error deleting phrase:', error);
                alert('Could not delete the phrase.');
            } else {
                resetForm();
                fetchWithFilters({ phrase: '', definition: '', language_id: '', level: '' });
            }
        }
    }

    return (
        <div>
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                {/* Left Spacer */}
                <div className="flex-1"></div>

                {/* Center Title */}
                <div className="flex-1 text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Phrase Manager</h1>
                </div>

                {/* Right Side */}
                <div className="flex-1 flex justify-end">
                    <nav className="flex items-center space-x-6">
                        <NavLink 
                            to="/"
                            className={({ isActive }) => 
                              "font-medium " + (isActive ? "text-indigo-600" : "text-gray-600 hover:text-indigo-600")
                            }
                        >
                            Library
                        </NavLink>
                        <NavLink 
                            to="/phrases" 
                            className={({ isActive }) => 
                              "font-medium " + (isActive ? "text-indigo-600" : "text-gray-600 hover:text-indigo-600")
                            }
                        >
                            Phrases
                        </NavLink>
                    </nav>
                </div>
            </div>

            {/* Add/Edit/Filter Form */}
            <div className="mb-8 p-5 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{editingId ? 'Edit Phrase' : 'Add / Filter Phrases'}</h2>
                 <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="phrase" className="block text-sm font-medium text-gray-700">Phrase</label>
                        <input type="text" name="phrase" id="phrase" placeholder="Enter phrase to add or text to filter..." value={formData.phrase} onChange={handleInputChange} className="mt-1 w-full bg-gray-100 rounded-lg py-2 px-4 border border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="definition" className="block text-sm font-medium text-gray-700">Definition</label>
                        <input type="text" name="definition" id="definition" value={formData.definition} onChange={handleInputChange} className="mt-1 w-full bg-gray-100 rounded-lg py-2 px-4 border border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none" />
                    </div>
                    <div>
                        <label htmlFor="language_id" className="block text-sm font-medium text-gray-700">Language</label>
                        <select name="language_id" id="language_id" value={formData.language_id} onChange={handleInputChange} className="mt-1 w-full bg-gray-100 rounded-lg py-2 px-4 border border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none">
                            <option value="">Any Language</option>
                            {languages.map(lang => (<option key={lang.id} value={lang.id}>{lang.name}</option>))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700">Level</label>
                        <select name="level" id="level" value={formData.level} onChange={handleInputChange} className="mt-1 w-full bg-gray-100 rounded-lg py-2 px-4 border border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none">
                            <option value="">Any Level</option>
                            <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                        </select>
                    </div>
                    <div className="md:col-span-5 flex justify-end space-x-3 items-center pt-2">
                        {editingId && <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>}
                        {editingId && <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>}
                        <button type="button" onClick={() => fetchWithFilters(formData)} className="bg-gray-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors">Filter</button>
                        <button type="submit" className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">{editingId ? 'Update Phrase' : 'Save New Phrase'}</button>
                    </div>
                 </form>
            </div>
            
            {/* Phrase List Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 font-semibold text-sm text-gray-600">Phrase</th>
                            <th className="p-3 font-semibold text-sm text-gray-600">Definition</th>
                            <th className="p-3 font-semibold text-sm text-gray-600 w-32">Language</th>
                            <th className="p-3 font-semibold text-sm text-gray-600 w-20 text-center">Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="text-center p-4 text-gray-500">Loading...</td></tr>
                        ) : phrases.length === 0 ? (
                            <tr><td colSpan="4" className="text-center p-4 text-gray-500">No phrases found.</td></tr>
                        ) : (
                            phrases.map(phrase => (
                                <tr key={phrase.id} onClick={() => handleEditClick(phrase)} className={`border-b border-gray-200 hover:bg-indigo-50 cursor-pointer ${editingId === phrase.id ? 'bg-indigo-100' : ''}`}>
                                    <td className="p-3 font-medium">{phrase.phrase}</td>
                                    <td className="p-3 text-gray-600">{phrase.definition}</td>
                                    <td className="p-3 text-gray-600">{phrase.languages ? phrase.languages.name : 'N/A'}</td>
                                    <td className="p-3 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            phrase.level === 1 ? 'bg-blue-100 text-blue-800' :
                                            phrase.level === 2 ? 'bg-green-100 text-green-800' :
                                            phrase.level === 3 ? 'bg-yellow-100 text-yellow-800' :
                                            phrase.level === 4 ? 'bg-orange-100 text-orange-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>{phrase.level}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Phrases;
