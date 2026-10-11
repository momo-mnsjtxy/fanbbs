import test from 'node:test'
import assert from 'node:assert/strict'
import { api, uploadFile, fetchMediaBlob } from '../src/api.js'
import { readFile } from 'node:fs/promises'

// Invoked only by scripts/test-local-api.sh with a new local fixture.
assert.equal(process.env.FANBBS_E2E_REVIEW_FIXTURE,'1','Use the disposable API runner')
const base='http://127.0.0.1:8080',nativeFetch=globalThis.fetch,storage=new Map()
globalThis.sessionStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}
globalThis.fetch=(url,options)=>nativeFetch(new URL(url,base),options)
const use=user=>{storage.clear();storage.set('fanbbs_access_token',user.access_token);storage.set('fanbbs_refresh_token',user.refresh_token);storage.set('fanbbs_user',JSON.stringify(user.user))}
const headers=user=>({Authorization:`Bearer ${user.access_token}`,'Content-Type':'application/json'})
async function register(prefix){const handle=`${prefix}_${crypto.randomUUID().slice(0,8)}`;return (await api.register(handle,`${handle}@example.test`,prefix,'live-contract-pass-1')).data}
async function raw(path,user,method='GET',body){const response=await nativeFetch(new URL(`/api/v1${path}`,base),{method,headers:headers(user),...(body?{body:JSON.stringify(body)}:{})});return {response,payload:await response.json()}}

test('live preferences, independent chat counts, muted sync and receipt reconciliation',async()=>{
  const owner=await register('live_inbox'),sender=await register('live_sender')
  use(sender);const conversation=(await api.createConversation(owner.user.id)).data
  const first=(await api.sendMessage(conversation.id,'First notification remains after muting')).data
  use(owner)
  assert.equal((await api.notificationPreferences()).data.preferences.message,true)
  assert.deepEqual((await api.conversationCounts()).data,{conversations:1,messages:1})
  assert.equal((await api.notificationCounts()).data.by_type.message,1)
  const updated=(await api.updateNotificationPreferences({message:false,like:false})).data.preferences
  assert.equal(updated.message,false);assert.equal(updated.moderation,true);assert.equal(updated.comment,true)
  await assert.rejects(api.updateNotificationPreferences({moderation:false}),e=>e.status===422)
  use(sender);const silent=(await api.sendMessage(conversation.id,'Silent, still unread in chat')).data
  use(owner)
  assert.equal((await api.notificationCounts()).data.total,1)
  assert.deepEqual((await api.conversationCounts()).data,{conversations:1,messages:2})
  const notifications=(await api.notifications('',{type:'message',unread:true})).data
  assert.equal(notifications.length,1);assert.equal(notifications[0].subject_id,first.id)
  const events=(await api.events('')).data
  assert.equal(events.find(e=>e.notification.subject_id===silent.id).notification.muted,true)
  assert.equal((await api.conversations()).data.find(c=>c.id===conversation.id).unread_count,2)
  await api.readNotifications([])
  assert.equal((await api.notificationCounts()).data.total,0)
  assert.equal((await api.conversationCounts()).data.messages,2)
  await api.markConversationRead(conversation.id,silent.id)
  assert.deepEqual((await api.conversationCounts()).data,{conversations:0,messages:0})
  assert.equal((await api.conversation(conversation.id)).data.unread_count,0)
  await api.markConversationRead(conversation.id,first.id)
  assert.equal((await api.conversation(conversation.id)).data.last_read_message_id,silent.id)
  await api.leaveConversation(conversation.id)
  assert.deepEqual((await api.conversationCounts()).data,{conversations:0,messages:0})
  assert.equal((await api.conversations()).data.length,0)
})

