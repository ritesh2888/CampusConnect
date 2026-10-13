import React, { useState, useEffect } from 'react';
import { X, Send, UserCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function PostCommentsModal({ post, user, isOpen, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      // Load comments from local storage (Simulating a database table for the hackathon)
      const allComments = JSON.parse(localStorage.getItem('campus_comments') || '{}');
      setComments(allComments[post.id] || []);
    }
  }, [isOpen, post]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setIsSubmitting(true);

    const commentObj = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      text: newComment,
      author: `${user.firstName} ${user.lastName}`,
      author_avatar: user.avatar_url,
      created_at: new Date().toISOString()
    };

    // Save to local storage simulated database
    const allComments = JSON.parse(localStorage.getItem('campus_comments') || '{}');
    if (!allComments[post.id]) allComments[post.id] = [];
    allComments[post.id].push(commentObj);
    localStorage.setItem('campus_comments', JSON.stringify(allComments));

    setComments(allComments[post.id]);
    setNewComment('');

    // Increment comment count in Supabase
    const newCount = (post.comments || 0) + 1;
    const { error } = await supabase.from('posts').update({ comments: newCount }).eq('id', post.id);
    if (error) console.warn("Supabase update failed:", error);

    onCommentAdded(post.id, newCount);
    setIsSubmitting(false);
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex justify-center items-end sm:items-center z-[120] sm:p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transform transition-transform animate-in slide-in-from-bottom-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50">
          <h2 className="font-extrabold text-slate-900">Discussion</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-full transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {/* Original Post context */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
            <p className="font-bold text-slate-800 text-sm">{post.title}</p>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <span className="font-bold text-indigo-600">{post.author_name}</span> • {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm font-semibold">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3 items-start">
                {c.author_avatar ? (
                  <img src={c.author_avatar} alt="avatar" className="w-8 h-8 rounded-full border border-slate-200 object-cover bg-white shrink-0" />
                ) : (
                  <UserCircle className="w-8 h-8 text-slate-300 shrink-0" />
                )}
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200/60 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">{c.author}</span>
                    <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-sm text-slate-600">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={newComment} 
              onChange={e => setNewComment(e.target.value)}
              placeholder={user ? "Add a comment..." : "Log in to comment..."}
              disabled={!user || isSubmitting}
              className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 text-slate-900 placeholder-slate-500"
            />
            <button 
              type="submit" 
              disabled={!user || !newComment.trim() || isSubmitting}
              className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shrink-0"
            >
              <Send className="h-4 w-4 ml-[-2px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
