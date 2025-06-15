import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Library() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [tags, setTags] = useState([]);
  const [filters, setFilters] = useState({ searchTerm: '', language_id: '', tag_id: '' });

  useEffect(() => {
    getContents();
    getLanguages();
    getTags();
  }, []);

  // --- UPDATED: This function now dynamically builds the query ---
  async function getContents() {
    setLoading(true);
    
    // Start with the base query
    let query = supabase
      .from('content')
      .select(`*, languages ( name ), content_tags ( name )`);

    // Add filters conditionally based on the 'filters' state
    if (filters.searchTerm) {
      query = query.ilike('title', `%${filters.searchTerm}%`);
    }
    if (filters.language_id) {
      query = query.eq('language_id', filters.language_id);
    }
    if (filters.tag_id) {
      query = query.eq('tag_id', filters.tag_id);
    }
    
    // Order the results
    query = query.order('created_at', { ascending: false });

    // Execute the final query
    const { data, error } = await query;

    if (error) { console.error("Error fetching content:", error); }
    else { setContents(data); }
    setLoading(false);
  }

  async function getLanguages() {
    const { data } = await supabase.from('languages').select('*');
    setLanguages(data || []);
  }

  async function getTags() {
    const { data } = await supabase.from('content_tags').select('*');
    setTags(data || []);
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }
  
  // --- NEW: Function to clear filters and re-fetch all content ---
  function clearFilters() {
      setFilters({ searchTerm: '', language_id: '', tag_id: '' });
      // Use a timeout to ensure state update is processed before re-fetching
      setTimeout(() => getContents(), 0);
  }

  async function handleCreateNew() {
    const { data: newContent, error } = await supabase
      .from('content')
      .insert([ { title: 'Untitled', content: '', language_id: null, tag_id: null } ])
      .select()
      .single();

    if (error) { alert('Could not create new content.'); }
    else { navigate(`/content/${newContent.id}?edit=true`); }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="library-container">
      <h1>Content Library</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <Link to="/phrases" style={{ marginRight: '20px' }}>Go to Phrase Manager</Link>
        <button onClick={handleCreateNew}>+ Create New Content</button>
      </div>

      <div className="filter-controls" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Filter Content</h2>
          <input type="text" name="searchTerm" placeholder="Search by title..." value={filters.searchTerm} onChange={handleFilterChange} style={{ marginRight: '10px' }} />
          <select name="language_id" value={filters.language_id} onChange={handleFilterChange} style={{ marginRight: '10px' }}>
              <option value="">All Languages</option>
              {languages.map(lang => (<option key={lang.id} value={lang.id}>{lang.name}</option>))}
          </select>
          <select name="tag_id" value={filters.tag_id} onChange={handleFilterChange} style={{ marginRight: '10px' }}>
              <option value="">All Tags</option>
              {tags.map(tag => (<option key={tag.id} value={tag.id}>{tag.name}</option>))}
          </select>
          {/* --- NEW: Buttons to apply and clear filters --- */}
          <button onClick={getContents}>Apply Filters</button>
          <button onClick={clearFilters} style={{ marginLeft: '10px' }}>Clear Filters</button>
      </div>

      {contents.length === 0 ? (
        <p>No matching content found. Try clearing the filters.</p>
      ) : (
        <div className="library-grid">
          {contents.map(content => (
            <Link to={`/content/${content.id}`} key={content.id} className="content-card">
              <div className="cover-image" style={{ backgroundColor: '#ccc' }}></div>
              <h3>{content.title}</h3>
              <p>Language: {content.languages ? content.languages.name : 'N/A'}</p>
              <p>Tag: {content.content_tags ? content.content_tags.name : 'None'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Library;