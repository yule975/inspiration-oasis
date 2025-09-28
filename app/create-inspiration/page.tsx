"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'

export default function CreateInspirationPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('产品需求')
  const [priority, setPriority] = useState<'低' | '中' | '高'>('中')
  const [tagsInput, setTagsInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  const canSubmit = useMemo(() => title.trim() && content.trim(), [title, content])

  const addTag = () => {
    const t = tagsInput.trim()
    if (!t) return
    if (tags.includes(t)) return
    setTags([...tags, t])
    setTagsInput('')
  }

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      toast.error('请填写标题与需求内容')
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          priority,
          tags,
          status: 'PENDING_EVALUATION',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || '创建失败')
      toast.success('需求已创建')
      router.push('/inspiration')
    } catch (err: any) {
      toast.error(err?.message || '创建失败，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="border-none shadow-lg bg-[#FFFBF2]">
          <CardHeader>
            <CardTitle className="text-2xl text-[#2F6A53]">创建需求 / 灵感表单</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#2F6A53]">标题</Label>
                <Input
                  placeholder="一句话描述你的需求或灵感"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-sm placeholder:text-xs placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#2F6A53]">详细描述</Label>
                <Textarea
                  placeholder="目标/背景、期望效果、约束条件、参考链接…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="text-sm placeholder:text-xs placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#2F6A53]">类别</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  >
                    <option>产品需求</option>
                    <option>设计创意</option>
                    <option>技术方案</option>
                    <option>市场活动</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2F6A53]">优先级</Label>
                  <div className="flex gap-2">
                    {(['低','中','高'] as const).map(p => (
                      <Button
                        key={p}
                        type="button"
                        variant={priority === p ? 'default' : 'outline'}
                        className={priority === p ? 'bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white' : ''}
                        onClick={() => setPriority(p)}
                        size="sm"
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2F6A53]">标签</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入后回车添加，例如：AI、效率"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() }}}
                      className="text-sm"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>添加</Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {tags.map(t => (
                        <Badge key={t} variant="secondary" className="text-xs cursor-pointer" onClick={() => removeTag(t)}>
                          {t} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="bg-[#2F6A53] hover:bg-[#2F6A53]/90 text-white"
                >
                  {submitting ? '提交中…' : '提交需求'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


