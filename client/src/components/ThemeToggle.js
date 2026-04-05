import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    // return (
    //     <button 
    //         className="theme-toggle-btn" 
    //         onClick={toggleTheme}
    //         aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    //         title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    //     >
    //         {theme === 'dark' ? '🌞' : '🌙'}
    //     </button>
    // );
};

export default ThemeToggle;
