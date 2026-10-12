<script setup>
import {onUnmounted,ref} from 'vue'
import {api,clearSession} from './api.js'
const items=ref([]),names=ref({}),loading=ref(false),pending=ref(''),error=ref(''),notice=ref('')
let generation=0
onUnmounted(()=>{generation++})
function date(value){const parsed=new Date(value);return Number.isNaN(parsed.getTime())?'未知':parsed.toLocaleString('zh-CN')}
async function load(){
 if(pending.value)return
 const current=++generation;loading.value=true;error.value=''
 try{const result=await api.sessions();if(current!==generation)return;items.value=result.data||[];names.value=Object.fromEntries(items.value.map(item=>[item.id,item.name||'']))}
 catch(e){if(current===generation)error.value=e.message}finally{if(current===generation)loading.value=false}
}
async function rename(item){
 if(pending.value||loading.value)return
 const current=generation;pending.value=item.id;error.value='';notice.value=''
 try{const result=await api.renameSession(item.id,names.value[item.id]||'');if(current!==generation)return;item.name=result.data.name;names.value[item.id]=result.data.name;notice.value='设备名称已保存。'}
 catch(e){if(current===generation)error.value=e.message}finally{if(current===generation)pending.value=''}
}
async function revoke(item){
 if(pending.value||loading.value)return
 if(!confirm(item.current?'撤销当前设备会立即退出登录。继续吗？':`撤销“${item.name||'其他设备'}”的会话，要求该设备重新登录？`))return
 const current=generation;pending.value=item.id;error.value='';notice.value=''
 try{await api.revokeSession(item.id);if(current!==generation)return;if(item.current){clearSession('revoked');return}items.value=items.value.filter(x=>x.id!==item.id);delete names.value[item.id];notice.value='设备会话已撤销。'}
 catch(e){if(current===generation)error.value=e.message}finally{if(current===generation)pending.value=''}
}
load()
</script>
<template>
<section class="device-manager"><div class="section-heading"><h2>设备会话</h2><button class="outline" :disabled="loading||!!pending" @click="load">刷新设备</button></div><p>给设备起一个便于识别的名字。最后活动时间为近似记录，不包含 IP 地址或设备指纹。</p><p v-if="error" class="form-error" role="alert">{{error}}</p><p v-if="notice" role="status">{{notice}}</p><p v-if="loading" role="status">正在读取设备会话…</p><article v-for="item in items" :key="item.id" class="device-record"><div><h3>{{item.name||(item.current?'当前设备':'其他设备')}} <small v-if="item.current">当前登录</small></h3><p>最后活动：<time :datetime="item.last_active_at">{{date(item.last_active_at)}}</time><br>创建：{{date(item.created_at)}}<br>会话有效至：{{date(item.refresh_expires_at)}}</p></div><form @submit.prevent="rename(item)"><label :for="`device-name-${item.id}`">设备名称<input :id="`device-name-${item.id}`" v-model="names[item.id]" maxlength="80" :disabled="loading||!!pending" placeholder="例如：家里的电脑（留空可清除）"></label><div class="device-actions"><button class="outline" :disabled="loading||!!pending||(names[item.id]||'')===(item.name||'')">保存名称</button><button type="button" class="danger-button" :disabled="loading||!!pending" @click="revoke(item)">撤销会话</button></div></form></article><p v-if="!loading&&!items.length&&!error">没有可用的设备会话。</p></section>
</template>
<style scoped>
.device-manager{margin-top:28px}.device-record{padding:18px 0;border-bottom:1px solid var(--line,#ddd)}.device-record h3{margin:0}.device-record small{font-size:12px;color:var(--accent,#8756a5)}.device-record p{line-height:1.8;color:var(--muted,#777)}.device-record input{display:block;width:100%;box-sizing:border-box;padding:10px;margin:8px 0;border:1px solid var(--line,#ddd);border-radius:9px}.device-actions{display:flex;gap:10px;flex-wrap:wrap}
</style>
