import { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import WordLevelBar from '../components/WordLevelBar.jsx';

function Library() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [tags, setTags] = useState([]);
  const [filters, setFilters] = useState({ searchTerm: '', language_id: '', tag_id: '' });

  useEffect(() => {
    fetchWithFilters(filters); 
    getLanguages();
    getTags();
  }, []);

  const fetchWithFilters = async (currentFilters) => {
      setLoading(true);
      let query = supabase.from('content').select(`*, languages ( name ), content_tags ( name )`);
      
      if (currentFilters.searchTerm) { 
        query = query.ilike('title', `%${currentFilters.searchTerm}%`); 
      }
      if (currentFilters.language_id) { 
        query = query.eq('language_id', currentFilters.language_id); 
      }
      if (currentFilters.tag_id) { 
        query = query.eq('tag_id', currentFilters.tag_id); 
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) { 
        console.error("Error fetching content:", error); 
      } else { 
        setContents(data); 
      }
      setLoading(false);
  }
  
  const clearFilters = () => {
      const cleared = { searchTerm: '', language_id: '', tag_id: '' };
      setFilters(cleared);
      fetchWithFilters(cleared);
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

  async function handleCreateNew() {
    const { data: newContent, error } = await supabase
      .from('content')
      .insert([ { title: 'Untitled', content: '', language_id: null, tag_id: null } ])
      .select()
      .single();

    if (error) { 
      alert('Could not create new content.'); 
      console.error('Error creating new content:', error);
    } else { 
      navigate(`/content/${newContent.id}?edit=true`); 
    }
  }

  return (
    <div>
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-3xl font-bold text-gray-800">Content Library</h1>
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
                <button onClick={handleCreateNew} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Add Content
                </button>
            </nav>
        </div>
        
        {/* Filter controls */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-2">
                    <input type="text" name="searchTerm" placeholder="Search by title..." value={filters.searchTerm} onChange={handleFilterChange} className="w-full bg-gray-100 rounded-lg py-2 px-4 border border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                    <select name="language_id" value={filters.language_id} onChange={handleFilterChange} className="w-full bg-gray-100 rounded-lg py-2 px-4 border border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none">
                        <option value="">All Languages</option>
                        {languages.map(lang => (<option key={lang.id} value={lang.id}>{lang.name}</option>))}
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <select name="tag_id" value={filters.tag_id} onChange={handleFilterChange} className="w-full bg-gray-100 rounded-lg py-2 px-4 border border-transparent focus:bg-white focus:border-indigo-500 focus:outline-none">
                        <option value="">All Tags</option>
                        {tags.map(tag => (<option key={tag.id} value={tag.id}>{tag.name}</option>))}
                    </select>
                     <button onClick={() => fetchWithFilters(filters)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600 flex-shrink-0">Filter</button>
                     <button onClick={clearFilters} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 flex-shrink-0">Clear</button>
                </div>
            </div>
        </div>
        
        {loading ? (
             <p className="text-center text-gray-500">Loading...</p>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {contents.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500">No content found.</p>
                ) : (
                    contents.map(content => (
                        <Link to={`/content/${content.id}`} key={content.id} className="group cursor-pointer">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                                <div className="aspect-[2/3] bg-indigo-100 flex items-center justify-center text-indigo-400 font-bold p-2 text-center">
                                    {content.title}
                                </div>
                                <WordLevelBar distribution={content.word_level_distribution} />
                            </div>
                            <div className="pt-3">
                                <h3 className="font-semibold text-gray-800 truncate">{content.title}</h3>
                                <p className="text-sm text-gray-500 truncate">
                                    {content.languages ? content.languages.name : 'N/A'}
                                    {content.content_tags ? ` • ${content.content_tags.name}` : ''}
                                </p>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        )}
    </div>
  );
}

export default Library;
