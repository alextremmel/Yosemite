import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { supabase } from '../supabaseClient';

function Library() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize the navigate function

  useEffect(() => {
    getContents();
  }, []);

  async function getContents() {
    setLoading(true);
    const { data } = await supabase.from('content').select('*');
    setContents(data);
    setLoading(false);
  }

  // --- NEW: Function to create a blank entry and redirect ---
  async function handleCreateNew() {
    // Insert a new row with a default title.
    // .select().single() is crucial: it returns the newly created row, including its id.
    const { data: newContent, error } = await supabase
      .from('content')
      .insert([
        { title: '', language: '', content: '' }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating new content:', error);
      alert('Could not create new content.');
    } else {
      // If creation is successful, navigate to the new content's page in edit mode.
      // We add '?edit=true' to the URL to signal this.
      navigate(`/content/${newContent.id}?edit=true`);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="library-container">
      <h1>Content Library</h1>

      {/* The form is gone, replaced by this single button */}
      <button onClick={handleCreateNew} style={{ marginBottom: '20px' }}>
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
              <p>{content.language || 'No language'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Library;