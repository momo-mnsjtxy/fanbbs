<script setup>
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { api, uploadFile } from './api.js'
import ProtectedMedia from './ProtectedMedia.vue'
import RevisionHistory from './RevisionHistory.vue'

const props = defineProps({ postId: {type:String, default:''} })
const emit = defineEmits(['open','back','published','create'])
const states = [['','全部'],['pending','待审核'],['rejected','未通过'],['published','已发布'],['draft','草稿']]
const filter = ref(''), posts = ref([]), cursor = ref(''), snapshot = ref(null), loading = ref(false), paging = ref(false), error = ref('')
const heading = ref(null)
const editing = ref(false), saving = ref(false), notice = ref(''), reason = ref('')
const categories = ref([]), tags = ref([]), attachments=ref([])
const fields = ref({title:'',summary:'',content:'',category_id:'',tag_ids:[],visibility:'public'})
async function startEdit() {
  if (saving.value || !snapshot.value) return
  const current = generation, post = snapshot.value.post
  fields.value = {title:post.title||'',summary:post.summary||'',content:post.content||'',category_id:post.category?.id||'',tag_ids:(post.tags||[]).map(tag=>tag.id),visibility:post.visibility||'public'}
  attachments.value=(post.media||[]).map(media=>({key:media.id,media})); editing.value = true; error.value = ''; notice.value = ''
  try { const [c,t] = await Promise.all([api.categories(),api.tags()]); if(current===generation){categories.value=c.data||[];tags.value=t.data||[]} }
  catch(e){if(current===generation)error.value=e.message}
}
function cancelEdit() { if(!saving.value && confirm('放弃尚未保存的修改吗？')) editing.value=false }
async function mutate(work, success) {
  if(saving.value || !snapshot.value) return
  const current=generation, id=props.postId
  saving.value=true;error.value='';notice.value=''
  try {
    await work(snapshot.value.post)
    const result=await api.ownPost(id)
    if(current!==generation)return
    snapshot.value=result.data;editing.value=false;reason.value='';notice.value=success
  } catch(e){if(current===generation)error.value=e.code==='version_conflict'?'稿件版本已更新。请先复制未保存内容，再刷新稿件。':e.message}
  finally{if(current===generation)saving.value=false}
}
function chooseAttachments(event){
 const files=Array.from(event.target.files||[]);event.target.value=''
 if(saving.value)return
 if(files.length+attachments.value.length>8){error.value='每份稿件最多 8 个附件。';return}
 attachments.value.push(...files.map(file=>({key:crypto.randomUUID(),file})));error.value=''
}
function moveAttachment(index,delta){if(saving.value)return;const to=index+delta;if(to<0||to>=attachments.value.length)return;const [item]=attachments.value.splice(index,1);attachments.value.splice(to,0,item)}
const saveEdit=()=>mutate(async post=>{
 const selected=[...attachments.value],uploaded=[],ids=[],input={...fields.value,tag_ids:[...fields.value.tag_ids]}
 try{
  for(const item of selected){if(item.media)ids.push(item.media.id);else{const result=await uploadFile(item.file,{altText:item.file.name});uploaded.push(result.data.id);ids.push(result.data.id)}}
  await api.updatePost(post.id,post.version,{...input,media_ids:ids})
 }catch(e){await Promise.allSettled(uploaded.map(id=>api.abandonMedia(id)));throw e}
},'稿件正文与附件已保存')
const reviewAction=action=>mutate(post=>api.transitionSubmission(post.id,post.version,action,reason.value.trim()),action==='submit'?'稿件已送交审核':'稿件已撤回，可以继续编辑')
async function removeDraft(){
  if(saving.value||!snapshot.value||!confirm('删除这份稿件？它将从工作台隐藏。'))return
  const current=generation; saving.value=true;error.value=''
  try{await api.deletePost(snapshot.value.post.id,snapshot.value.post.version);if(current===generation)emit('back')}
  catch(e){if(current===generation)error.value=e.message}
  finally{if(current===generation)saving.value=false}
}
function reload(){if(saving.value)return;if(editing.value&&!confirm('刷新将放弃尚未保存的修改，继续吗？'))return;load()}

