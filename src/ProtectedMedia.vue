<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { fetchMediaBlob } from './api.js'

const props = defineProps({ media: {type:Array, default:() => []}, reviewPostId: {type:String, default:''}, lazy:Boolean })
const items = ref([]), root=ref(null), started=ref(!props.lazy)
let generation = 0, controller, observer
const urls = new Set()
function cleanup() {
  generation++; controller?.abort()
  for (const url of urls) URL.revokeObjectURL(url)
  urls.clear()
}
async function load() {
  cleanup()
  if(!started.value)return
  const current = generation
  controller = new AbortController()
  const signal = controller.signal
  items.value = props.media.map(media => ({id:media.id, label:media.alt_text || media.original_name || '帖子附件', url:'', type:'', error:''}))
  await Promise.all(items.value.map(async item => {
    try {
      const blob = await fetchMediaBlob(item.id, {signal,reviewPostId:props.reviewPostId})
      if (current !== generation) return
      const url = URL.createObjectURL(blob)
      urls.add(url); item.type = blob.type; item.url = url
    } catch (error) {
      if (current === generation && error.name !== 'AbortError') item.error = error.message
    }
  }))
}
watch(() => [props.media,props.reviewPostId], load, {immediate:true})
onMounted(()=>{
 if(started.value)return
 if(typeof IntersectionObserver==='undefined'){started.value=true;load();return}
 observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();started.value=true;load()}},{rootMargin:'240px'})
 if(root.value)observer.observe(root.value)
})
onUnmounted(()=>{observer?.disconnect();cleanup()})
</script>

<template>
  <div ref="root" class="submission-media"><p v-if="!started" class="media-lazy-placeholder" role="status">附件将在进入视野时加载。</p>
    <figure v-for="item in items" :key="item.id" class="submission-attachment">
      <p v-if="item.error" class="form-error" role="alert">{{item.label}}：{{item.error}}</p>
      <p v-else-if="!item.url" role="status">正在加载{{item.label}}…</p>
      <video v-else-if="item.type==='video/mp4'" :src="item.url" controls preload="metadata" :aria-label="item.label" @error="item.error='无法播放这个视频'">此浏览器无法播放视频。</video>
      <img v-else :src="item.url" :alt="item.label" @error="item.error='无法预览这张图片'">
      <figcaption>{{item.label}}</figcaption>
    </figure>
    <button v-if="items.some(item => item.error)" class="outline" @click="load">重试加载附件</button>
  </div>
</template>

<style scoped>
.media-lazy-placeholder{min-height:100px;display:grid;place-items:center;background:var(--surface,#f7f7f9);border-radius:12px;color:var(--muted,#777)}
</style>
