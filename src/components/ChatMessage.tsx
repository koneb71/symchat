/**
 * ChatMessage Component
 *
 * Displays chat messages with rich formatting including:
 * - Markdown rendering with GitHub Flavored Markdown (GFM) support
 * - Syntax highlighting for 190+ programming languages via highlight.js
 * - Code preview for web languages (HTML, CSS, JavaScript)
 * - Image attachments and file metadata display
 * - Typing indicators for streaming responses
 *
 * Supported Programming Languages (via highlight.js):
 * - Web: HTML, CSS, JavaScript, TypeScript, JSX, TSX, XML, JSON
 * - Popular: Python, Java, C, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
 * - Shell: Bash, PowerShell, Shell, Batch, CMD
 * - Data: SQL, GraphQL, YAML, TOML, INI, CSV
 * - Markup: Markdown, LaTeX, reStructuredText
 * - Functional: Haskell, Scala, Clojure, Elixir, Erlang, F#, OCaml
 * - JVM: Java, Kotlin, Scala, Groovy, Clojure
 * - .NET: C#, F#, VB.NET
 * - Systems: C, C++, Rust, Go, Zig, D, Assembly (x86, ARM)
 * - Scripting: Python, Ruby, Perl, Lua, R
 * - Mobile: Swift, Kotlin, Dart, Objective-C
 * - Web Frameworks: React (JSX), Vue, Angular, Svelte
 * - Database: SQL, PL/SQL, T-SQL, PostgreSQL, MySQL, MongoDB
 * - DevOps: Docker, Kubernetes, Terraform, Ansible, Nginx, Apache
 * - Other: Matlab, Fortran, COBOL, Ada, Lisp, Scheme, Prolog, Verilog, VHDL
 *
 * And many more! Full list: https://github.com/highlightjs/highlight.js/blob/main/SUPPORTED_LANGUAGES.md
 */

import { Avatar, AvatarFallback } from "./ui/avatar";
import { Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CodePreview } from "./CodePreview";
import { MultiFilePreview } from "./MultiFilePreview";
import { TypingIndicator } from "./TypingIndicator";
import { FileAttachment } from "./FileAttachment";
import { MessageActions } from "./MessageActions";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";
import { useMemo } from "react";
import "highlight.js/styles/atom-one-dark.css";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
  files?: Array<{ name: string; type: string; typeName: string; size: number }>;
  isGenerating?: boolean;
  messageIndex?: number;
  onEdit?: (index: number, newContent: string) => void;
  onRegenerate?: (fromIndex: number) => void;
  onDelete?: (index: number) => void;
  onCopy?: (content: string) => void;
}

interface CodeBlock {
  language: string;
  code: string;
}