let generation = 0
onUnmounted(() => { generation++ })
const stateLabel = status => states.find(([key]) => key === status)?.[1] || status || '状态未知'
function formattedDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-CN')
}
async function load() {
  const current = ++generation, id = props.postId, status = filter.value
  loading.value = true; paging.value = false; saving.value=false;editing.value=false;notice.value='';reason.value=''; error.value = ''; snapshot.value = null; posts.value = []; cursor.value = ''
  try {
    const result = id ? await api.ownPost(id) : await api.ownPosts(status)
    if (current !== generation) return
    if (id) snapshot.value = result.data
    else { posts.value = result.data || []; cursor.value = result.page?.next_cursor || '' }
  } catch (e) { if (current === generation) error.value = e.message }
  finally { if (current === generation) { loading.value = false; await nextTick(); heading.value?.focus() } }
}
async function loadMore() {
  if (!cursor.value || loading.value || paging.value) return
  const current = generation, next = cursor.value, status = filter.value
  paging.value = true; error.value = ''
  try {
    const result = await api.ownPosts(status, next)
    if (current !== generation) return
    const seen = new Set(posts.value.map(post => post.id))
    posts.value.push(...(result.data || []).filter(post => !seen.has(post.id) && seen.add(post.id)))
    cursor.value = result.page?.next_cursor || ''
  } catch (e) { if (current === generation) error.value = e.message }
  finally { if (current === generation) paging.value = false }
}
watch(() => [props.postId,filter.value], load, {immediate:true})
</script>

