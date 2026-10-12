<script setup>
import {onUnmounted,ref} from 'vue'
import {api} from './api.js'
import ProtectedMedia from './ProtectedMedia.vue'
const props=defineProps({admin:Boolean,role:String,reportId:{type:String,default:''}})
const focused=ref(null)
const status=ref(props.admin?'open':''),items=ref([]),cursor=ref(''),busy=ref(false),saving=ref(false),error=ref(''),notice=ref(''),selected=ref(null),context=ref(null),detailBusy=ref(false),reason=ref('')
const labels={open:'等待处理',actioned:'已采取措施',dismissed:'未采取措施',published:'已发布',deleted:'已删除',active:'正常',suspended:'已停用',unavailable:'对象不可用'}
const decisions={dismiss:'未发现违规',remove_content:'已移除内容',suspend_user:'已停用用户'}
let generation=0,detailGeneration=0
onUnmounted(()=>{generation++;detailGeneration++})
async function load(append=false){
 if(saving.value||busy.value)return
 const current=++generation;busy.value=true;error.value=''
 if(!append){items.value=[];cursor.value='';selected.value=null;context.value=null;detailGeneration++;detailBusy.value=false}
 try{const result=props.admin?await api.adminReview(status.value,append?cursor.value:''):await api.myReports(status.value,append?cursor.value:'');if(current!==generation)return;const seen=new Set(items.value.map(x=>x.id));items.value.push(...(result.data||[]).filter(x=>!seen.has(x.id)));cursor.value=result.page?.next_cursor||'';if(!props.admin&&props.reportId&&!append){const focus=await api.myReport(props.reportId);if(current===generation)focused.value=focus.data}}
 catch(e){if(current===generation)error.value=e.message}finally{if(current===generation)busy.value=false}
}
async function open(item){
 if(saving.value)return
 const current=++detailGeneration;selected.value=item;context.value=null;reason.value='';error.value='';detailBusy.value=true
 try{const result=await api.reportContext(item.id);if(current!==detailGeneration)return;context.value=result.data.target;selected.value=result.data.report}
 catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)detailBusy.value=false}
}
async function decide(decision){
 if(saving.value||!selected.value||!context.value)return
 if(reason.value.trim().length<3){error.value='请填写至少 3 个字的处理理由。';return}
 const current=detailGeneration;saving.value=true;error.value='';notice.value=''
 try{const result=await api.moderate(selected.value.id,decision,reason.value.trim(),decision==='remove_content'?context.value.version:undefined);if(current!==detailGeneration)return;selected.value=result.data;const index=items.value.findIndex(x=>x.id===result.data.id);if(index>=0){if(status.value&&status.value!==result.data.status)items.value.splice(index,1);else items.value[index]=result.data}notice.value='处理结果已保存，并通知举报人。'}
 catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)saving.value=false}
}
load()
</script>

