<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { api } from './api.js'

const kinds = [['comment','回复'],['like','点赞'],['repost','转发'],['follow','关注'],['message','私信提醒']]
const preferences = ref(null), saved = ref(null), loading = ref(false), saving = ref(false), error = ref(''), notice = ref('')
let alive = true
onUnmounted(() => { alive = false })
const changes = computed(() => Object.fromEntries(kinds.filter(([kind]) => preferences.value?.[kind] !== saved.value?.[kind]).map(([kind]) => [kind, preferences.value[kind]])))
async function load() {
  loading.value = true; error.value = ''
  try {
    const result = await api.notificationPreferences()
    if (!alive) return
    saved.value = {...result.data.preferences}; preferences.value = {...saved.value}
  } catch (e) { if (alive) error.value = e.message }
  finally { if (alive) loading.value = false }
}
async function save() {
  if (saving.value || !Object.keys(changes.value).length) return
  saving.value = true; error.value = ''; notice.value = ''
  try {
    const result = await api.updateNotificationPreferences(changes.value)
    if (!alive) return
    saved.value = {...result.data.preferences}; preferences.value = {...saved.value}; notice.value = '通知偏好已保存'
  } catch (e) { if (alive) error.value = e.message }
  finally { if (alive) saving.value = false }
}
onMounted(load)
</script>

<template>
  <section id="notification-preferences" class="notification-preferences" aria-labelledby="preference-title" :aria-busy="loading || saving">
    <h2 id="preference-title">通知偏好</h2>
    <p class="muted-copy">只影响之后的通知，已有通知会保留。关闭私信提醒后，仍可在会话中查看消息和未读数。</p>
    <p v-if="loading" role="status">正在加载偏好…</p>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <button v-if="!preferences && !loading" class="outline" @click="load">重试加载偏好</button>
    <form v-if="preferences" @submit.prevent="save">
      <fieldset :disabled="saving">
        <legend class="sr-only">选择需要接收的通知</legend>
        <label v-for="[kind,label] in kinds" :key="kind" class="preference-option"><input v-model="preferences[kind]" type="checkbox" :name="kind" @change="notice=''">{{ label }}</label>
      </fieldset>
      <p class="muted-copy">审核通知始终开启。</p>
      <button class="primary" :disabled="saving || !Object.keys(changes).length">{{ saving ? '保存中…' : '保存通知偏好' }}</button>
      <p v-if="notice" role="status">{{ notice }}</p>
    </form>
  </section>
</template>
