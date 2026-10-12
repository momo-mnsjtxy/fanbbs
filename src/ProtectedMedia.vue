<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { fetchMediaBlob } from './api.js'

const props = defineProps({ media: {type:Array, default:() => []}, reviewPostId: {type:String, default:''} })
const items = ref([])
let generation = 0, controller
const urls = new Set()
function cleanup() {
  generation++; controller?.abort()
  for (const url of urls) URL.revokeObjectURL(url)
  urls.clear()
}
async function load() {
  cleanup()
  const current = generation
  controller = new AbortController()
  const signal = controller.signal
  items.value = props.media.map(media => ({id:media.id, label:media.alt_text || media.original_name || '稿件附件', url:'', type:'', error:''}))
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
onUnmounted(cleanup)
</script>

<template>
  <div class="submission-media">
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
