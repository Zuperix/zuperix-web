'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { ChatBubbleLeftIcon, LockClosedIcon, GlobeAltIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PermissionGate } from './PermissionGate';
import { Action } from '@/types/auth';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  is_private: boolean;
  type: string;
  coordinates?: { x: number; y: number; width?: number; height?: number } | null;
  timestamp?: number | null;
  user: {
    name: string;
    email: string;
  };
  created_at: string;
}

interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function CommentsSection({ 
  assetId, 
  workspaceId, 
  pendingAnnotation, 
  onCommentPosted 
}: { 
  assetId: string; 
  workspaceId?: string | null; 
  pendingAnnotation?: { type: string; coordinates?: any; timestamp?: number } | null;
  onCommentPosted?: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [mentionFilter, setMentionFilter] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const fetchMembers = async () => {
    if (!workspaceId) return;
    try {
      const data = await apiFetch<Member[]>(`/workspaces/${workspaceId}/members`);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  useEffect(() => {
    fetchComments();
    fetchMembers();
  }, [assetId, workspaceId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;
    setContent(value);

    // Detect @ mention
    const textBeforeCursor = value.substring(0, cursor);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      // Only trigger if @ is at start or preceded by space
      if (lastAtSymbol === 0 || textBeforeCursor[lastAtSymbol - 1] === ' ' || textBeforeCursor[lastAtSymbol - 1] === '\n') {
        // Only if there's no space between @ and cursor
        if (!textAfterAt.includes(' ')) {
          setMentionFilter(textAfterAt);
          setMentionIndex(lastAtSymbol);
          setSelectedIndex(0);
          return;
        }
      }
    }
    setMentionFilter(null);
  };

  const insertMention = (user: { name: string }) => {
    const before = content.substring(0, mentionIndex);
    const after = content.substring(mentionIndex + (mentionFilter?.length || 0) + 1);
    const newContent = `${before}@${user.name} ${after}`;
    setContent(newContent);
    setMentionFilter(null);
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(@\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="font-bold text-purple-400">{part}</span>;
      }
      return part;
    });
  };

  const filteredMembers = mentionFilter !== null
    ? members.filter(m => 
        m.user.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
        m.user.email.toLowerCase().includes(mentionFilter.toLowerCase())
      )
    : [];

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
          type: pendingAnnotation?.type || 'comment',
          coordinates: pendingAnnotation?.coordinates || null,
          timestamp: pendingAnnotation?.timestamp || null,
        }),
      });
      setContent('');
      fetchComments();
      if (onCommentPosted) onCommentPosted();
      toast.success(pendingAnnotation ? 'Annotation posted' : 'Comment posted');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await apiFetch(`/assets/comments/${id}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.id !== id));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
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
            <div 
              key={comment.id} 
              id={`comment-${comment.id}`}
              className={`group relative border rounded-xl p-3 transition-all ${
                comment.coordinates 
                  ? 'bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-purple-400">{comment.user?.name || 'Unknown User'}</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {comment.coordinates && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-bold rounded uppercase border border-purple-500/30">
                      <ChatBubbleLeftIcon className="h-2.5 w-2.5" />
                      Annotated
                    </span>
                  )}
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
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{renderContent(comment.content)}</p>
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
          <form onSubmit={handleSubmit} className="space-y-3 relative">
            {mentionFilter !== null && filteredMembers.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                <div className="p-2 border-b border-white/5 bg-black/20">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Mention User</span>
                </div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  {filteredMembers.map((member, idx) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => insertMention(member.user)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-4 py-2 text-sm flex flex-col transition-all ${
                        idx === selectedIndex ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="font-bold">{member.user.name}</span>
                      <span className={`text-[10px] ${idx === selectedIndex ? 'text-purple-200' : 'text-gray-500'}`}>{member.user.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <textarea
              value={content}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (mentionFilter !== null && filteredMembers.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev + 1) % filteredMembers.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    insertMention(filteredMembers[selectedIndex].user);
                  } else if (e.key === 'Escape') {
                    setMentionFilter(null);
                  }
                }
              }}
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
