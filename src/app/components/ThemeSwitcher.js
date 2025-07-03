'use client';

import { useTheme } from './ThemeProvider';

export function ThemeSwitcher() {
  const { theme, changeTheme } = useTheme();

  return (
    <div className="theme-switcher">
      <select 
        value={theme} 
        onChange={(e) => changeTheme(e.target.value)}
        className="theme-select"
      >
        <option value="light">ライト</option>
        <option value="dark">ダーク</option>
        <option value="system">システム設定</option>
      </select>
    </div>
  );
}
