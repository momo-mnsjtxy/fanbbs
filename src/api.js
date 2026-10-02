const API_BASE = import.meta.env?.VITE_API_BASE || '/api/v1'

export class ApiError extends Error {
  constructor(message, { code = 'unknown_error', status = 0, fieldErrors = {}, requestId = '' } = {}) {
    super(message); this.name = 'ApiError'; this.code = code; this.status = status; this.fieldErrors = fieldErrors; this.requestId = requestId
  }
}

export function normalizeApiError(payload, status = 0) {
  const e = payload?.error || {}
  return new ApiError(e.message || '请求失败，请稍后重试', { code: e.code, status, fieldErrors: e.field_errors, requestId: e.request_id })
}

export function normalizeUser(user = {}) {
  return { ...user, name: user.display_name || user.name || user.handle || '社区成员' }
}

export function normalizePost(post = {}) {
  return {
    ...post,
    author: normalizeUser(post.author),
    content: post.body || post.summary || post.content || '',
    age: post.published_at ? new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(post.published_at)) : '刚刚',
    comments: post.comment_count ?? post.comments ?? 0,
    reposts: post.repost_count ?? post.reposts ?? 0,
    likes: post.like_count ?? post.likes ?? 0,
    views: post.views ?? '—'
  }
}

export function normalizeComment(comment = {}) {
  return { ...comment, author: normalizeUser(comment.author), content: comment.body || comment.content || '', age: comment.created_at ? new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(comment.created_at)) : '刚刚' }
}

export function clearSession() {
  sessionStorage.removeItem('fanbbs_access_token'); sessionStorage.removeItem('fanbbs_refresh_token'); sessionStorage.removeItem('fanbbs_user')
}

export async function refreshSession() {
  const refreshToken = sessionStorage.getItem('fanbbs_refresh_token')
  if (!refreshToken) return null
  const response = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refreshToken }) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) { clearSession(); return null }
  sessionStorage.setItem('fanbbs_access_token', payload.data.access_token)
  sessionStorage.setItem('fanbbs_refresh_token', payload.data.refresh_token)
  if (payload.data.user) sessionStorage.setItem('fanbbs_user', JSON.stringify(normalizeUser(payload.data.user)))
  return payload.data
}

async function request(path, options = {}, retried = false) {
  const token = sessionStorage.getItem('fanbbs_access_token')
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  let response
  try { response = await fetch(`${API_BASE}${path}`, { ...options, headers }) } catch { throw new ApiError('无法连接社区服务', { code: 'network_error' }) }
  const payload = await response.json().catch(() => ({}))
  if (response.status === 401 && token && !retried && !path.startsWith('/auth/')) {
    const renewed = await refreshSession().catch(() => null)
    if (renewed) return request(path, options, true)
    if (!options.method || options.method === 'GET') return request(path, options, true)
  }
  if (!response.ok) throw normalizeApiError(payload, response.status)
  return payload
}