test('live private author status, masked public/foreign reads and review reason',async()=>{
  storage.clear();const owner=await register('live_author'),outsider=await register('live_outsider')
  use(owner)
  const first=(await api.createPost({title:'Private contract example',content:'Only my author workspace can see this.',status:'pending',visibility:'public'})).data
  const second=(await api.createPost({content:'Second pending body for cursor scope.',status:'pending'})).data
  assert.equal(first.status,'pending');assert.equal(first.content,'Only my author workspace can see this.')
  await assert.rejects(api.detail(first.id),e=>e.status===404)
  const before=(await api.ownPost(first.id)).data
  assert.equal(before.post.status,'pending');assert.equal(before.moderation.state,'pending')
  assert.ok((await api.ownPosts('pending')).data.some(post=>post.id===first.id))
  const page=await raw('/me/posts?status=pending&limit=1',owner)
  assert.equal(page.response.status,200);assert.ok(page.payload.page.next_cursor)
  const cursor=page.payload.page.next_cursor
  const remaining=await api.ownPosts('pending',cursor)
  assert.equal(remaining.data.length,1)
  await assert.rejects(api.ownPosts('rejected',cursor),e=>e.status===422)
  use(outsider);await assert.rejects(api.ownPost(first.id),e=>e.status===404)
  await assert.rejects(api.ownPosts('pending',cursor),e=>e.status===422)
  storage.clear();const moderator=(await api.login('demo','demo1234')).data;use(moderator)
  await api.moderatePost(first.id,'rejected','Please clarify the supporting example.')
  use(owner)
  const after=(await api.ownPost(first.id)).data
  assert.equal(after.post.status,'rejected');assert.equal(after.moderation.reason,'Please clarify the supporting example.')
  assert.deepEqual((await api.ownPosts('rejected')).data.map(post=>post.id),[first.id])
  assert.deepEqual((await api.ownPosts('pending')).data.map(post=>post.id),[second.id])
  const notice=(await api.notifications('',{type:'moderation',unread:true})).data[0]
  assert.equal(notice.subject_id,first.id)
  await assert.rejects(api.detail(first.id),e=>e.status===404)
  const snapshot=await raw(`/me/posts/${first.id}`,owner)
  assert.equal(snapshot.response.headers.get('etag'),`"${after.post.version}"`)
})

test('live private image and MP4 bytes require the owner bearer before and after rejection',async()=>{
  storage.clear();const owner=await register('live_media'),outsider=await register('live_viewer');use(owner)
  const fixtures=[['private-image.png','image/png'],['private-video.mp4','video/mp4']],assets=[]
  for(const [name,type] of fixtures){
    const bytes=await readFile(new URL(`./fixtures/${name}`,import.meta.url))
    const asset=(await uploadFile(new File([bytes],name,{type}),{altText:`Synthetic ${name}`})).data
    assert.equal(asset.mime_type,type);assets.push({asset,bytes,type})
  }
  const pending=(await api.createPost({content:'Synthetic private image and video attachments.',status:'pending',media_ids:assets.map(({asset})=>asset.id)})).data
  assert.equal((await api.ownPost(pending.id)).data.post.media.length,2)
  for(const {asset,bytes,type} of assets){
    assert.equal((await nativeFetch(new URL(asset.url,base))).status,404)
    use(outsider);await assert.rejects(fetchMediaBlob(asset.id),e=>e.status===404)
    use(owner);const blob=await fetchMediaBlob(asset.id)
    assert.equal(blob.type,type);assert.deepEqual(Buffer.from(await blob.arrayBuffer()),bytes)
    const response=await nativeFetch(new URL(asset.url,base),{headers:headers(owner)})
    assert.match(response.headers.get('cache-control'),/private/)
  }
  storage.clear();const moderator=(await api.login('demo','demo1234')).data;use(moderator)
  await api.moderatePost(pending.id,'rejected','Review-only synthetic media test.')
  use(owner);assert.equal((await api.ownPost(pending.id)).data.post.status,'rejected')
  for(const {asset,bytes,type} of assets){const blob=await fetchMediaBlob(asset.id);assert.equal(blob.type,type);assert.deepEqual(Buffer.from(await blob.arrayBuffer()),bytes);assert.equal((await nativeFetch(new URL(asset.url,base))).status,404)}
})
