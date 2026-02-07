import React from 'react';

// --- Helper for standardizing size/props ---
interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const NexusIcons = {
  // 1. The Brand Logo (Abstract N)
  Logo: ({ size = 24, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 4V20L12 12L20 20V4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 12V4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),

  // 2. Neon Heart (Cyberpunk style)
  NeonHeart: ({ size = 24, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
        fill="none" stroke="#FF00FF" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 6V9" stroke="#FF00FF" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),

  // 3. Rocket Boost (Action)
  RocketBoost: ({ size = 24, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2.5C12 2.5 5.5 10 5.5 15.5C5.5 19.0899 8.41015 22 12 22C15.5899 22 18.5 19.0899 18.5 15.5C18.5 10 12 2.5 12 2.5Z" fill="#FFA500" fillOpacity="0.2" stroke="#FFA500" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M12 16C12 16 9.5 18 9.5 19.5" stroke="#FFA500" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 16C12 16 14.5 18 14.5 19.5" stroke="#FFA500" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="11" r="2" fill="#FFA500"/>
    </svg>
  ),

  // 4. Cyber Skull (Edgy)
  CyberSkull: ({ size = 24, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="4" y="4" width="16" height="12" rx="4" stroke="#00FFDD" strokeWidth="2"/>
      <path d="M8 16V20M16 16V20M12 16V18" stroke="#00FFDD" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="10" r="1.5" fill="#00FFDD"/>
      <circle cx="15" cy="10" r="1.5" fill="#00FFDD"/>
      <path d="M4 10H2M22 10H20" stroke="#00FFDD" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // 5. Golden Gem (Premium)
  GoldenGem: ({ size = 24, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 3L2 9L12 21L22 9L18 3H6Z" stroke="#FFD700" strokeWidth="2" strokeLinejoin="round" fill="#FFD700" fillOpacity="0.1"/>
      <path d="M2 9H22M12 21L6 9M12 21L18 9" stroke="#FFD700" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M6 3L12 9L18 3" stroke="#FFD700" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  
  // 6. Verified Badge (Status)
  Verified: ({ size = 24, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#5865F2"/>
      <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

// Map for shortcodes
export const CUSTOM_EMOJI_MAP: Record<string, React.ComponentType<IconProps>> = {
  ':nexus_logo:': NexusIcons.Logo,
  ':neon_heart:': NexusIcons.NeonHeart,
  ':rocket_boost:': NexusIcons.RocketBoost,
  ':cyber_skull:': NexusIcons.CyberSkull,
  ':golden_gem:': NexusIcons.GoldenGem,
  ':verified:': NexusIcons.Verified,
};
