import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'nexus_dark' | 'oled_black' | 'clinical_light';
type Font = 'cyber_mono' | 'modern_sans' | 'classic_matrix';
type Density = 'compact' | 'standard' | 'cozy';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  font: Font;
  setFont: (font: Font) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  density: Density;
  setDensity: (d: Density) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const saved = JSON.parse(localStorage.getItem('nexus_visual_config') || '{}');
  
  const [theme, setTheme] = useState<Theme>(saved.theme || 'nexus_dark');
  const [font, setFont] = useState<Font>(saved.font || 'modern_sans');
  const [fontSize, setFontSize] = useState<number>(saved.fontSize || 14);
  const [density, setDensity] = useState<Density>(saved.density || 'standard');

  useEffect(() => {
    localStorage.setItem('nexus_visual_config', JSON.stringify({ theme, font, fontSize, density }));
    
    const root = document.documentElement;
    
    // 🎨 THEME COLORS
    if (theme === 'oled_black') {
      root.style.setProperty('--nexus-bg', '#000000');
      root.style.setProperty('--sidebar-bg', '#050505');
      root.style.setProperty('--text-main', '#ffffff');
      root.style.setProperty('--border-main', '#111111');
    } else if (theme === 'clinical_light') {
      root.style.setProperty('--nexus-bg', '#f0f2f5');
      root.style.setProperty('--sidebar-bg', '#ffffff');
      root.style.setProperty('--text-main', '#0a0a0c');
      root.style.setProperty('--border-main', '#e0e0e0');
    } else {
      root.style.setProperty('--nexus-bg', '#0a0a0c');
      root.style.setProperty('--sidebar-bg', '#111214');
      root.style.setProperty('--text-main', '#eeeeee');
      root.style.setProperty('--border-main', '#1e1f22');
    }

    // 📏 DENSITY & SPACING
    const spacing = density === 'compact' ? '0.5rem' : density === 'cozy' ? '1.5rem' : '1rem';
    const padding = density === 'compact' ? '0.25rem' : density === 'cozy' ? '1.25rem' : '0.75rem';
    root.style.setProperty('--nexus-spacing', spacing);
    root.style.setProperty('--nexus-padding', padding);
    root.style.setProperty('--nexus-line-height', density === 'compact' ? '1.2' : density === 'cozy' ? '1.8' : '1.5');

    // 🔤 OPTICS (Font & Size)
    root.style.setProperty('--nexus-font-size', `${fontSize}px`);
    const fontFamily = font === 'cyber_mono' ? '"JetBrains Mono", monospace' : 
                       font === 'classic_matrix' ? 'serif' : 
                       '"Inter", sans-serif';
    root.style.setProperty('--nexus-font-family', fontFamily);
    
  }, [theme, font, fontSize, density]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, font, setFont, fontSize, setFontSize, density, setDensity }}>
      <div className={`theme-${theme} density-${density} font-${font}`} 
           style={{ 
             fontFamily: 'var(--nexus-font-family)', 
             fontSize: 'var(--nexus-font-size)',
             lineHeight: 'var(--nexus-line-height)'
           }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};