<template>
<section class="report-center">
 <div class="section-heading"><h2>{{admin?'举报处理':'我的举报'}}</h2><button class="outline" :disabled="busy||saving" @click="load()">刷新</button></div>
 <p>{{admin?'先查看被举报内容，再填写理由作出处理。内容更新后需要重新读取。':'查看你提交的举报及处理结果。内容被移除或权限变更后，这里只保留举报记录。'}}</p>
 <label>处理状态 <select v-model="status" :disabled="busy||saving" @change="load()"><option v-if="!admin" value="">全部</option><option value="open">等待处理</option><option value="actioned">已采取措施</option><option value="dismissed">未采取措施</option></select></label>
 <p v-if="error" class="form-error" role="alert">{{error}}</p><p v-if="notice" role="status">{{notice}}</p>
 <article v-if="focused" class="report-record report-focused" aria-label="通知对应的举报"><h3>这条举报的处理结果</h3><b>{{labels[focused.status]}} · {{focused.target_type}}</b><p class="report-text">{{focused.reason}}</p><p v-if="focused.decision">{{decisions[focused.decision]||focused.decision}} · {{focused.decided_at}}</p><p class="report-text">{{focused.decision_reason}}</p><small>{{focused.id}}</small></article>
 <div class="report-layout" :class="{'report-layout-admin':admin}">
 <div><article v-for="item in items" :key="item.id" class="report-record"><b>{{labels[item.status]}} · {{item.target_type}}</b><p class="report-text">{{item.reason}}</p><small>{{item.created_at}} · {{item.target_id}}</small><template v-if="item.decision"><p>{{decisions[item.decision]||item.decision}} · {{item.decided_at}}</p><p class="report-text">{{item.decision_reason}}</p></template><button v-if="admin" class="outline" :disabled="saving" @click="open(item)">查看上下文</button></article><p v-if="!items.length&&!busy">没有匹配的举报。</p><p v-if="busy" role="status">加载中…</p><button v-if="cursor" class="outline" :disabled="busy||saving" @click="load(true)">加载更多</button></div>
 <section v-if="admin&&selected" class="report-detail" aria-label="举报详情"><h3>举报理由</h3><p class="report-text">{{selected.reason}}</p><p v-if="detailBusy">读取上下文…</p><template v-if="context"><h3>{{selected.target_type==='comment'?'被举报的评论':selected.target_type==='user'?'被举报的用户':'被举报的帖子'}}</h3><p>{{labels[context.status]||context.status}}<template v-if="context.version"> · 版本 {{context.version}}</template></p><p v-if="context.display_name">{{context.display_name}} @{{context.handle}}</p><p class="report-text">{{context.body||'没有正文'}}</p><section v-if="context.parent" class="report-post"><h4>上一级评论 · {{labels[context.parent.status]||context.parent.status}}</h4><p class="report-text">{{context.parent.body}}</p></section><section v-if="context.post" class="report-post"><h4>{{selected.target_type==='comment'?'评论所在帖子':'帖子附件与信息'}} · {{context.post.title||'动态'}}</h4><p>{{context.post.summary}}</p><p v-if="selected.target_type==='comment'" class="report-text">{{context.post.body||context.post.content}}</p><ProtectedMedia :media="context.post.media||[]" :review-post-id="context.post.id" /></section><form v-if="selected.status==='open'" @submit.prevent="decide('dismiss')"><label>处理理由<textarea v-model="reason" minlength="3" maxlength="500" required :disabled="saving" /></label><div class="report-actions"><button class="outline" :disabled="saving">驳回举报</button><button v-if="['post','comment'].includes(selected.target_type)&&context.status==='published'" type="button" class="primary" :disabled="saving" @click="decide('remove_content')">移除内容</button><button v-if="selected.target_type==='user'&&role==='admin'&&context.status==='active'" type="button" class="primary" :disabled="saving" @click="decide('suspend_user')">停用用户</button></div></form><p v-else>{{decisions[selected.decision]}}：{{selected.decision_reason}}</p><button class="text-button" :disabled="saving" @click="open(selected)">重新读取上下文</button></template></section>
 </div>
</section>
</template>
<style scoped>
.report-center{margin-top:24px}.report-center select{padding:8px;border:1px solid var(--line,#ddd);border-radius:8px}.report-layout{margin-top:16px;display:grid;gap:20px}.report-layout-admin{grid-template-columns:minmax(220px,1fr) minmax(0,1.5fr)}.report-record,.report-detail{padding:16px;border:1px solid var(--line,#e3e5e8);border-radius:12px;margin-bottom:12px;min-width:0}.report-record small{display:block;color:var(--muted,#777);overflow-wrap:anywhere;margin-bottom:12px}.report-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7}.report-detail textarea{display:block;width:100%;min-height:90px;box-sizing:border-box;margin:10px 0}.report-actions{display:flex;gap:8px;flex-wrap:wrap}.report-post{border-top:1px solid var(--line,#ddd);padding-top:12px;margin-top:20px}@media(max-width:800px){.report-layout-admin{grid-template-columns:1fr}}
</style>
