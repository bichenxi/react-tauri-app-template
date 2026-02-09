import { useEffect, useRef, useCallback } from 'react'

/**
 * 自动滚动到底部 Hook
 * 适用于聊天消息列表场景
 */
export function useAutoScroll<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T>(null)
  const shouldAutoScroll = useRef(true)

  const scrollToBottom = useCallback((smooth = true) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant',
      })
    }
  }, [])

  // 监听用户滚动，判断是否在底部
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  // 依赖变化时自动滚动
  useEffect(() => {
    if (shouldAutoScroll.current) {
      scrollToBottom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ref, scrollToBottom }
}
