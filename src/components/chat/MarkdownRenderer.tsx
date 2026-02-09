import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { cn, copyToClipboard } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

function CodeBlock({ children, className: codeClassName }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const language = codeClassName?.replace('language-', '') || ''

  const handleCopy = async () => {
    await copyToClipboard(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2 text-xs text-gray-500">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-gray-700 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto bg-gray-50 text-sm">
        <code className={codeClassName}>{children}</code>
      </pre>
    </div>
  )
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ className: codeClassName, children, ...props }) {
            const isInline = !codeClassName
            if (isInline) {
              return (
                <code className="bg-gray-100 text-primary px-1.5 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              )
            }
            return <CodeBlock className={codeClassName}>{String(children).replace(/\n$/, '')}</CodeBlock>
          },
          // 表格样式
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="w-full border-collapse border border-gray-200 text-sm">
                  {children}
                </table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th className="bg-gray-50 border border-gray-200 px-4 py-2 text-left font-semibold">
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td className="border border-gray-200 px-4 py-2">{children}</td>
            )
          },
          // 链接
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {children}
              </a>
            )
          },
          // 标题
          h1({ children }) { return <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1> },
          h2({ children }) { return <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2> },
          h3({ children }) { return <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3> },
          // 段落
          p({ children }) { return <p className="my-2 leading-7">{children}</p> },
          // 列表
          ul({ children }) { return <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul> },
          ol({ children }) { return <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol> },
          // 引用
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary/30 pl-4 my-3 text-gray-600 italic">
                {children}
              </blockquote>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
