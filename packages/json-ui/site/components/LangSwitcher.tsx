'use client';

import React, { useEffect, useState } from 'react';

export function LangSwitcher() {
  const [lang, setLang] = useState<'en' | 'zh'>('en');

  useEffect(() => {
    const saved = localStorage.getItem('json-ui-lang');
    if (saved === 'zh' || saved === 'en') {
      setLang(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  function switchLang(newLang: 'en' | 'zh') {
    setLang(newLang);
    document.documentElement.lang = newLang;
    localStorage.setItem('json-ui-lang', newLang);
  }

  return (
    <div className="lang-switcher">
      <button
        className={lang === 'en' ? 'active' : ''}
        onClick={() => switchLang('en')}
      >
        EN
      </button>
      <button
        className={lang === 'zh' ? 'active' : ''}
        onClick={() => switchLang('zh')}
      >
        中文
      </button>
    </div>
  );
}
