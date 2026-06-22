import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-css';
import { useStore } from '../store';

function CodeView() {
  const generateCSS = useStore((s) => s.generateCSS);
  const code = generateCSS();
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.textContent = code;
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);

  return (
    <div className="panel-card code-view">
      <div className="panel-title">代码预览</div>
      <pre>
        <code ref={codeRef} className="language-css">
          {code}
        </code>
      </pre>
    </div>
  );
}

export default CodeView;
