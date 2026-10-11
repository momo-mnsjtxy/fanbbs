<script setup>
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { api } from './api.js'
import ProtectedMedia from './ProtectedMedia.vue'

const props = defineProps({ postId: {type:String, default:''} })
const emit = defineEmits(['open','back','published'])
const states = [['','全部'],['pending','待审核'],['rejected','未通过'],['published','已发布'],['draft','草稿']]
const filter = ref(''), posts = ref([]), cursor = ref(''), snapshot = ref(null), loading = ref(false), paging = ref(false), error = ref('')
const heading = ref(null)
let generation = 0
onUnmounted(() => { generation++ })
const stateLabel = status => states.find(([key]) => key === status)?.[1] || status || '状态未知'
function formattedDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-CN')
}
async function load() {
  const current = ++generation, id = props.postId, status = filter.value
  loading.value = true; paging.value = false; error.value = ''; snapshot.value = null; posts.value = []; cursor.value = ''
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
    <div class="section-heading"><h1 id="author-heading" ref="heading" tabindex="-1">{{ postId ? '稿件详情' : '我的稿件' }}</h1><button v-if="postId" class="text-button" @click="emit('back')">返回我的稿件</button><button v-else class="outline" :disabled="loading" @click="load">刷新稿件</button></div>
    <p class="muted-copy">这里显示你的投稿和审核进度，仅自己可见。</p>
    <label v-if="!postId" class="submission-filter" for="submission-status">稿件状态<select id="submission-status" v-model="filter"><option v-for="[value,label] in states" :key="value" :value="value">{{ label }}</option></select></label>
    <p v-if="loading" role="status">正在加载稿件…</p>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <button v-if="error" class="outline" :disabled="loading || paging" @click="cursor ? loadMore() : load()">重试加载稿件</button>
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
      <p v-if="snapshot.post.summary" class="muted-copy">{{ snapshot.post.summary }}</p><div class="submission-body">{{ snapshot.post.content }}</div>
      <ProtectedMedia v-if="snapshot.post.media?.length" :media="snapshot.post.media" />
      <button v-if="snapshot.post.status==='published'" class="outline" @click="emit('published', snapshot.post)">查看已发布的帖子</button>
    </article>
  </section>
</template>
