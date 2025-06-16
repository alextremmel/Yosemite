import { useState, useEffect, useRef } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// --- New Component for the Add Phrase Popup ---
function AddPhrasePopup({ text, onSave, onClose }) {
    const [definition, setDefinition] = useState('');
    const [level, setLevel] = useState('1');

    const handleSave = () => {
        if (!definition.trim()) {
            alert('Please enter a definition.');
            return;
        }
        onSave({ phrase: text, definition, level });
    };

    return (
        <div
            className="fixed top-5 left-5 z-20 bg-white p-4 rounded-lg shadow-xl border border-gray-200 w-80"
        >
            <p className="text-sm font-semibold text-gray-500">Add New Phrase</p>
            <p className="text-lg font-bold text-gray-800 my-2 break-words">"{text}"</p>
            
            <div className="space-y-3">
                 <div>
                    <label htmlFor="definition" className="block text-sm font-medium text-gray-700">Definition</label>
                    <input
                        type="text"
                        id="definition"
                        value={definition}
                        onChange={(e) => setDefinition(e.target.value)}
                        className="mt-1 w-full bg-gray-100 rounded-lg py-2 px-4 border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                </div>
                 <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-700">Level</label>
                    <select
                        id="level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="mt-1 w-full bg-gray-100 rounded-lg py-2 px-4 border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none"
                    >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
                <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 text-sm">Cancel</button>
                <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 text-sm">Save Phrase</button>
            </div>
        </div>
    );
}


function ContentPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [languages, setLanguages] = useState([]);
    const [tags, setTags] = useState([]);
    const [formData, setFormData] = useState({ title: '', content: '', language_id: '', tag_id: '' });
    
    // --- State for the selection popup ---
    const [selectionPopup, setSelectionPopup] = useState({ isVisible: false, x: 0, y: 0, text: '' });
    const [saveStatus, setSaveStatus] = useState(null); // To show save success/error message
    const contentRef = useRef(null);

    // --- Logic to handle text selection ---
    const handleMouseUp = () => {
        if (isEditMode) return; // Don't show popup in edit mode
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelectionPopup({
                isVisible: true,
                x: rect.left + window.scrollX,
                y: rect.bottom + window.scrollY + 5, // Position below selection
                text: selectedText
            });
        } else {
            // If there's no text selected, ensure the popup is hidden
            if (!saveStatus) { // Don't hide if a save message is being shown
               setSelectionPopup({ isVisible: false, x: 0, y: 0, text: '' });
            }
        }
    };
    
    // --- Logic to save the new phrase ---
    const handleSavePhrase = async (newPhrase) => {
        if (!content?.language_id) {
            alert("The language for this content is not set. Cannot save phrase.");
            return;
        }

        setSaveStatus('Saving...');
        const { error } = await supabase.from('phrases').insert([
            {
                phrase: newPhrase.phrase,
                definition: newPhrase.definition,
                level: newPhrase.level,
                language_id: content.language_id
            }
        ]);

        if (error) {
            console.error('Error saving phrase:', error);
            setSaveStatus('Error!');
            alert(`Could not save phrase: ${error.message}`);
        } else {
            setSaveStatus('Saved!');
        }

        // Close popup and clear status after a delay
        setTimeout(() => {
            setSelectionPopup({ isVisible: false, x: 0, y: 0, text: '' });
            setSaveStatus(null);
        }, 1500);
    };


    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const startInEditMode = queryParams.get('edit') === 'true';

        async function fetchData() {
            setLoading(true);
            const { data: contentData, error: contentError } = await supabase.from('content').select('*, languages(name), content_tags(name)').eq('id', id).single();
            const { data: languagesData } = await supabase.from('languages').select('*');
            const { data: tagsData } = await supabase.from('content_tags').select('*');

            if (contentError) {
                console.error('Error fetching content:', contentError);
                setContent(null);
            } else {
                setContent(contentData);
                setFormData({
                    title: contentData.title,
                    content: contentData.content,
                    language_id: contentData.language_id,
                    tag_id: contentData.tag_id || ''
                });
            }
            
            setLanguages(languagesData || []);
            setTags(tagsData || []);
            
            if (startInEditMode) setIsEditMode(true);
            setLoading(false);
        }

        fetchData();
    }, [id]);

    function handleFormChange(event) {
        const { name, value } = event.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    }

    async function handleSave() {
      const dataToSave = {
          title: formData.title,
          language_id: formData.language_id,
          content: formData.content,
          tag_id: formData.tag_id === '' ? null : formData.tag_id,
      };
  
      const { data, error } = await supabase
        .from('content')
        .update(dataToSave)
        .eq('id', id)
        .select('*, languages(name), content_tags(name)')
        .single();
  
      if (error) { 
        console.error('Error updating content:', error); 
        alert('Error: Could not save changes.');
      } else { 
        setContent(data); 
        setIsEditMode(false); 
      }
    }
  
    async function handleDelete() {
        const isConfirmed = window.confirm('Are you sure you want to delete this content forever? This action cannot be undone.');
        if (isConfirmed) {
            const { error } = await supabase.from('content').delete().eq('id', id);
            if (error) { 
                console.error('Error deleting content:', error);
                alert('Could not delete content.');
            } else { 
                navigate('/'); 
            }
        }
    }

    if (loading) return <div className="text-center p-12">Loading...</div>;
    if (!content && !isEditMode) return <div className="text-center p-12">Content not found. <NavLink to="/" className="text-indigo-600 hover:underline">Go back to Library</NavLink></div>;

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                {/* Left Side */}
                <div className="flex-1">
                    {isEditMode ? (
                        <div className="flex items-center space-x-3">
                            <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700">Save</button>
                            <button onClick={() => setIsEditMode(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
                            <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700">Delete</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditMode(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                            Edit Content
                        </button>
                    )}
                </div>

                {/* Center Spacer */}
                <div className="flex-1 text-center"></div>

                {/* Right Side */}
                <div className="flex-1 flex justify-end">
                     <nav className="flex items-center space-x-6">
                        <NavLink to="/" className="text-gray-600 hover:text-indigo-600 font-medium">Library</NavLink>
                        <NavLink to="/phrases" className="text-gray-600 hover:text-indigo-600 font-medium">Phrases</NavLink>
                    </nav>
                </div>
            </div>

            {/* Title & Meta Section */}
            {!isEditMode && (
                <div className="text-center mb-8">
                     <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">{content.title}</h2>
                     <div className="flex items-center justify-center space-x-3 text-sm text-gray-500 mt-2">
                        {content.languages?.name && <span className="font-semibold text-blue-600 uppercase">{content.languages.name}</span>}
                        {content.languages?.name && content.content_tags?.name && <span className="text-gray-300">&bull;</span>}
                        {content.content_tags?.name && <span className="font-semibold text-purple-600 uppercase">{content.content_tags.name}</span>}
                    </div>
                </div>
            )}
            
            <main>
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white p-8 sm:p-12 rounded-lg shadow-sm">
                        {isEditMode ? (
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input type="text" name="title" id="title" value={formData.title} onChange={handleFormChange} className="w-full text-4xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-indigo-500 focus:outline-none pb-2"/>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="language_id" className="block text-sm font-medium text-gray-700">Language</label>
                                        <select name="language_id" id="language_id" value={formData.language_id} onChange={handleFormChange} className="mt-1 w-full bg-gray-100 rounded-lg py-2 px-4 border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none">
                                            <option value="" disabled>Select a language</option>
                                            {languages.map(lang => (<option key={lang.id} value={lang.id}>{lang.name}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="tag_id" className="block text-sm font-medium text-gray-700">Tag</label>
                                        <select name="tag_id" id="tag_id" value={formData.tag_id} onChange={handleFormChange} className="mt-1 w-full bg-gray-100 rounded-lg py-2 px-4 border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none">
                                            <option value="">No Tag</option> 
                                            {tags.map(tag => (<option key={tag.id} value={tag.id}>{tag.name}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                     <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
                                     <textarea name="content" id="content" value={formData.content} onChange={handleFormChange} rows="20" className="mt-1 w-full bg-gray-100 rounded-lg py-3 px-4 border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none text-lg leading-relaxed text-gray-700"/>
                                </div>
                            </div>
                        ) : (
                            <div 
                                ref={contentRef}
                                onMouseUp={handleMouseUp}
                                className="text-lg leading-relaxed text-gray-700 space-y-6 whitespace-pre-wrap"
                            >
                                {content.content}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* --- Render the Popup --- */}
            {selectionPopup.isVisible && (
                 <AddPhrasePopup 
                    x={selectionPopup.x}
                    y={selectionPopup.y}
                    text={selectionPopup.text}
                    onSave={handleSavePhrase}
                    onClose={() => setSelectionPopup({ isVisible: false, x: 0, y: 0, text: '' })}
                 />
            )}

            {/* --- Render Save Status Message --- */}
            {saveStatus && (
                <div className="fixed bottom-5 right-5 bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg">
                    {saveStatus}
                </div>
            )}
        </div>
    );
}

export default ContentPage;
