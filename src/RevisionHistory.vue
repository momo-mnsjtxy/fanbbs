<script setup>
import {onUnmounted,ref} from 'vue'
import {api} from './api.js'
const props=defineProps({post:{type:Object,required:true},disabled:Boolean})
const emit=defineEmits(['restored','busy'])
const items=ref([]),cursor=ref(''),selected=ref(null),reason=ref(''),busy=ref(false),saving=ref(false),error=ref(''),notice=ref(''),opened=ref(false)
let generation=0
onUnmounted(()=>{generation++;emit('busy',false)})
async function load(append=false){
 if(busy.value||saving.value)return
 const current=++generation;busy.value=true;error.value=''
 try{const result=await api.postRevisions(props.post.id,append?cursor.value:'');if(current!==generation)return;const seen=new Set(append?items.value.map(x=>x.version):[]);items.value=[...(append?items.value:[]),...(result.data||[]).filter(x=>!seen.has(x.version))];cursor.value=result.page?.next_cursor||''}
 catch(e){if(current===generation)error.value=e.message}finally{if(current===generation)busy.value=false}
}
function toggle(){opened.value=!opened.value;if(opened.value&&!items.value.length)load()}
async function restore(){
 if(props.disabled||saving.value||busy.value||!selected.value||props.post.status==='pending')return
 const old=selected.value
 if(reason.value.trim().length<3){error.value='请填写至少 3 个字的恢复说明。';return}
 if(!confirm(`恢复到版本 ${old.version} 的正文、分类、标签及${old.visibility==='followers'?'仅关注者':'公开'}可见范围？将保存为新的版本，附件保持当前列表。`))return
 const current=generation;saving.value=true;emit('busy',true);error.value='';notice.value=''
 try{const result=await api.restoreRevision(props.post.id,props.post.version,old.version,reason.value.trim());if(current!==generation)return;emit('restored',result.data);selected.value=null;reason.value='';notice.value='历史内容已恢复为新的版本，原有历史仍保留。'}
 catch(e){if(current===generation)error.value=e.code==='version_conflict'?'当前稿件已变化，请先刷新稿件再选择恢复。':e.message}
 finally{if(current===generation){saving.value=false;emit('busy',false)}}
 if(current===generation&&!error.value)await load()
}
</script>
<template>
<section class="author-history"><button class="outline" :aria-expanded="opened" @click="toggle">{{opened?'收起':'查看'}}修订历史</button><template v-if="opened"><p>恢复会更新正文、分类、标签和可见范围，生成新版本；附件不回滚。审核中请先撤回稿件。</p><p v-if="error" class="form-error" role="alert">{{error}}</p><p v-if="notice" role="status">{{notice}}</p><button class="text-button" :disabled="busy||saving" @click="load()">刷新历史</button><div class="revision-options"><button v-for="item in items" :key="item.version" class="outline" :disabled="saving" @click="selected=item;reason=''">版本 {{item.version}} · {{new Date(item.created_at).toLocaleString('zh-CN')}}</button></div><p v-if="busy">读取历史…</p><p v-if="!items.length&&!busy">还没有之前的修订版本。</p><button v-if="cursor" class="outline" :disabled="busy||saving" @click="load(true)">加载更多版本</button><article v-if="selected" class="revision-preview"><h3>版本 {{selected.version}} · {{selected.title}}</h3><p>{{selected.summary}}</p><pre>{{selected.body}}</pre><p>可见范围：{{selected.visibility==='followers'?'仅关注者':'公开'}}；分类：{{selected.category_id||'未选择'}}；标签：{{selected.tag_ids?.join('、')||'未选择'}}</p><p>当前版本 {{post.version}}，选中历史版本 {{selected.version}}</p><form @submit.prevent="restore"><label>恢复说明<textarea v-model="reason" required minlength="3" maxlength="500" :disabled="disabled||saving||post.status==='pending'" /></label><button class="primary" :disabled="disabled||saving||busy||post.status==='pending'||reason.trim().length<3">{{saving?'恢复中…':'恢复为新版本'}}</button></form></article></template></section>
</template>
<style scoped>
.author-history{margin-top:24px;border-top:1px solid var(--line,#ddd);padding-top:20px}.revision-options{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.revision-preview{padding:16px;background:var(--surface,#f6f7f8);border-radius:12px}.revision-preview pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;line-height:1.7}.revision-preview textarea{display:block;width:100%;box-sizing:border-box;min-height:75px;margin:8px 0}
</style>
