import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Library() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getContents();
  }, []);

  async function getContents() {
    setLoading(true);
    // --- UPDATED QUERY ---
    // This now joins with the languages and content_tags tables
    // to get the actual names, not just the IDs.
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        languages ( name ),
        content_tags ( name )
      `);

    if (error) {
      console.error("Error fetching content:", error);
    } else {
      setContents(data);
    }
    setLoading(false);
  }

  async function handleCreateNew() {
    // --- UPDATED INSERT ---
    // Inserts a new row with default values.
    // We now use language_id and tag_id and set them to null by default.
    const { data: newContent, error } = await supabase
      .from('content')
      .insert([
        { title: 'Untitled', content: '', language_id: null, tag_id: null }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating new content:', error);
      alert('Could not create new content.');
    } else {
      navigate(`/content/${newContent.id}?edit=true`);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="library-container">
      <h1>Content Library</h1>
      
      <Link to="/phrases" style={{ marginRight: '20px' }}>Go to Phrase Manager</Link>

      <button onClick={handleCreateNew} style={{ display: 'inline-block', marginBottom: '20px' }}>
        + Create New Content
      </button>

      {contents.length === 0 ? (
        <p>No content yet. Add some!</p>
      ) : (
        <div className="library-grid">
          {contents.map(content => (
            <Link to={`/content/${content.id}`} key={content.id} className="content-card">
              <div className="cover-image" style={{ backgroundColor: '#ccc' }}></div>
              <h3>{content.title}</h3>
              {/* --- UPDATED DISPLAY LOGIC --- */}
              {/* This now accesses the nested name from the joined tables */}
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