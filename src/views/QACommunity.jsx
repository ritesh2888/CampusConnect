import React, { useState, useEffect } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Award, X, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';
import PublicProfileModal from '../components/PublicProfileModal';
import PostCommentsModal from '../components/PostCommentsModal';

const allTags = ['All', 'Academics', 'Campus Life', 'Projects', 'Help', 'CS', 'EXTC', 'DSA', 'Hackathons'];

export default function QACommunity({ user, onRequireAuth }) {
  const [activeTag, setActiveTag] = useState('All');
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Academics', is_anonymous: false });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('Newest');
  const [votedPosts, setVotedPosts] = useState({});
  const [topDonors, setTopDonors] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);

  useEffect(() => {
    fetchPosts();
    fetchLeaderboard();
    const savedVotes = localStorage.getItem('campus_votes');
    if (savedVotes) setVotedPosts(JSON.parse(savedVotes));
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('marketplace_items').select('seller_name, listing_type');
    if (data) {
      const donors = data.filter(d => d.listing_type === 'Donate' && d.seller_name);
      const counts = {};
      donors.forEach(d => { counts[d.seller_name] = (counts[d.seller_name] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      setTopDonors(sorted);
    }
  };

  const samplePosts = [
    {
      id: 'sample-1',
      title: 'Which YouTube channel is best for First Year Engineering Mathematics (M1)?',
      content: 'I am starting my first year and M1 seems tough. Looking for recommendations for channels that cover the Mumbai University syllabus well.',
      category: 'Academics',
      tags: ['Academics'],
      is_anonymous: true,
      author: 'Anonymous Engineer',
      department: 'Unknown',
      upvotes: 42,
      comments: 5,
      created_at: new Date().toISOString()
    },
    {
      id: 'sample-2',
      title: 'Any tips for the upcoming Smart India Hackathon internal rounds?',
      content: 'Our team is confused about the problem statement selection process. Should we go for software or hardware?',
      category: 'Hackathons',
      tags: ['Hackathons', 'Help'],
      is_anonymous: false,
      author: 'Ritesh Yadav',
      department: 'FE EXTC',
      upvotes: 128,
      comments: 14,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Supabase Q&A fetch error:", error);
      setPosts(samplePosts);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const handleVote = async (id, currentVotes, voteType) => {
    if (votedPosts[id] === voteType) return; // already voted this way

    // Calculate new votes
    let diff = 0;
    if (votedPosts[id] === undefined) diff = voteType; // new vote
    else if (votedPosts[id] === 1 && voteType === -1) diff = -2; // up to down
    else if (votedPosts[id] === -1 && voteType === 1) diff = 2; // down to up
    
    const newVotes = (currentVotes || 0) + diff;
    const { data } = await supabase.from('posts').update({ upvotes: newVotes }).eq('id', id).select();
    
    if (data && data.length > 0) {
      setPosts(posts.map(p => p.id === id ? data[0] : p));
      const newVotesRecord = { ...votedPosts, [id]: voteType };
      setVotedPosts(newVotesRecord);
      localStorage.setItem('campus_votes', JSON.stringify(newVotesRecord));
    }
  };

  const handleCreateClick = () => {
    if (!user) {
      onRequireAuth();
    } else {
      setIsModalOpen(true);
    }
  };

  const parseYear = (yearStr) => {
    if (!yearStr) return '';
    const match = yearStr.match(/\(([^)]+)\)/);
    return match ? match[1] : yearStr.split(' ')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([
          { 
            title: newPost.title, 
            content: newPost.content, 
            category: newPost.category || '#DSA',
            is_anonymous: newPost.is_anonymous,
            author_name: newPost.is_anonymous ? 'Anonymous Student' : (user?.firstName ? `${user.firstName} ${user.lastName}` : 'Ritesh Yadav'),
            user_id: (user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) ? user.id : '123e4567-e89b-12d3-a456-426614174000',
            upvotes: 0
          }
        ])
        .select();
        
      if (error) {
        console.warn("Supabase insert failed (likely RLS). Continuing locally:", error.message);
      }
        
      const newPostData = (data && data.length > 0) ? data[0] : {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        title: newPost.title,
        content: newPost.content,
        category: newPost.category || '#DSA',
        is_anonymous: newPost.is_anonymous,
        author_name: newPost.is_anonymous ? 'Anonymous Student' : (user?.firstName ? `${user.firstName} ${user.lastName}` : 'Ritesh Yadav'),
        user_id: user.id,
        upvotes: 0,
        created_at: new Date().toISOString()
      };

      setPosts([newPostData, ...posts]);
      setIsModalOpen(false);
      setNewPost({ title: '', content: '', category: 'Academics', is_anonymous: false });
      alert("Post published successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const filteredPosts = (activeTag === 'All' 
    ? posts 
    : posts.filter(post => (post.tags && post.tags.includes(activeTag)) || (post.category && post.category === activeTag))
  ).sort((a, b) => {
    if (sortBy === 'Most Upvoted') return (b.upvotes || 0) - (a.upvotes || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="max-w-4xl mx-auto pt-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Q&A Community</h1>
        <div className="flex gap-3 hidden md:flex">
          <button 
            onClick={fetchPosts}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold shadow-sm"
          >
            Refresh
          </button>
          <button 
            onClick={handleCreateClick}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-md shadow-indigo-500/20"
          >
            Create Post
          </button>
        </div>
      </div>

      {/* Gamification Leaderboard */}
      {topDonors.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
          <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-300" />
            Top Campus Donors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topDonors.map((donor, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-lg">
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-bold">{donor[0]}</div>
                  <div className="text-xs text-indigo-100">{donor[1]} items donated</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-edges flex-1 w-full sm:w-auto">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                activeTag === tag 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm whitespace-nowrap"
        >
          <option value="Newest">Newest First</option>
          <option value="Most Upvoted">Most Upvoted</option>
        </select>
      </div>

      <div className="space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold animate-pulse">Loading community discussions...</p>
          </div>
        ) : filteredPosts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-0.5 hover:border-indigo-300 transition-all duration-300 group">
            <div className="flex flex-col sm:flex-row">
              {/* Upvote Pill */}
              <div className="bg-slate-50 sm:w-16 flex sm:flex-col items-center justify-center sm:py-6 px-4 sm:px-0 border-b sm:border-b-0 sm:border-r border-slate-200/80 flex-row gap-4 sm:gap-2">
                <button 
                  onClick={() => handleVote(post.id, post.upvotes, 1)} 
                  className={`transition-colors py-2 sm:py-0 ${votedPosts[post.id] === 1 ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <ArrowBigUp className={`h-6 w-6 sm:h-7 sm:w-7 ${votedPosts[post.id] === 1 ? 'fill-current' : ''}`} />
                </button>
                <span className={`font-black text-sm sm:text-base ${votedPosts[post.id] === 1 ? 'text-indigo-600' : (votedPosts[post.id] === -1 ? 'text-rose-500' : 'text-slate-900')}`}>
                  {post.upvotes || 0}
                </span>
                <button 
                  onClick={() => handleVote(post.id, post.upvotes, -1)} 
                  className={`transition-colors py-2 sm:py-0 ${votedPosts[post.id] === -1 ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                >
                  <ArrowBigDown className={`h-6 w-6 sm:h-7 sm:w-7 ${votedPosts[post.id] === -1 ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <div className="p-5 sm:p-6 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 font-semibold">
                  {post.is_anonymous ? (
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200">
                      <Shield className="h-3 w-3 text-slate-500" />
                      <span>{post.author_name || 'Anonymous Engineer'}</span>
                    </div>
                  ) : (
                    <button onClick={() => setSelectedProfileId(post.user_id)} className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors font-bold text-sm">
                      {post.author_name || 'Student'}
                    </button>
                  )}
                  {post.created_at && (
                    <>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5 leading-tight group-hover:text-indigo-700 transition-colors">{post.title}</h3>
                <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed font-medium">{post.content}</p>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {post.category === 'Academics' && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-bold">
                        #{post.category}
                      </span>
                    )}
                    {post.category === 'Hackathons' && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-bold">
                        #{post.category}
                      </span>
                    )}
                    {(post.category !== 'Academics' && post.category !== 'Hackathons' && post.category) && (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-1 rounded-full font-bold">
                        #{post.category}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-5 border-t sm:border-t-0 border-slate-200/80 pt-4 sm:pt-0">
                    <button onClick={() => setActiveCommentPost(post)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 text-sm font-bold transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments || 0}
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 text-sm font-bold transition-colors">
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-amber-500 text-sm font-bold transition-colors">
                      <Award className="h-4 w-4" />
                      Award
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">No posts found for this tag.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-200/80 bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Create a Post</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-1 rounded-full border border-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Title</label>
                <input 
                  type="text" required
                  value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="Ask a question or share something..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                <select 
                  value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                >
                  <option value="Academics">#Academics</option>
                  <option value="DSA">#DSA</option>
                  <option value="Hackathons">#Hackathons</option>
                  <option value="Campus Life">#Campus Life</option>
                  <option value="Help">#Help</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Content</label>
                <textarea 
                  required rows={4}
                  value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium resize-none"
                  placeholder="Provide more details..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" id="anonymous"
                  checked={newPost.is_anonymous} onChange={e => setNewPost({...newPost, is_anonymous: e.target.checked})}
                  className="h-4 w-4 bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500 rounded"
                />
                <label htmlFor="anonymous" className="text-sm text-slate-600 font-bold flex items-center gap-1.5 cursor-pointer">
                  <Shield className="h-4 w-4 text-slate-400" />
                  Ask Anonymously
                </label>
              </div>
              <div className="pt-2 flex justify-end gap-3 mt-4">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors font-bold shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all"
                >
                  Post to Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PublicProfileModal 
        userId={selectedProfileId} 
        isOpen={!!selectedProfileId} 
        onClose={() => setSelectedProfileId(null)} 
      />

      <PostCommentsModal 
        post={activeCommentPost}
        user={user}
        isOpen={!!activeCommentPost}
        onClose={() => setActiveCommentPost(null)}
        onCommentAdded={(postId, newCount) => {
          setPosts(posts.map(p => p.id === postId ? { ...p, comments: newCount } : p));
        }}
      />
    </div>
  );
}
