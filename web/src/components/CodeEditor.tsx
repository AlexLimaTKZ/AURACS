"use client";

import React, { useState } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-csharp";
import "prismjs/themes/prism-dark.css"; // We'll override this with custom CSS later

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function CodeEditor({ value, onChange, onSubmit, disabled }: CodeEditorProps) {
  return (
    <div className="relative font-mono text-[13px] leading-relaxed w-full">
      <style jsx global>{`
        .prism-editor textarea {
          outline: none !important;
        }
        /* Custom Syntax Colors for Cyberpunk/Terminal Look */
        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: #6c7280; /* Gray */
        }
        .token.punctuation {
          color: #94a3b8; /* Slate */
        }
        .token.namespace {
          opacity: .7;
        }
        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol,
        .token.deleted {
          color: #f472b6; /* Pink */
        }
        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin,
        .token.inserted {
          color: #34d399; /* Emerald/Green */
        }
        .token.operator,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .style .token.string {
          color: #facc15; /* Yellow */
        }
        .token.atrule,
        .token.attr-value,
        .token.keyword {
          color: #60a5fa; /* Blue */
        }
        .token.function,
        .token.class-name {
          color: #a78bfa; /* Violet */
        }
        .token.regex,
        .token.important,
        .token.variable {
          color: #fbbf24; /* Amber */
        }
      `}</style>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code) => highlight(code, languages.csharp, "csharp")}
        padding={10}
        textareaClassName="focus:outline-none"
        className="font-mono bg-transparent min-h-[60px]"
        style={{
          fontFamily: '"Fira Code", "Fira Mono", monospace',
          fontSize: 13,
          backgroundColor: "transparent",
        }}
        disabled={disabled}
        ignoreTabKey={false}
        insertSpaces={true}
        tabSize={4}
        onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
            }
        }}
      />
    </div>
  );
}
