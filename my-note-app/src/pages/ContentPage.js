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
    const [formData, setFormData] = useState({ title: '', language: '', content: '' });

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const startInEditMode = queryParams.get('edit') === 'true';

        async function fetchData() {
            setLoading(true);
            const { data: contentData, error: contentError } = await supabase
                .from('content').select('*').eq('id', id).single();
            const { data: languagesData, error: languagesError } = await supabase
                .from('languages').select('name');

            if (contentError) {
                console.error('Error fetching content:', contentError);
            } else {
                setContent(contentData);
                setFormData({
                    title: contentData.title,
                    language: contentData.language,
                    content: contentData.content,
                });
            }
            if (languagesError) {
                console.error('Error fetching languages:', languagesError);
            } else {
                setLanguages(languagesData);
            }
            if (startInEditMode) {
                setIsEditMode(true);
            }
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
        setFormData({ title: content.title, language: content.language, content: content.content });
        setIsEditMode(false);
    }

    async function handleSave() {
        const { error } = await supabase.from('content').update({
            title: formData.title, language: formData.language, content: formData.content,
        }).eq('id', id);

        if (error) { console.error('Error updating content:', error); alert('Could not save changes.'); }
        else { setContent({ ...content, ...formData }); setIsEditMode(false); }
    }

    async function handleDelete() {
        const isConfirmed = window.confirm(
            'Are you sure you want to delete this content forever?'
        );
    
        if (isConfirmed) {
            const { error } = await supabase
                .from('content')
                .delete()
                .eq('id', id);
    
            if (error) {
                console.error('Error deleting content:', error);
                alert('Could not delete the content.');
            } else {
                navigate('/');
            }
        }
    }

    if (loading) return <div>Loading...</div>;
    if (!content) return <div>Content not found.</div>;

    return (
        <div style={{ padding: '20px' }}>
            <Link to="/">&larr; Back to Library</Link>
            {isEditMode ? (
                // --- EDIT MODE JSX ---
                <div className="edit-mode" style={{ marginTop: '20px' }}>
                    <input type="text" name="title" value={formData.title} onChange={handleFormChange} style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }} />
                    <select name="language" value={formData.language} onChange={handleFormChange} style={{ display: 'block', marginBottom: '20px' }}>
                        <option value="" disabled>Select a language</option>
                        {languages.map(lang => (<option key={lang.name} value={lang.name}>{lang.name}</option>))}
                    </select>
                    <textarea name="content" value={formData.content} onChange={handleFormChange} style={{ width: '100%', height: '400px', fontFamily: 'inherit' }} />
                    <div style={{ marginTop: '10px' }}>
                        <button onClick={handleSave}>Save</button>
                        <button onClick={handleCancel} style={{ marginLeft: '10px' }}>Cancel</button>
                        {/* --- MOVED: Delete button is now here in Edit Mode --- */}
                        <button onClick={handleDelete} style={{ marginLeft: '20px', backgroundColor: '#f44336', color: 'white' }}>
                            Delete
                        </button>
                    </div>
                </div>
            ) : (
                // --- VIEW MODE JSX ---
                <div className="view-mode" style={{ marginTop: '20px' }}>
                    <h1>{content.title}</h1>
                    <p><strong>Language:</strong> {content.language}</p>
                    <button onClick={handleEdit}>Edit</button>
                    {/* The Delete button is no longer here */}
                    <hr style={{ margin: '20px 0' }} />
                    <div style={{ whiteSpace: 'pre-wrap' }}>{content.content}</div>
                </div>
            )}
        </div>
    );
}

export default ContentPage;