export function ChatMessage({
  role,
  content,
  images,
  files,
  isGenerating,
  messageIndex,
  onEdit,
  onRegenerate,
  onDelete,
  onCopy,
}: ChatMessageProps) {
  const isUser = role === "user";

  // Extract all code blocks from the message
  const codeBlocks = useMemo(() => {
    const blocks: CodeBlock[] = [];
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1].toLowerCase(),
        code: match[2].trim(),
      });
    }

    return blocks;
  }, [content]);

  // Check if we have multiple web-related code blocks
  const hasMultipleWebFiles = useMemo(() => {
    const webLanguages = codeBlocks.filter((block) =>
      ["html", "htm", "css", "javascript", "js"].includes(block.language)
    );
    return webLanguages.length > 1;
  }, [codeBlocks]);

  // Custom components for ReactMarkdown to add code preview
  const components: Components = {
    code(props) {
      const { node, inline, className, children, ...rest } = props as any;
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      const code = String(children).replace(/\n$/, "");

      // For inline code, just render normally
      if (inline) {
        return (
          <code
            className={cn(
              "px-2 py-1 rounded-md bg-slate-200/80 dark:bg-slate-800/80 font-mono text-sm font-medium text-blue-700 dark:text-blue-300 border border-slate-300/50 dark:border-slate-700/50 shadow-sm",
              className
            )}
            {...rest}
          >
            {children}
          </code>
        );
      }

      // For code blocks, add preview button for web languages
      const isWebCode = [
        "html",
        "htm",
        "xml",
        "css",
        "javascript",
        "js",
      ].includes(language.toLowerCase());

      return (
        <div className="relative my-3 rounded-xl overflow-hidden border border-slate-700/50 bg-[#1e1e1e] shadow-lg">
          {/* Language badge */}
          {language && (
            <div className="absolute top-2 left-3 z-10">
              <span className="text-xs font-mono font-semibold text-blue-400 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50 backdrop-blur-sm">
                {language}
              </span>
            </div>
          )}
          {isWebCode && (
            <div className="absolute top-2 right-2 z-10">
              <CodePreview code={code} language={language} />
            </div>
          )}
          <pre
            className={cn(
              "!m-0 overflow-x-auto p-4 pt-12 !bg-[#1e1e1e]",
              className
            )}
            style={{ margin: 0 }}
          >
            <code
              className={className}
              style={{ color: "#d4d4d4", fontSize: "14px", lineHeight: "1.6" }}
              {...rest}
            >
              {children}
            </code>
          </pre>
        </div>
      );
    },
    pre(props) {
      // Prevent double <pre> wrapping - react-markdown handles this
      const { children } = props;
      return <>{children}</>;
    },
  };

  return (
    <div
      className={cn(
        "group flex gap-4 p-4 rounded-xl transition-all duration-200",
        isUser
          ? "bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-100/50 dark:border-blue-900/30"
          : "bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/40 dark:to-gray-900/40 border border-slate-200/50 dark:border-slate-800/50",
        "hover:shadow-md hover:scale-[1.01]"
      )}
    >
      <Avatar
        className={cn(
          "h-10 w-10 flex-shrink-0 shadow-md transition-transform duration-200 group-hover:scale-105",
          isUser
            ? "bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 ring-2 ring-blue-500/30 ring-offset-2 ring-offset-background"
            : "bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700 ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-background"
        )}
      >
        <AvatarFallback
          className={cn(
            "text-white font-semibold",
            isUser
              ? "bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600"
              : "bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700"
          )}
        >
          {isUser ? (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-xs font-bold drop-shadow-sm">You</span>
            </div>
          ) : (
            <Bot className="h-5 w-5 drop-shadow-sm" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2 overflow-hidden relative">
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            {isUser ? "You" : "Assistant"}
          </div>
          {/* Message Actions - positioned at top right */}
          {!isGenerating && messageIndex !== undefined && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <MessageActions
                role={role}
                content={content}
                messageIndex={messageIndex}
                onEdit={onEdit}
                onRegenerate={onRegenerate}
                onDelete={onDelete}
                onCopy={onCopy}
              />
            </div>
          )}
        </div>

        {/* Display attached files if present */}
        {files && files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {files.map((file, idx) => (
              <FileAttachment
                key={idx}
                name={file.name}
                type={file.type}
                typeName={file.typeName}
                size={file.size}
              />
            ))}
          </div>
        )}

        {/* Display images if present */}
        {images && images.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={`data:image/png;base64,${img}`}
                alt={`Uploaded image ${idx + 1}`}
                className="max-w-xs max-h-64 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg object-contain cursor-pointer hover:shadow-2xl hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200"
                onClick={() => {
                  // Open in new tab for full view
                  const win = window.open();
                  if (win) {
                    win.document.write(
                      `<img src="data:image/png;base64,${img}" style="max-width:100%; height:auto;" />`
                    );
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Show typing indicator when generating with no content yet */}
        {isGenerating && !content ? (
          <TypingIndicator />
        ) : (
          <>
            <div
              className="prose prose-sm dark:prose-invert max-w-none 
              prose-pre:p-0 prose-pre:m-0 
              prose-p:my-2 prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300
              prose-headings:mb-3 prose-headings:mt-4 prose-headings:leading-tight prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100
              prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
              prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-li:text-slate-700 dark:prose-li:text-slate-300
              prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-semibold
              prose-em:text-slate-800 dark:prose-em:text-slate-200
              prose-blockquote:my-3 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-950/20 prose-blockquote:rounded-r-lg
              prose-hr:my-4 prose-hr:border-slate-300 dark:prose-hr:border-slate-700
              prose-code:before:content-none prose-code:after:content-none prose-code:bg-slate-200/60 dark:prose-code:bg-slate-800/60 prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-table:my-4 prose-table:border-collapse prose-table:w-full prose-table:shadow-sm prose-table:rounded-lg prose-table:overflow-hidden
              prose-thead:bg-slate-100 dark:prose-thead:bg-slate-800/60 prose-thead:border-b-2 prose-thead:border-slate-300 dark:prose-thead:border-slate-700
              prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:text-slate-900 dark:prose-th:text-slate-100
              prose-td:px-4 prose-td:py-3 prose-td:border-t prose-td:border-slate-200 dark:prose-td:border-slate-800 prose-td:text-slate-700 dark:prose-td:text-slate-300
              prose-tr:transition-colors hover:prose-tr:bg-slate-50/50 dark:hover:prose-tr:bg-slate-800/30
              prose-img:my-3 prose-img:rounded-lg prose-img:shadow-md
              "
            >
              <ReactMarkdown
                components={components}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {content}
              </ReactMarkdown>
            </div>
            {/* Show combined preview button if multiple web files detected */}
            {hasMultipleWebFiles && !isUser && (
              <MultiFilePreview codeBlocks={codeBlocks} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