<template>
  <section class="section-page author-workspace" :aria-busy="loading" aria-labelledby="author-heading">
    <div class="section-heading"><h1 id="author-heading" ref="heading" tabindex="-1">{{ postId ? '稿件详情' : '我的稿件' }}</h1><button v-if="postId" class="text-button" @click="emit('back')">返回我的稿件</button><button v-else class="outline" :disabled="loading" @click="reload">刷新稿件</button></div>
    <p class="muted-copy">草稿仅自己可见。可以保存修改、提交审核，或撤回待审稿件继续编辑。</p><button v-if="!postId" class="primary" @click="emit('create')">写新稿件</button><p v-if="notice" role="status">{{notice}}</p>
    <label v-if="!postId" class="submission-filter" for="submission-status">稿件状态<select id="submission-status" v-model="filter"><option v-for="[value,label] in states" :key="value" :value="value">{{ label }}</option></select></label>
    <p v-if="loading" role="status">正在加载稿件…</p>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <button v-if="error" class="outline" :disabled="loading || paging" @click="cursor ? loadMore() : reload()">重试加载稿件</button>
    <template v-if="!loading && !postId">
      <button v-for="post in posts" :key="post.id" class="submission-row" @click="emit('open', post.id)">
        <span class="submission-meta"><span class="status-label" :data-status="post.status">{{ stateLabel(post.status) }}</span><time :datetime="post.created_at">{{ formattedDate(post.created_at) }}</time></span>
        <strong>{{ post.title || '未命名稿件' }}</strong><p>{{ post.summary || post.content }}</p>
      </button>
      <p v-if="!posts.length && !error" class="empty-copy">{{ filter ? '这个状态下还没有稿件。' : '还没有稿件。发布后可在这里查看。' }}</p>
      <button v-if="cursor" class="outline load-more" :disabled="paging" @click="loadMore">{{ paging ? '加载中…' : '加载更多稿件' }}</button>
    </template>
    <article v-if="!loading && snapshot" class="submission-detail">
      <span class="status-label" :data-status="snapshot.post.status">{{ stateLabel(snapshot.post.status) }}</span>
      <h2>{{ snapshot.post.title || '未命名稿件' }}</h2>
      <time :datetime="snapshot.post.created_at">{{ formattedDate(snapshot.post.created_at) }}</time>
      <section v-if="snapshot.moderation" class="review-snapshot" aria-label="审核信息"><h3>审核进度：{{ stateLabel(snapshot.moderation.state) }}</h3><p v-if="snapshot.moderation.reason">{{ snapshot.moderation.reason }}</p><p v-else-if="snapshot.moderation.state==='pending'">稿件正在等待审核。</p><time v-if="snapshot.moderation.decided_at" :datetime="snapshot.moderation.decided_at">{{ formattedDate(snapshot.moderation.decided_at) }}</time></section>
      <form v-if="editing" class="composer-form author-edit-form" @submit.prevent="saveEdit">
        <label for="author-title">标题<input id="author-title" v-model="fields.title" required minlength="3" maxlength="120" :disabled="saving"></label>
        <label for="author-summary">摘要<textarea id="author-summary" v-model="fields.summary" maxlength="500" :disabled="saving"></textarea></label>
        <label for="author-content">正文<textarea id="author-content" v-model="fields.content" required maxlength="50000" rows="12" :disabled="saving"></textarea></label>
        <div class="compose-grid"><label>分类<select v-model="fields.category_id" :disabled="saving"><option value="">不选择</option><option v-for="category in categories" :key="category.id" :value="category.id">{{category.name}}</option></select></label><label>可见范围<select v-model="fields.visibility" :disabled="saving"><option value="public">所有人</option><option value="followers">仅关注者</option></select></label></div>
        <fieldset class="tag-picker" :disabled="saving"><legend>标签（最多 10 个）</legend><label v-for="tag in tags" :key="tag.id"><input v-model="fields.tag_ids" type="checkbox" :value="tag.id" :disabled="!fields.tag_ids.includes(tag.id)&&fields.tag_ids.length>=10">{{tag.name}}</label></fieldset>
        <fieldset class="author-attachment-editor" :disabled="saving"><legend>附件（{{attachments.length}} / 8）</legend><p>移除或调整顺序在保存稿件后生效，未关联的上传由现有清理规则处理。</p><ol><li v-for="(item,index) in attachments" :key="item.key"><span>{{item.media?.original_name||item.media?.alt_text||item.file?.name||'附件'}} <small>{{item.file?'待上传':'已保存'}}</small></span><button type="button" :disabled="index===0||saving" @click="moveAttachment(index,-1)" aria-label="附件上移">上移</button><button type="button" :disabled="index===attachments.length-1||saving" @click="moveAttachment(index,1)" aria-label="附件下移">下移</button><button type="button" :disabled="saving" @click="attachments.splice(index,1)">移除</button></li></ol><label>添加图片或视频<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" :disabled="saving||attachments.length>=8" @change="chooseAttachments"></label></fieldset>
        <div class="compose-actions"><button type="button" class="text-button" :disabled="saving" @click="cancelEdit">取消编辑</button><button class="primary" :disabled="saving||!fields.content.trim()">{{saving?'保存中…':'保存稿件'}}</button></div>
      </form>
      <section v-if="!editing" class="submission-actions" aria-label="稿件操作">
        <button v-if="['draft','rejected','published'].includes(snapshot.post.status)" class="outline" :disabled="saving" @click="startEdit">编辑稿件</button>
        <button v-if="['draft','rejected'].includes(snapshot.post.status)" class="text-button" :disabled="saving" @click="removeDraft">删除稿件</button>
        <template v-if="['draft','rejected','pending'].includes(snapshot.post.status)">
          <label for="submission-reason">{{snapshot.post.status==='pending'?'撤回说明':'提交说明'}}<textarea id="submission-reason" v-model="reason" minlength="3" maxlength="500" :disabled="saving" placeholder="至少 3 个字，说明投稿或修改情况"></textarea></label>
          <button class="primary" :disabled="saving||reason.trim().length<3" @click="reviewAction(snapshot.post.status==='pending'?'withdraw':'submit')">{{saving?'处理中…':snapshot.post.status==='pending'?'撤回审核':'提交审核'}}</button>
        </template>
      </section>
      <p v-if="snapshot.post.summary" class="muted-copy">{{ snapshot.post.summary }}</p><div class="submission-body">{{ snapshot.post.content }}</div>
      <ProtectedMedia v-if="snapshot.post.media?.length" :media="snapshot.post.media" />
      <RevisionHistory :key="snapshot.post.id" :post="snapshot.post" :disabled="saving||editing" @restored="snapshot.post=$event" @busy="saving=$event" />
      <button v-if="snapshot.post.status==='published'" class="outline" @click="emit('published', snapshot.post)">查看已发布的帖子</button>
    </article>
  </section>
</template>

<style scoped>
.author-attachment-editor{border:1px solid var(--line,#ddd);border-radius:10px;padding:16px}.author-attachment-editor ol{padding:0;list-style:none}.author-attachment-editor li{display:flex;gap:8px;align-items:center;margin:12px 0;flex-wrap:wrap}.author-attachment-editor li span{flex:1;min-width:140px;overflow-wrap:anywhere}.author-attachment-editor button{padding:6px;border:1px solid var(--line,#ddd);border-radius:6px}.author-attachment-editor small{color:var(--muted,#777)}
</style>
