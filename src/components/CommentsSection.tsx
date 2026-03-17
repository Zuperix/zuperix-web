'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { ChatBubbleLeftIcon, LockClosedIcon, GlobeAltIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PermissionGate } from './PermissionGate';
import { Action } from '@/types/auth';

interface Comment {
  id: string;
  content: string;
  is_private: boolean;
  user: {
    name: string;
    email: string;
  };
  created_at: string;
}

export default function CommentsSection({ assetId, workspaceId }: { assetId: string, workspaceId?: string | null }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Comment[]>(`/assets/${assetId}/comments`);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [assetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      await apiFetch(`/assets/${assetId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          is_private: isPrivate,
        }),
      });
      setContent('');
      fetchComments();
    } catch (error) {
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await apiFetch(`/assets/comments/${id}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      alert('Failed to delete comment');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftIcon className="h-5 w-5 text-purple-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Comments</h2>
          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-full">
            {comments.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="h-5 w-5 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10">
            <ChatBubbleLeftIcon className="h-10 w-10 text-gray-700 mx-auto mb-2 opacity-50" />
            <p className="text-gray-500 text-sm">No comments yet</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group relative bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-purple-400">{comment.user?.name || 'Unknown User'}</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {comment.is_private ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded uppercase">
                      <LockClosedIcon className="h-2.5 w-2.5" />
                      Private
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded uppercase">
                      <GlobeAltIcon className="h-2.5 w-2.5" />
                      Global
                    </span>
                  )}
                </div>
                <PermissionGate action={Action.Delete} subject="AssetComment" workspaceId={workspaceId}>
                  <button 
                    onClick={() => handleDelete(comment.id)}
                    className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </PermissionGate>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-black/20 border-t border-white/5">
        <PermissionGate 
          action={Action.Create} 
          subject="AssetComment" 
          workspaceId={workspaceId}
          fallback={
            <div className="flex flex-col items-center justify-center py-6 text-gray-500 gap-2">
              <LockClosedIcon className="h-6 w-6 opacity-30" />
              <p className="text-[10px] font-bold uppercase tracking-widest">You don't have permission to post comments</p>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 placeholder:text-gray-600 transition-all resize-none min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  isPrivate 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                }`}
              >
                {isPrivate ? <LockClosedIcon className="h-3 w-3" /> : <GlobeAltIcon className="h-3 w-3" />}
                {isPrivate ? 'Private' : 'Global'}
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:tracking-wide text-white text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
              >
                Post
                <PaperAirplaneIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </PermissionGate>
      </div>
    </div>
  );
}
