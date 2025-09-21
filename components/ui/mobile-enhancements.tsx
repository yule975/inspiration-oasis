'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// 移动端触摸反馈组件
export function TouchFeedback({ 
  children, 
  className,
  onTap,
  disabled = false 
}: {
  children: React.ReactNode
  className?: string
  onTap?: () => void
  disabled?: boolean
}) {
  const [isPressed, setIsPressed] = useState(false)

  const handleTouchStart = () => {
    if (!disabled) {
      setIsPressed(true)
    }
  }

  const handleTouchEnd = () => {
    setIsPressed(false)
    if (onTap && !disabled) {
      onTap()
    }
  }

  return (
    <div
      className={cn(
        'transition-all duration-150 select-none',
        isPressed && !disabled ? 'scale-95 opacity-80' : 'scale-100 opacity-100',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => setIsPressed(false)}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </div>
  )
}

// 滑动手势检测Hook
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50
}: {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > threshold
    const isRightSwipe = distanceX < -threshold
    const isUpSwipe = distanceY > threshold
    const isDownSwipe = distanceY < -threshold

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // 水平滑动
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft()
      }
      if (isRightSwipe && onSwipeRight) {
        onSwipeRight()
      }
    } else {
      // 垂直滑动
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp()
      }
      if (isDownSwipe && onSwipeDown) {
        onSwipeDown()
      }
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: onTouchEndHandler
  }
}

// 移动端优化的滚动容器
export function MobileScrollContainer({ 
  children, 
  className,
  showScrollbar = false 
}: {
  children: React.ReactNode
  className?: string
  showScrollbar?: boolean
}) {
  return (
    <div
      className={cn(
        'overflow-auto',
        !showScrollbar && 'scrollbar-hide',
        // 添加平滑滚动和触摸滚动优化
        'scroll-smooth',
        // iOS样式的弹性滚动
        'overscroll-behavior-contain',
        className
      )}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: showScrollbar ? 'thin' : 'none',
        msOverflowStyle: showScrollbar ? 'auto' : 'none'
      }}
    >
      {children}
    </div>
  )
}

// 移动端友好的模态框
export function MobileModal({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className 
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div className={cn(
        'relative w-full max-w-lg mx-4 bg-white rounded-t-2xl sm:rounded-2xl',
        'max-h-[90vh] overflow-hidden',
        'animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0',
        'duration-300',
        className
      )}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <MobileScrollContainer className="max-h-[calc(90vh-4rem)]">
          {children}
        </MobileScrollContainer>
      </div>
    </div>
  )
}