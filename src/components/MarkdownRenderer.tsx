import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CUSTOM_EMOJI_MAP } from './CustomIcons';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onSelectTag?: (tag: string) => void;
  onViewProfile?: (userId: string) => void;
}

export const MarkdownRenderer = ({
  content,
  className = '',
  onSelectTag,
  onViewProfile
}: MarkdownRendererProps) => {
  const navigate = useNavigate();

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          a: ({ href, children }) => {
            const safeHref = href?.startsWith('javascript:') || href?.startsWith('data:') ? '#' : href;
            const isInternal = safeHref?.startsWith('/') || safeHref?.startsWith(window.location.origin);
            if (isInternal && safeHref && safeHref !== '#') {
              return (
                <a
                  href={safeHref}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(safeHref.replace(window.location.origin, ''));
                  }}
                  className="text-vani-blue hover:underline font-bold transition-all cursor-pointer"
                >
                  {children}
                </a>
              );
            }
            return (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-vani-blue hover:underline font-bold transition-all"
              >
                {children}
              </a>
            );
          },
          strong: ({ children }) => <strong className="font-black text-white">{children}</strong>,
          em: ({ children }) => <em className="italic opacity-90">{children}</em>,
          code: ({ children }) => (
            <code className="bg-black/40 px-1.5 py-0.5 rounded-lg border border-white/5 font-mono text-[11px] lg:text-[12px] text-pink-400">
              {children}
            </code>
          ),
          del: ({ children }) => <del className="opacity-50 line-through">{children}</del>,
          text: ({ children }) => {
            const textContent = String(children);
            const parts = textContent.split(/(\s+)/);
            return (
              <>
                {parts.map((part: string, i: number) => {
                  const trimmed = part.trim();
                  
                  // Check custom emoji map
                  if (trimmed && CUSTOM_EMOJI_MAP[trimmed]) {
                    const EmojiComp = CUSTOM_EMOJI_MAP[trimmed];
                    return (
                      <span key={i} className="inline-flex items-center translate-y-[2px] mx-0.5 shrink-0">
                        <EmojiComp />
                      </span>
                    );
                  }

                  // Match mention e.g. @username
                  const mentionMatch = part.match(/^@(\w+)(.*)$/);
                  if (mentionMatch) {
                    const username = mentionMatch[1];
                    const trailing = mentionMatch[2];
                    return (
                      <span key={i}>
                        <span
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (onViewProfile) {
                              try {
                                const res = await api.getUserByHandle(username);
                                if (res.id) onViewProfile(res.id);
                              } catch (err) {
                                console.error("Identity resolution failed", err);
                              }
                            }
                          }}
                          className="text-vani-accent hover:underline cursor-pointer font-black"
                        >
                          @{username}
                        </span>
                        {trailing}
                      </span>
                    );
                  }

                  // Match tag e.g. #tag
                  const tagMatch = part.match(/^#(\w+)(.*)$/);
                  if (tagMatch) {
                    const tag = tagMatch[1];
                    const trailing = tagMatch[2];
                    return (
                      <span key={i}>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTag?.(tag);
                          }}
                          className="text-vani-blue hover:underline cursor-pointer font-black"
                        >
                          #{tag}
                        </span>
                        {trailing}
                      </span>
                    );
                  }

                  return <span key={i}>{part}</span>;
                })}
              </>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
