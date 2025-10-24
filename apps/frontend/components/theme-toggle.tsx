'use client';

import { useTheme } from '@/components/theme-provider';
import { motion } from 'framer-motion';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'light') return Sun;
    if (theme === 'dark') return Moon;
    return Monitor;
  };

  const getLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'System';
  };

  const Icon = getIcon();

  return (
    <motion.button
      onClick={cycleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="glass-card rounded-lg p-2.5 transition-all hover:bg-green-500/10"
      title={`Theme: ${getLabel()}`}
    >
      <Icon className="h-4 w-4 text-green-400" />
    </motion.button>
  );
}

