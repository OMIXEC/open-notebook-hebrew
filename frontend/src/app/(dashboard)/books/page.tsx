'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, FileUp, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StreamingResponse } from '@/components/search/StreamingResponse'
import { useAsk } from '@/lib/hooks/use-ask'
import { useModelDefaults } from '@/lib/hooks/use-models'
import { useTranslation } from '@/lib/hooks/use-translation'
import { sourcesApi } from '@/lib/api/sources'
import { QUERY_KEYS } from '@/lib/api/query-client'
import type { SourceListResponse } from '@/lib/types/api'

const READING_ACTIONS = [
  ['summary', 'סכמו את הטיעון המרכזי, הרעיונות החשובים והמסקנות של הספר.'],
  ['themes', 'נתחו את הנושאים והרעיונות המרכזיים בספר והביאו ראיות מהטקסט.'],
  ['characters', 'תארו את הדמויות המרכזיות, המניעים שלהן וההתפתחות שלהן בספר.'],
  ['timeline', 'בנו ציר זמן של האירועים המרכזיים בספר.'],
  ['concepts', 'הציגו את המושגים והרעיונות המרכזיים בספר והסבירו אותם.'],
  ['quoteLookup', 'מצאו ציטוטים מדויקים מהספר שעונים על השאלה שלי.'],
] as const

const BOOK_STATUS_KEYS: Record<string, string> = {
  new: 'sources.statusPreparing',
  queued: 'sources.statusQueued',
  running: 'sources.statusProcessing',
  processing: 'sources.statusProcessing',
  failed: 'sources.statusFailed',
}

export default function BooksPage() {
  const { t, language } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const { data: books = [], isLoading, isError } = useQuery<SourceListResponse[]>({
    queryKey: [...QUERY_KEYS.sources(), 'books'],
    queryFn: () => sourcesApi.list({ kind: 'book', limit: 100 }),
  })
  const { data: modelDefaults } = useModelDefaults()
  const ask = useAsk()

  const toggleBook = (id: string) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id])
  }

  const uploadBooks = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setUploadError(false)
    try {
      for (const file of Array.from(files)) {
        const title = file.name.replace(/\.(pdf|epub)$/i, '')
        await sourcesApi.create({
          type: 'upload',
          kind: 'book',
          title,
          file,
          embed: true,
          async_processing: true,
        })
      }
    } catch {
      setUploadError(true)
    } finally {
      await queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.sources(), 'books'] })
      setUploading(false)
    }
  }

  const askBooks = (prompt = question) => {
    if (!selectedIds.length || !prompt.trim() || !modelDefaults?.default_chat_model) return
    const defaultModel = modelDefaults.default_chat_model
    ask.sendAsk(prompt, {
      strategy: defaultModel,
      answer: defaultModel,
      finalAnswer: defaultModel,
    }, { bookIds: selectedIds })
  }

  const promptForAction = (english: string, hebrew: string) =>
    (language || '').startsWith('he') ? hebrew : english

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{t('books.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('books.description')}</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
            <FileUp className="h-4 w-4" />
            {uploading ? t('books.uploading') : t('books.upload')}
            <Input
              type="file"
              className="sr-only"
              accept=".pdf,.epub,application/pdf,application/epub+zip"
              multiple
              disabled={uploading}
              onChange={(event) => {
                void uploadBooks(event.currentTarget.files)
                event.currentTarget.value = ''
              }}
              aria-label={t('books.upload')}
            />
          </label>
        </header>

        {uploadError && <p role="alert" className="text-sm text-destructive">{t('sources.failedToUploadFile')}</p>}
        {isError && <p role="alert" className="text-sm text-destructive">{t('sources.failedToLoad')}</p>}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : books.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('books.noBooks')}</p>
          </CardContent></Card>
        ) : (
          <section aria-label={t('books.title')} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <label key={book.id} className="cursor-pointer">
                <Card className={selectedIds.includes(book.id) ? 'border-primary' : ''}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(book.id)}
                      onChange={() => toggleBook(book.id)}
                      aria-label={`${t('books.selectBook')}: ${book.title || t('sources.untitledSource')}`}
                      className="mt-1 accent-fern"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-medium">{book.title || t('sources.untitledSource')}</h2>
                      {book.author && <p className="mt-1 text-sm text-muted-foreground">{t('books.author')}: {book.author}</p>}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{book.asset?.file_path?.toLowerCase().endsWith('.epub') ? 'EPUB' : 'PDF'}</Badge>
                        {book.status && book.status !== 'completed' && (
                          <Badge variant="secondary">{t(BOOK_STATUS_KEYS[book.status] || 'common.unknown')}</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </label>
            ))}
          </section>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-teal" /> {t('books.actions')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedIds.length ? t('books.selectedCount', { count: selectedIds.length }) : t('books.selectBooksHint')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {READING_ACTIONS.map(([key, hebrewPrompt]) => {
                const englishPrompt = {
                  summary: 'Summarize the main argument, key ideas, and conclusions of the selected books.',
                  themes: 'Analyze the main themes and ideas in the selected books, using evidence from the text.',
                  characters: 'Describe the main characters, their motivations, and how they develop.',
                  timeline: 'Build a timeline of the main events in the selected books.',
                  concepts: 'Explain the key concepts and ideas in the selected books.',
                  quoteLookup: 'Find exact quotations from the selected books that answer my question.',
                }[key]
                return <Button key={key} variant="outline" size="sm" disabled={!selectedIds.length || ask.isStreaming}
                  onClick={() => { const prompt = promptForAction(englishPrompt, hebrewPrompt); setQuestion(prompt); askBooks(prompt) }}>
                  {t(`books.${key}`)}
                </Button>
              })}
            </div>
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t('books.askPlaceholder')}
              aria-label={t('searchPage.question')}
              rows={3}
              disabled={ask.isStreaming}
            />
            <Button onClick={() => askBooks()} disabled={!selectedIds.length || !question.trim() || ask.isStreaming || !modelDefaults?.default_chat_model}>
              {ask.isStreaming ? t('books.processing') : t('books.askAbout')}
            </Button>
            <StreamingResponse isStreaming={ask.isStreaming} strategy={ask.strategy} answers={ask.answers} finalAnswer={ask.finalAnswer} />
          </CardContent>
        </Card>
      </main>
    </AppShell>
  )
}
