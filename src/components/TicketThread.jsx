import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Paperclip, Send, FileText as FileIcon, Image as ImageIcon, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ROLE_LABEL_KEY = { customer: 'ticket_thread_role_customer', expert: 'ticket_thread_role_expert', admin: 'ticket_thread_role_admin', system: 'ticket_thread_role_system' }

function isImageUrl(url, name) {
  const s = (name || url || '').toLowerCase()
  return /\.(png|jpe?g|gif|webp|svg)$/.test(s)
}

const TicketThread = forwardRef(function TicketThread({ ticketId, currentUserId, authedFetch, t, onMessages }, ref) {
  const [messages, setMessages] = useState(null)
  const [body, setBody] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const fileInputRef = useRef(null)

  useImperativeHandle(ref, () => ({ setBody }), [])

  const load = () => authedFetch(`/api/tickets/${ticketId}/messages`).then((m) => { setMessages(m); onMessages?.(m) }).catch(() => setMessages([]))
  useEffect(() => { load() }, [ticketId])

  const send = async () => {
    if (!body.trim() && !file) return
    setSending(true)
    setError(null)
    try {
      let attachment_url = ''
      let attachment_name = ''
      if (file) {
        const { path, token, public_url } = await authedFetch(`/api/tickets/${ticketId}/upload-url`, {
          method: 'POST',
          body: JSON.stringify({ filename: file.name }),
        })
        const { error: uploadError } = await supabase.storage.from('ticket-attachments').uploadToSignedUrl(path, token, file)
        if (uploadError) throw new Error(t('ticket_thread_upload_failed'))
        attachment_url = public_url
        attachment_name = file.name
      }
      await authedFetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: body.trim(), attachment_url, attachment_name }),
      })
      setBody('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      load()
    } catch (e) {
      setError(e.message)
    }
    setSending(false)
  }

  return (
    <div className="ticket-thread">
      <div className="ticket-thread__messages">
        {messages === null ? (
          <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div>
        ) : messages.length === 0 ? (
          <div className="ticket-thread__empty">{t('ticket_thread_empty')}</div>
        ) : messages.map((m) => (
          <div key={m.id} className={`ticket-thread__msg ${m.author_id === currentUserId ? 'ticket-thread__msg--own' : ''} ${m.author_role === 'system' ? 'ticket-thread__msg--system' : ''}`}>
            <div className="ticket-thread__msg-head">
              <span className={`ticket-thread__role ticket-thread__role--${m.author_role}`}>{t(ROLE_LABEL_KEY[m.author_role] || m.author_role)}</span>
              <span className="ticket-thread__time">{new Date(m.created_at).toLocaleString()}</span>
            </div>
            {m.body && <div className="ticket-thread__body">{m.body}</div>}
            {m.attachment_url && (
              isImageUrl(m.attachment_url, m.attachment_name) ? (
                <button type="button" className="ticket-thread__image-link" onClick={() => setLightbox(m.attachment_url)}>
                  <img src={m.attachment_url} alt={m.attachment_name || ''} className="ticket-thread__image" />
                </button>
              ) : (
                <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="ticket-thread__file-link">
                  <FileIcon size={14} strokeWidth={1.5} /> {m.attachment_name || t('ticket_thread_attachment')}
                </a>
              )
            )}
          </div>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="ticket-thread__compose">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('ticket_thread_placeholder')}
          rows={2}
        />
        <div className="ticket-thread__compose-actions">
          <label className="ticket-thread__attach-btn" title={t('ticket_thread_attach')}>
            <Paperclip size={15} strokeWidth={1.5} />
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} hidden />
          </label>
          {file && (
            <span className="ticket-thread__file-chip">
              {isImageUrl('', file.name) ? <ImageIcon size={12} strokeWidth={1.5} /> : <FileIcon size={12} strokeWidth={1.5} />}
              {file.name}
            </span>
          )}
          <button className="ticket-thread__send-btn" disabled={sending || (!body.trim() && !file)} onClick={send}>
            <Send size={14} strokeWidth={1.5} /> {t('ticket_thread_send')}
          </button>
        </div>
      </div>
      {lightbox && (
        <div
          className="ticket-lightbox"
          onClick={() => setLightbox(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLightbox(null)}
          role="dialog"
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          <button type="button" className="ticket-lightbox__close" onClick={() => setLightbox(null)} aria-label="Kapat">
            <X size={18} strokeWidth={2} />
          </button>
          <img src={lightbox} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
})

export default TicketThread
