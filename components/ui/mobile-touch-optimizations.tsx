import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// 移动端触摸优化的按钮组件
export function TouchOptimizedButton({
  children,
  className,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'default',
  ...props
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isPressed, setIsPressed] = useState(false)

  const sizeClasses = {
    sm: 'h-10 px-3 text-sm min-w-[44px]', // 符合移动端最小触摸目标44px
    default: 'h-12 px-4 text-base min-w-[48px]', // 更大的触摸目标
    lg: 'h-14 px-6 text-lg min-w-[56px]'
  }

  const variantClasses = {
    default: 'bg-[#2F6A53] text-white hover:bg-[#2F6A53]/90 active:bg-[#2F6A53]/80',
    outline: 'border-2 border-[#2F6A53]/30 text-[#2F6A53] hover:bg-[#2F6A53]/10 active:bg-[#2F6A53]/20',
    ghost: 'text-[#2F6A53] hover:bg-[#2F6A53]/10 active:bg-[#2F6A53]/20'
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[#2F6A53]/50 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation select-none', // 优化触摸体验
        sizeClasses[size],
        variantClasses[variant],
        isPressed && !disabled ? 'scale-95' : 'scale-100',
        className
      )}
      onTouchStart={() => !disabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// 移动端优化的输入框组件
export function TouchOptimizedInput({
  className,
  type = 'text',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'w-full h-12 px-4 text-base rounded-lg border-2 border-gray-200',
        'focus:border-[#2F6A53] focus:ring-2 focus:ring-[#2F6A53]/20 focus:outline-none',
        'transition-all duration-200',
        'touch-manipulation', // 优化触摸体验
        // 移动端特定样式
        'text-[16px]', // 防止iOS缩放
        className
      )}
      {...props}
    />
  )
}

// 移动端优化的文本域组件
export function TouchOptimizedTextarea({
  className,
  rows = 4,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full px-4 py-3 text-base rounded-lg border-2 border-gray-200',
        'focus:border-[#2F6A53] focus:ring-2 focus:ring-[#2F6A53]/20 focus:outline-none',
        'transition-all duration-200 resize-none',
        'touch-manipulation', // 优化触摸体验
        'text-[16px]', // 防止iOS缩放
        className
      )}
      {...props}
    />
  )
}

// 移动端滑动卡片组件
export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  threshold = 100
}: {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
  threshold?: number
}) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isSwipping, setIsSwipping] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsSwipping(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    const currentTouch = e.targetTouches[0].clientX
    const diff = touchStart - currentTouch
    setSwipeOffset(-diff * 0.3) // 减少移动幅度，提供阻力感
    setTouchEnd(currentTouch)
  }

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) {
      setIsSwipping(false)
      setSwipeOffset(0)
      return
    }

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > threshold
    const isRightSwipe = distance < -threshold

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }

    setIsSwipping(false)
    setSwipeOffset(0)
  }

  return (
    <div
      className={cn(
        'transition-transform duration-200 touch-manipulation',
        className
      )}
      style={{
        transform: isSwipping ? `translateX(${swipeOffset}px)` : 'translateX(0px)'
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
    >
      {children}
    </div>
  )
}

// 移动端下拉刷新组件
export function PullToRefresh({
  children,
  onRefresh,
  refreshing = false,
  threshold = 80
}: {
  children: React.ReactNode
  onRefresh: () => void
  refreshing?: boolean
  threshold?: number
}) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [startY, setStartY] = useState(0)

  const onTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY
    const diff = currentY - startY
    
    // 只在页面顶部且向下拉时触发
    if (diff > 0 && window.scrollY === 0) {
      setIsPulling(true)
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5))
    }
  }

  const onTouchEnd = () => {
    if (pullDistance >= threshold && !refreshing) {
      onRefresh()
    }
    setIsPulling(false)
    setPullDistance(0)
  }

  return (
    <div className="relative">
      {/* 刷新指示器 */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10"
        style={{
          height: `${pullDistance}px`,
          opacity: isPulling ? 1 : 0
        }}
      >
        <div className="flex items-center space-x-2 text-[#2F6A53]">
          <div className={cn(
            'w-5 h-5 border-2 border-current border-t-transparent rounded-full',
            (refreshing || pullDistance >= threshold) && 'animate-spin'
          )} />
          <span className="text-sm font-medium">
            {refreshing ? '刷新中...' : pullDistance >= threshold ? '松开刷新' : '下拉刷新'}
          </span>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance}px)`
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

// 移动端底部操作栏
export function MobileActionBar({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200',
      'p-4 pb-safe-area-inset-bottom', // 适配iPhone底部安全区域
      'z-50 shadow-lg',
      className
    )}>
      {children}
    </div>
  )
}

// 移动端浮动操作按钮
export function FloatingActionButton({
  children,
  onClick,
  className,
  position = 'bottom-right'
}: {
  children: React.ReactNode
  onClick: () => void
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-50 w-14 h-14 bg-[#2F6A53] text-white rounded-full shadow-lg',
        'flex items-center justify-center',
        'hover:bg-[#2F6A53]/90 active:scale-95',
        'transition-all duration-200 touch-manipulation',
        'focus:outline-none focus:ring-2 focus:ring-[#2F6A53]/50 focus:ring-offset-2',
        positionClasses[position],
        className
      )}
    >
      {children}
    </button>
  )
}