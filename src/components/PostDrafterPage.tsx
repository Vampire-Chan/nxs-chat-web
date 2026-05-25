import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Send, Globe, Trash2, Calendar, Clock, Smile, Tag, Shield, Terminal, FileText, Sparkles } from 'lucide-react';
import { api, calculateFileHash, calculatePerceptualHash } from '../services/api';
import type { IUser } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { NeuralSuggester } from './NeuralSuggester';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CUSTOM_EMOJI_MAP } from './CustomIcons';
import { NeuralDatePicker, NeuralTimePicker } from './NeuralPicker';

interface PostDrafterProps {
  currentUser: IUser;
  channelId: string;
  onBack: () => void;
  onComplete: (post: any) => void;
}

export const PostDrafterPage = ({
  currentUser,
  channelId,
  onBack,
  onComplete
}: PostDrafterProps) => {
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [isPublic, setIsPublic] = useState(channelId === 'global');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Markdown Suggestions
  const [suggestion, setSuggestion] = useState<{ query: string, type: 'mention' | 'tag', index: number } | null>(null);

  // Emojis, Scheduler
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Tags Matrix
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setCaption(v);
    const words = v.split(/\s+/);
    const last = words[words.length - 1] || '';
    if (last.startsWith('@') && last.length > 1) {
      setSuggestion({ query: last, type: 'mention', index: v.lastIndexOf(last) });
    } else if (last.startsWith('#') && last.length > 1) {
      setSuggestion({ query: last, type: 'tag', index: v.lastIndexOf(last) });
    } else {
      setSuggestion(null);
    }
  };

  const handleSelectSuggestion = (v: string) => {
    if (!suggestion) return;
    setCaption(`${caption.slice(0, suggestion.index)}${suggestion.type === 'mention' ? '@' : '#'}${v} ${caption.slice(suggestion.index + suggestion.query.length)}`);
    setSuggestion(null);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/[^\w]/g, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setCaption(prev => prev + ` #${newTag} `);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
    // Remove from caption text if it is present
    setCaption(prev => prev.replace(new RegExp(`#${tagToRemove}\\b`, 'g'), '').trim());
  };

  const handleSubmit = async () => {
    if (!file) return addToast(t('modals.visual_required'), 'error');
    setLoading(true);
    try {
      const hash = await calculateFileHash(file);
      const pHash = await calculatePerceptualHash(file);
      const check = await api.checkMediaHash(hash, pHash || undefined);

      const fd = new FormData();
      fd.append('caption', caption);
      fd.append('channelId', channelId);
      fd.append('isPublic', String(isPublic));
      fd.append('fileHash', hash);
      if (pHash) fd.append('pHash', pHash);

      if (check.exists && check.url) {
        fd.append('imageUrl', check.url);
      } else {
        fd.append('file', file);
      }

      // If scheduled post timing is specified
      if (showScheduler && scheduleDate && scheduleTime) {
        fd.append('scheduledAt', new Date(`${scheduleDate}T${scheduleTime}`).toISOString());
      }

      const res = await api.createPost(channelId, fd);
      onComplete(res);
      onBack();
    } catch (e) {
      addToast(t('modals.broadcast_failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const isGlobal = channelId === 'global';

  return (
    <div className="flex-1 bg-[#050507] flex flex-col min-h-0 relative border-l border-white/5">
      {/* HUD Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 bg-black/40">
        <div className="flex items-center space-x-3">
          <Terminal size={14} className="text-vani-blue" />
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] font-mono">
            [ BROADCAST_DRAFTER_TERMINAL_V5.7 ]
          </h3>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest bg-white/5 border border-white/5 hover:border-vani-blue/30 px-3 py-2 rounded-xl transition-all"
        >
          <X size={12} />
          <span>Exit Drafter</span>
        </button>
      </div>

      {/* Main Drafting Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Side: Composer Controls */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 border-r border-white/5">
          {/* File/Visual Attachment Viewport */}
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-48 lg:h-64 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-vani-blue/50 hover:bg-white/[0.02] transition-all overflow-hidden relative group"
          >
            {preview ? (
              <>
                <img src={preview} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white bg-black/80 px-4 py-2 rounded-xl border border-white/10">Swap Visual Payload</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-gray-900 border border-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon size={20} className="text-gray-400 group-hover:text-white" />
                </div>
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest group-hover:text-vani-blue transition-colors">
                  Upload Visual Payload (Required)
                </span>
                <span className="text-[7px] text-gray-600 font-mono mt-1">SUPPORTED FORMATS: PNG, JPG, WEBP</span>
              </>
            )}
            <input
              type="file"
              ref={fileRef}
              hidden
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  setPreview(URL.createObjectURL(f));
                }
              }}
            />
          </div>

          {/* Composer Input Area */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest font-mono">
                [ TEXT_PAYLOAD_COMPOSER ]
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-lg border text-gray-500 hover:text-white transition-all ${showEmojiPicker ? 'bg-vani-blue/10 border-vani-blue/30 text-vani-blue' : 'bg-transparent border-white/5'}`}
                >
                  <Smile size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduler(!showScheduler)}
                  className={`p-2 rounded-lg border text-gray-500 hover:text-white transition-all ${showScheduler ? 'bg-vani-blue/10 border-vani-blue/30 text-vani-blue' : 'bg-transparent border-white/5'}`}
                >
                  <Calendar size={14} />
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                className="w-full bg-[#07070a] border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-vani-blue resize-none h-40 custom-scrollbar text-sm font-mono"
                placeholder="Compose matrix broadcast stream... Use **bold**, ~~strikethrough~~, or standard MD schemas."
                value={caption}
                onChange={handleInputChange}
              />

              {/* Suggestions Overlay */}
              {suggestion && (
                <NeuralSuggester
                  query={suggestion.query}
                  type={suggestion.type}
                  onSelect={handleSelectSuggestion}
                  position={{ top: 0, left: 10 }}
                />
              )}
            </div>

            {/* Emoji Selector Overlay */}
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0c] border border-white/5 p-3 rounded-2xl grid grid-cols-6 gap-2 z-40 max-w-xs"
              >
                {Object.keys(CUSTOM_EMOJI_MAP).map((code) => {
                  const EmojiIcon = CUSTOM_EMOJI_MAP[code];
                  return (
                    <div
                      key={code}
                      onClick={() => {
                        setCaption(prev => prev + ` ${code} `);
                        setShowEmojiPicker(false);
                      }}
                      className="p-2 hover:bg-vani-blue/10 rounded-lg cursor-pointer transition-all flex items-center justify-center border border-white/5 hover:border-vani-blue/30"
                    >
                      <EmojiIcon />
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Scheduler Overlay */}
            {showScheduler && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#0a0a0c] border border-white/5 p-4 rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest font-mono">
                    [ TRANSMISSION_SCHEDULER_CALIBRATION ]
                  </span>
                  <button onClick={() => { setShowScheduler(false); setScheduleDate(''); setScheduleTime(''); }} className="text-[7px] font-black text-red-400 uppercase tracking-widest">
                    Purge Schedule
                  </button>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-left text-xs text-white flex items-center justify-between"
                    >
                      <span className="font-mono">{scheduleDate || 'Select Date'}</span>
                      <Calendar size={12} className="text-gray-500" />
                    </button>
                    {showDatePicker && (
                      <NeuralDatePicker
                        value={scheduleDate}
                        onChange={(d: string) => { setScheduleDate(d); setShowDatePicker(false); }}
                        onClose={() => setShowDatePicker(false)}
                      />
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <button
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-left text-xs text-white flex items-center justify-between"
                    >
                      <span className="font-mono">{scheduleTime || 'Select Time'}</span>
                      <Clock size={12} className="text-gray-500" />
                    </button>
                    {showTimePicker && (
                      <NeuralTimePicker
                        value={scheduleTime}
                        onChange={(t: string) => { setScheduleTime(t); setShowTimePicker(false); }}
                        onClose={() => setShowTimePicker(false)}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Tags Matrix */}
          <div className="space-y-3">
            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Tag size={10} className="text-vani-blue" />
              <span>[ MATRIX_TAGS_INDEX ]</span>
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-[#07070a] border border-white/5 rounded-2xl min-h-[48px] items-center">
              {tags.map(t => (
                <div key={t} className="flex items-center space-x-1.5 bg-vani-blue/5 border border-vani-blue/20 text-vani-blue text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                  <span>#{t}</span>
                  <button onClick={() => handleRemoveTag(t)} className="text-gray-500 hover:text-white transition-colors">
                    <X size={10} />
                  </button>
                </div>
              ))}
              <input
                type="text"
                placeholder="Press ENTER to index tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="bg-transparent text-xs text-white outline-none flex-1 font-mono uppercase placeholder-gray-700 min-w-[150px]"
              />
            </div>
          </div>

          {/* Network Scoping */}
          {!isGlobal && !currentUser.isPrivate && (
            <div
              onClick={() => setIsPublic(!isPublic)}
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isPublic ? 'bg-vani-blue/5 border-vani-blue/20' : 'bg-white/[0.01] border-white/5'}`}
            >
              <div className="flex items-center space-x-3">
                <Globe size={16} className={isPublic ? 'text-vani-blue' : 'text-gray-600'} />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Broadcast public matrix</span>
                  <span className="text-[7px] text-gray-500 font-mono uppercase">Visually discoverable across the grid</span>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-all ${isPublic ? 'bg-vani-blue' : 'bg-gray-800'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isPublic ? 'left-5.5' : 'left-0.5'}`} />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Render Viewport */}
        <div className="flex-1 bg-black/20 overflow-y-auto custom-scrollbar p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Sparkles size={10} className="text-vani-accent" />
              <span>[ MATRIX_LIVE_RENDER_VIEWPORT ]</span>
            </label>

            {/* Full preview container styled like a Post Card */}
            <div className="bg-[#0a0a0c]/60 border border-white/5 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
              {/* Fake post header */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800 overflow-hidden border border-white/5">
                  <img src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                    <span>{currentUser.username}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-vani-blue" />
                  </div>
                  <span className="text-[7px] text-gray-600 font-mono uppercase">TRANSMITTING_NODE</span>
                </div>
              </div>

              {/* Uploaded media view */}
              <div className="w-full h-48 lg:h-64 rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center">
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <FileText size={24} className="text-gray-700 mx-auto mb-2" />
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest font-mono">Awaiting Visual Stream</span>
                  </div>
                )}
              </div>

              {/* Rendered Caption markdown */}
              <div className="text-sm text-gray-300 min-h-[40px] text-left border-t border-white/5 pt-4">
                {caption ? (
                  <MarkdownRenderer content={caption} />
                ) : (
                  <span className="text-[9px] font-mono text-gray-600 italic uppercase">Awaiting text payload stream...</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Trigger in HUD Footer */}
          <div className="pt-6 border-t border-white/5">
            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className="w-full bg-vani-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-30 disabled:scale-100 transition-all hover:scale-[1.01] hover:shadow-red-500/10"
            >
              {loading ? 'Transmitting Visual & Text Payload...' : (isGlobal || isPublic ? 'TRANSIT TO PUBLIC MATRIX' : 'TRANSMIT SECURE NODE BROADCAST')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