export const api = {
  feed: async (feed = 'recommended', filters = {}) => { const value = feed === 'recommended' ? 'recommend' : feed; const params=new URLSearchParams({feed:value,limit:'20'});if(filters.categoryId)params.set('category_id',filters.categoryId);if(filters.tagId)params.set('tag_id',filters.tagId);const r = await request(`/posts?${params}`); return { ...r, data: (r.data || []).map(normalizePost) } },
  login: (identity, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ identity, password }) }),
  createPost: async (content, mediaIds = []) => { const r = await request('/posts', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ content, visibility: 'public', media_ids: mediaIds }) }); return { ...r, data: normalizePost(r.data) } },
  detail: async id => { const r = await request(`/posts/${encodeURIComponent(id)}`); return { ...r, data: normalizePost(r.data) } },
  comments: async id => { const r = await request(`/posts/${encodeURIComponent(id)}/comments?limit=30`); return { ...r, data: (r.data || []).map(normalizeComment) } },
  comment: async (id, content) => { const r = await request(`/posts/${encodeURIComponent(id)}/comments`, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ content }) }); return { ...r, data: normalizeComment(r.data) } },
  like: (id, liked) => request(`/posts/${encodeURIComponent(id)}/reactions/like`, { method: liked ? 'DELETE' : 'PUT' }),
  repost: id => request(`/posts/${encodeURIComponent(id)}/reposts`, { method: 'PUT' })
  ,register: (handle, email, displayName, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ handle, email, display_name: displayName, password }) })
  ,profile: () => request('/me')
  ,updateProfile: input => request('/me/profile', { method: 'PATCH', body: JSON.stringify(input) })
  ,categories: () => request('/categories')
  ,tags: () => request('/tags')
  ,search: async q => { const r = await request(`/search?q=${encodeURIComponent(q)}&type=all`); return { ...r, data: { ...r.data, posts: (r.data?.posts || r.data || []).map(normalizePost) } } }
  ,bookmarks: async () => { const r = await request('/me/bookmarks?limit=30'); return { ...r, data: (r.data || []).map(normalizePost) } }
  ,bookmark: (id, marked) => request(`/posts/${encodeURIComponent(id)}/bookmark`, { method: marked ? 'DELETE' : 'PUT' })
  ,follow: (id, following) => request(`/users/${encodeURIComponent(id)}/follow`, { method: following ? 'DELETE' : 'PUT' })
  ,profileById: id => request(`/users/${encodeURIComponent(id)}`)
  ,followers: id => request(`/users/${encodeURIComponent(id)}/followers?limit=30`)
  ,following: id => request(`/users/${encodeURIComponent(id)}/following?limit=30`)
  ,block: (id,blocked) => request(`/users/${encodeURIComponent(id)}/block`, { method: blocked?'DELETE':'PUT' })
  ,followCategory: (id,followed) => request(`/categories/${encodeURIComponent(id)}/follow`, { method:followed?'DELETE':'PUT' })
  ,categoryFollows: () => request('/me/category-follows?limit=50')
  ,sessions: () => request('/me/sessions')
  ,revokeSession: id => request(`/me/sessions/${encodeURIComponent(id)}`, { method:'DELETE' })
  ,notifications: () => request('/notifications?limit=30')
  ,readNotifications: ids => request('/notifications/read', { method: 'PUT', body: JSON.stringify({ ids }) })
  ,report: (targetType, targetId, reason) => request('/reports', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }) })
  ,updatePost: async (id, version, content) => { const r = await request(`/posts/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'If-Match': `"${version}"` }, body: JSON.stringify({ content }) }); return { ...r, data: normalizePost(r.data) } }
  ,deletePost: (id, version) => request(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'If-Match': `"${version}"` } })
  ,updateComment: async (postId, commentId, version, content) => { const r = await request(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, { method: 'PATCH', headers: { 'If-Match': `"${version}"` }, body: JSON.stringify({ content }) }); return { ...r, data: normalizeComment(r.data) } }
  ,deleteComment: (postId, commentId, version) => request(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE', headers: { 'If-Match': `"${version}"` } })
  ,likeComment: (postId, commentId, liked) => request(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/reactions/like`, { method: liked ? 'DELETE' : 'PUT' })
  ,adminReview: () => request('/admin/reports?status=open&limit=30')
  ,moderate: (id, decision, reason) => request(`/admin/reports/${encodeURIComponent(id)}/decision`, { method: 'POST', body: JSON.stringify({ decision, reason }) })
  ,adminUsers: (status='active') => request(`/admin/users?status=${encodeURIComponent(status)}&limit=50`)
  ,setUserStatus: (id,status,reason) => request(`/admin/users/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) })
  ,adminContent: ({status='published',type='',q=''}={}) => request(`/admin/content?status=${encodeURIComponent(status)}&type=${encodeURIComponent(type)}&q=${encodeURIComponent(q)}&limit=50`)
  ,createCategory: input => request('/admin/categories', { method:'POST', body:JSON.stringify(input) })
  ,updateCategory: (id,input) => request(`/admin/categories/${encodeURIComponent(id)}`, { method:'PATCH', body:JSON.stringify(input) })
  ,deleteCategory: (id,reason) => request(`/admin/categories/${encodeURIComponent(id)}`, { method:'DELETE', body:JSON.stringify({reason}) })
  ,createTag: input => request('/admin/tags', { method:'POST', body:JSON.stringify(input) })
  ,updateTag: (id,input) => request(`/admin/tags/${encodeURIComponent(id)}`, { method:'PATCH', body:JSON.stringify(input) })
  ,deleteTag: (id,reason) => request(`/admin/tags/${encodeURIComponent(id)}`, { method:'DELETE', body:JSON.stringify({reason}) })
  ,logout: () => request('/auth/logout', { method: 'POST' })
  ,conversations: async (cursor='') => { const r=await request(`/conversations?limit=30${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`); const me=JSON.parse(sessionStorage.getItem('fanbbs_user')||'null'); return {...r,data:(r.data||[]).map(c=>({...c,other_user:c.members?.map(m=>m.user).find(u=>u.id!==me?.id),last_message:c.last_message?{...c.last_message,content:c.last_message.body||c.last_message.content}:null}))} }
  ,createConversation: userId => request('/conversations', { method: 'POST', body: JSON.stringify({ member_ids: [userId] }) })
  ,messages: async (id,cursor='') => { const r=await request(`/conversations/${encodeURIComponent(id)}/messages?limit=50${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`); return {...r,data:(r.data||[]).map(m=>({...m,content:m.body||m.content,sender_id:m.sender_id||m.sender?.id}))} }
  ,sendMessage: async (id, content) => { const r=await request(`/conversations/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify({ body:content, client_message_id: crypto.randomUUID() }) }); return {...r,data:{...r.data,content:r.data.body||r.data.content,sender_id:r.data.sender_id||r.data.sender?.id}} }
  ,markConversationRead: (id,messageId) => request(`/conversations/${encodeURIComponent(id)}/read`, { method:'PUT', body:JSON.stringify({message_id:messageId}) })
  ,leaveConversation: id => request(`/conversations/${encodeURIComponent(id)}/membership`, { method:'DELETE' })
  ,events: cursor => request(`/events?limit=50${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`)
  ,homepage: () => request('/homepage')
  ,adminHomepage: () => request('/admin/homepage')
  ,updateHomepage: (version,input) => request('/admin/homepage', { method:'PATCH', headers:{'If-Match':`"${version}"`}, body:JSON.stringify(input) })
  ,products: (typeId='') => request(`/products?limit=50${typeId?`&type_id=${encodeURIComponent(typeId)}`:''}`)
  ,productTypes: () => request('/product-types')
  ,cart: () => request('/me/cart')
  ,setCart: (id,quantity) => request(`/me/cart/${encodeURIComponent(id)}`, {method:'PUT',body:JSON.stringify({quantity})})
  ,removeCart: id => request(`/me/cart/${encodeURIComponent(id)}`, {method:'DELETE'})
  ,createOrder: () => request('/orders', {method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()}})
  ,orders: () => request('/orders?limit=50')
  ,cancelOrder: (id,reason) => request(`/orders/${encodeURIComponent(id)}/cancel`, {method:'POST',body:JSON.stringify({reason})})
  ,checkIn: () => request('/me/check-in',{method:'POST'})
  ,gamification: () => request('/me/gamification')
  ,pointEvents: () => request('/me/points?limit=50')
  ,tasks: () => request('/tasks')
  ,ranks: () => request('/ranks?limit=20')
  ,frames: () => request('/me/avatar-frames')
  ,selectFrame: id => request('/me/avatar-frame',{method:'PUT',body:JSON.stringify({frame_id:id})})
}

export async function uploadFile(file, { avatar = false, altText = '' } = {}) {
  const send = async retried => {
    const form = new FormData(); form.append('file', file); form.append('alt_text', altText)
    const token = sessionStorage.getItem('fanbbs_access_token')
    let response
    try { response = await fetch(`${API_BASE}${avatar ? '/me/avatar' : '/uploads'}`, { method: avatar ? 'PUT' : 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form }) } catch { throw new ApiError('无法连接社区服务', { code: 'network_error' }) }
    if (response.status === 401 && !retried && await refreshSession().catch(()=>null)) return send(true)
    const payload = await response.json().catch(()=>({}))
    if (!response.ok) throw normalizeApiError(payload,response.status)
    return payload
  }
  return send(false)
}
