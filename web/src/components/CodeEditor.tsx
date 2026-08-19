"use client";

import React from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-csharp";
import "prismjs/themes/prism-dark.css";

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function CodeEditor({ value, onChange, onSubmit, disabled }: CodeEditorProps) {
  return (
    <div className="relative w-full font-mono text-[13px] leading-relaxed">
      <style jsx global>{`
        .prism-editor textarea {
          outline: none !important;
        }
        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: #6c7280;
        }
        .token.punctuation {
          color: #94a3b8;
        }
        .token.namespace {
          opacity: 0.7;
        }
        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol,
        .token.deleted {
          color: #f472b6;
        }
        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin,
        .token.inserted {
          color: #34d399;
        }
        .token.operator,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .style .token.string {
          color: #facc15;
        }
        .token.atrule,
        .token.attr-value,
        .token.keyword {
          color: #60a5fa;
        }
        .token.function,
        .token.class-name {
          color: #a78bfa;
        }
        .token.regex,
        .token.important,
        .token.variable {
          color: #fbbf24;
        }
      `}</style>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code) => highlight(code, languages.csharp, "csharp")}
        padding={10}
        textareaClassName="focus:outline-none"
        className="min-h-[60px] bg-transparent font-mono"
        style={{
          fontFamily: '"Fira Code", "Fira Mono", monospace',
          fontSize: 13,
          backgroundColor: "transparent",
        }}
        disabled={disabled}
        ignoreTabKey={false}
        insertSpaces
        tabSize={4}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
    </div>
  );
}
