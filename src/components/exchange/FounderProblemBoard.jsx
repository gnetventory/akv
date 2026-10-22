import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Sparkles,
  Plus,
  Send,
  Filter,
  CheckCircle2,
  TrendingUp,
  Tag,
  ArrowRight,
  User,
  Clock,
  ThumbsUp,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { getExchangePosts, saveExchangePosts, getNiaPhone } from '../../utils/storage';
import { generateId, timeAgo } from '../../utils/helpers';
import Modal from '../common/Modal';

const PROBLEM_CATEGORIES = [
  'All',
  'Growth & Marketing',
  'B2B Sales & Leads',
  'Operations & Tech',
  'Hiring & Team',
  'Unit Economics & Pricing',
  'Legal & Expansion',
];

const SEED_PROBLEMS = [
  {
    id: 'block-seed-1',
    authorName: 'Karim (كريم)',
    authorBusiness: 'SaaS Invoicing Platform',
    category: 'Growth & Marketing',
    title: 'How do you lower Egyptian B2B CAC without burning budget on cold Meta ads?',
    description:
      'We have a solid accounting tool with 30 paying clients, but our customer acquisition cost via paid ads is too high. What channels or partnership motions have worked for other B2B founders targeting Egyptian SMEs?',
    responses: [
      {
        id: 'resp-1',
        authorName: 'Mohamed (محمد)',
        authorBusiness: 'Phoenix Growth Partners',
        text: 'Cold ads for Egyptian B2B SMEs usually burn cash fast. Instead, partner with local accountants & tax advisors who already have 50-100 clients each and offer them an affiliate/co-branding fee.',
        createdAt: new Date(Date.now() - 36e5 * 24).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 36e5 * 48).toISOString(),
  },
  {
    id: 'block-seed-2',
    authorName: 'Sarah (سارة)',
    authorBusiness: 'Direct-to-Consumer Skincare',
    category: 'Operations & Tech',
    title: 'High courier return rates (RTO) in Alexandria and Delta governorates',
    description:
      'Our returns/refusal on cash-on-delivery are hitting 22% outside Cairo. How do other e-commerce founders handle WhatsApp confirmation or COD verification before shipping?',
    responses: [],
    createdAt: new Date(Date.now() - 36e5 * 12).toISOString(),
  },
];

export default function FounderProblemBoard({ onOpenDiagnostic }) {
  const { activeMembers: members, notify } = useApp();

  const [posts, setPosts] = useState(() => {
    const existing = getExchangePosts();
    return existing && existing.length > 0 ? existing : SEED_PROBLEMS;
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [activeReplyPostId, setActiveReplyPostId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');

  // Form state for creating a new block
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newCategory, setNewCategory] = useState('Growth & Marketing');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPosts(e.detail);
      }
    };
    window.addEventListener('sed_exchange_updated', handler);
    return () => window.removeEventListener('sed_exchange_updated', handler);
  }, []);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newAuthorName.trim()) {
      notify?.({ type: 'warning', message: 'Please fill in your name, title, and problem description.' });
      return;
    }

    const newPost = {
      id: `block-${generateId()}`,
      authorName: newAuthorName.trim(),
      authorBusiness: newBusinessName.trim() || 'Founder Venture',
      category: newCategory,
      title: newTitle.trim(),
      description: newDescription.trim(),
      responses: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    saveExchangePosts(updated);
    setShowNewPostModal(false);

    // Reset fields
    setNewTitle('');
    setNewDescription('');
    notify?.({ type: 'success', message: 'Your business block was shared with the community!' });
  };

  const handleAddResponse = (postId) => {
    if (!replyText.trim() || !replyAuthor.trim()) {
      notify?.({ type: 'warning', message: 'Please provide your name and peer advice.' });
      return;
    }

    const newResp = {
      id: `resp-${generateId()}`,
      authorName: replyAuthor.trim(),
      text: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          responses: [...(p.responses || []), newResp],
        };
      }
      return p;
    });

    setPosts(updated);
    saveExchangePosts(updated);
    setReplyText('');
    setActiveReplyPostId(null);
    notify?.({ type: 'success', message: 'Peer response posted!' });
  };

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'All') return posts;
    return posts.filter((p) => p.category === selectedCategory);
  }, [posts, selectedCategory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ── HEADER BANNER ──── */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-stone-900 via-stone-850 to-slate-900 text-white border border-stone-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-emerald-400 text-xs font-bold">
              <Sparkles size={14} className="text-emerald-400" />
              <span>Founder Micro-Ecosystem Exchange</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Founder Problem Board: What&apos;s Blocking You?
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-medium leading-relaxed">
              In Nia&apos;s words: &ldquo;If I have a block in business, I want to be able to ask someone here:
              <em> What do you think the problem is?</em>&rdquo; Share real bottlenecks and crowdsource peer insights without paying thousands in fees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowNewPostModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer hover:scale-102"
            >
              <Plus size={16} />
              <span>Share a Business Block</span>
            </button>

            {onOpenDiagnostic && (
              <button
                onClick={onOpenDiagnostic}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer hover:scale-102"
              >
                <TrendingUp size={15} className="text-emerald-400" />
                <span>Nia Diagnostic</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CATEGORY PILLS FILTER ──── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PROBLEM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── POSTS FEED ──── */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 space-y-3">
            <HelpCircle size={32} className="mx-auto text-stone-400" />
            <h3 className="font-bold text-stone-700 dark:text-stone-300 text-sm">
              No business blocks shared under this category yet
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Be the first founder to post a challenge in {selectedCategory} and unlock peer insights!
            </p>
            <button
              onClick={() => setShowNewPostModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer inline-flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Post a Problem</span>
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              {/* Post Metadata Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                    {post.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span>{post.authorName}</span>
                      <span className="text-stone-400 font-normal">•</span>
                      <span className="text-stone-500 font-medium">{post.authorBusiness}</span>
                    </div>
                    <div className="text-[10.5px] text-stone-400 flex items-center gap-1">
                      <Clock size={11} />
                      <span>{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 border border-stone-200 dark:border-stone-700">
                  {post.category}
                </span>
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100 leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                  {post.description}
                </p>
              </div>

              {/* Existing Responses */}
              {post.responses && post.responses.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare size={12} className="text-emerald-600" />
                    <span>Peer Solutions ({post.responses.length})</span>
                  </div>
                  <div className="space-y-2">
                    {post.responses.map((resp) => (
                      <div
                        key={resp.id}
                        className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            {resp.authorName} {resp.authorBusiness && `(${resp.authorBusiness})`}
                          </span>
                          <span className="text-stone-400 text-[10px]">{timeAgo(resp.createdAt)}</span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                          {resp.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Controls */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() =>
                    setActiveReplyPostId(activeReplyPostId === post.id ? null : post.id)
                  }
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>{activeReplyPostId === post.id ? 'Cancel Reply' : 'Add Peer Advice / Perspective'}</span>
                </button>

                <div className="text-[11px] text-stone-400">
                  {post.responses?.length || 0} response{post.responses?.length === 1 ? '' : 's'}
                </div>
              </div>

              {/* Inline Reply Form */}
              {activeReplyPostId === post.id && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-3 animate-fade-in">
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Share your experience or advice on this block:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Your Name / اسمك"
                      value={replyAuthor}
                      onChange={(e) => setReplyAuthor(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Write your actionable perspective or peer suggestion..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveReplyPostId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs text-stone-500 hover:text-stone-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddResponse(post.id)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Send size={12} />
                      <span>Post Advice</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── CREATE NEW BLOCK MODAL ──── */}
      {showNewPostModal && (
        <Modal
          isOpen={showNewPostModal}
          onClose={() => setShowNewPostModal(false)}
          title="Share a Business Block with Fellow Founders"
          size="md"
        >
          <form onSubmit={handleCreatePost} className="space-y-4 text-stone-800 dark:text-stone-200">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 text-xs text-stone-600 dark:text-stone-300">
              💡 <strong>Ecosystem Rule:</strong> Be honest and specific about what is holding you back. Fellow founders are here to help, not pitch to you.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Your Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newAuthorName}
                  onChange={(e) => setNewAuthorName(e.target.value)}
                  placeholder="e.g. عمر سليم"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Venture / Business</label>
                <input
                  type="text"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="e.g. TechCorp / منصة تجارة"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {PROBLEM_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                The Core Question / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. How to structure commission for B2B sales reps in Egypt?"
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Detailed Context & What You Tried <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Explain the background, where you are getting stuck, and what kind of advice would unblock you..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewPostModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-md"
              >
                Publish Block
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
