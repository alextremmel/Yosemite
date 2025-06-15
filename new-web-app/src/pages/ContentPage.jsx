import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function ContentPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [languages, setLanguages] = useState([]);
    const [tags, setTags] = useState([]);
    const [formData, setFormData] = useState({ title: '', content: '', language_id: '', tag_id: '' });

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const startInEditMode = queryParams.get('edit') === 'true';

        async function fetchData() {
            setLoading(true);
            const { data: contentData, error: contentError } = await supabase.from('content').select('*, languages(name), content_tags(name)').eq('id', id).single();
            const { data: languagesData, error: languagesError } = await supabase.from('languages').select('*');
            const { data: tagsData, error: tagsError } = await supabase.from('content_tags').select('*');

            if (contentError) { console.error('Error fetching content:', contentError); }
            else {
                setContent(contentData);
                setFormData({
                    title: contentData.title,
                    content: contentData.content,
                    language_id: contentData.language_id,
                    tag_id: contentData.tag_id || ''
                });
            }
            if (languagesError) { console.error('Error fetching languages:', languagesError); }
            else { setLanguages(languagesData); }
            
            if (tagsError) { console.error('Error fetching tags:', tagsError); }
            else { setTags(tagsData); }

            if (startInEditMode) { setIsEditMode(true); }
            setLoading(false);
        }

        fetchData();
    }, [id, location.search]);

    function handleFormChange(event) {
        const { name, value } = event.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    }

    function handleEdit() { setIsEditMode(true); }

    function handleCancel() {
        setFormData({ title: content.title, content: content.content, language_id: content.language_id, tag_id: content.tag_id || '' });
        setIsEditMode(false);
    }
    
    async function handleSave() {
      // --- UPDATED SAVE LOGIC ---
      // Prepare the data for saving.
      // If tag_id is an empty string from the "No Tag" option, convert it to null.
      const dataToSave = {
          title: formData.title,
          language_id: formData.language_id,
          content: formData.content,
          tag_id: formData.tag_id === '' ? null : formData.tag_id,
      };
  
      // Use the cleaned dataToSave object in the update call
      const { data, error } = await supabase
        .from('content')
        .update(dataToSave)
        .eq('id', id)
        .select('*, languages(name), content_tags(name)')
        .single();
  
      if (error) { 
        console.error('Error updating content:', error); 
        alert('Error: Could not save changes.');
      }
      else { 
        setContent(data); 
        setIsEditMode(false); 
      }
    }
  
    async function handleDelete() {
        const isConfirmed = window.confirm('Are you sure you want to delete this content forever?');
        if (isConfirmed) {
            const { error } = await supabase.from('content').delete().eq('id', id);
            if (error) { console.error('Error deleting content:', error); }
            else { navigate('/'); }
        }
    }

    if (loading) return <div>Loading...</div>;
    if (!content) return <div>Content not found.</div>;

    return (
        <div style={{ padding: '20px' }}>
            <Link to="/">&larr; Back to Library</Link>

            {isEditMode ? (
                <div className="edit-mode" style={{ marginTop: '20px' }}>
                    <input type="text" name="title" value={formData.title} onChange={handleFormChange} style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }} />
                    <label>Language:</label>
                    <select name="language_id" value={formData.language_id} onChange={handleFormChange} style={{ display: 'block', marginBottom: '10px' }}>
                        <option value="" disabled>Select a language</option>
                        {languages.map(lang => (<option key={lang.id} value={lang.id}>{lang.name}</option>))}
                    </select>
                    
                    <label>Tag:</label>
                    <select name="tag_id" value={formData.tag_id} onChange={handleFormChange} style={{ display: 'block', marginBottom: '20px' }}>
                        <option value="">No Tag</option> 
                        {tags.map(tag => (<option key={tag.id} value={tag.id}>{tag.name}</option>))}
                    </select>

                    <textarea name="content" value={formData.content} onChange={handleFormChange} style={{ width: '100%', height: '400px', fontFamily: 'inherit' }} />
                    <div style={{ marginTop: '10px' }}>
                        <button onClick={handleSave}>Save</button>
                        <button onClick={handleCancel} style={{ marginLeft: '10px' }}>Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="view-mode" style={{ marginTop: '20px' }}>
                    <h1>{content.title}</h1>
                    <p><strong>Language:</strong> {content.languages ? content.languages.name : 'N/A'}</p>
                    <p><strong>Tag:</strong> {content.content_tags ? content.content_tags.name : 'None'}</p>
                    <button onClick={handleEdit}>Edit</button>
                    <button onClick={handleDelete} style={{ marginLeft: '10px' }}>Delete</button>
                    <hr style={{ margin: '20px 0' }} />
                    <div style={{ whiteSpace: 'pre-wrap' }}>{content.content}</div>
                </div>
            )}
        </div>
    );
}

export default ContentPage;