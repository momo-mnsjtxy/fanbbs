<script setup>
import {onUnmounted,ref} from 'vue'
import {api} from './api.js'
const props=defineProps({viewerId:String})
const filters=ref({q:'',role:'',status:''}),items=ref([]),cursor=ref(''),selected=ref(null),snapshot=ref(null),history=ref([]),historyCursor=ref(''),reason=ref(''),busy=ref(false),detailBusy=ref(false),historyBusy=ref(false),saving=ref(false),error=ref(''),notice=ref('')
let listGeneration=0,detailGeneration=0
onUnmounted(()=>{listGeneration++;detailGeneration++})
async function load(append=false,preserve=false){
 if(busy.value)return
 const current=++listGeneration;busy.value=true;error.value=''
 if(!append&&!preserve){detailGeneration++;selected.value=null;snapshot.value=null;history.value=[];detailBusy.value=false;historyBusy.value=false}
 try{const result=await api.adminUsers({...filters.value,cursor:append?cursor.value:''});if(current!==listGeneration)return;const seen=new Set(append?items.value.map(x=>x.id):[]);items.value=[...(append?items.value:[]),...(result.data||[]).filter(x=>!seen.has(x.id))];cursor.value=result.page?.next_cursor||''}
 catch(e){if(current===listGeneration)error.value=e.message}finally{if(current===listGeneration)busy.value=false}
}
async function open(item){
 if(saving.value)return
 const current=++detailGeneration;selected.value=item;snapshot.value=null;history.value=[];historyCursor.value='';reason.value='';error.value='';notice.value='';detailBusy.value=true;historyBusy.value=false
 try{const [detail,timeline]=await Promise.all([api.adminUser(item.id),api.userModerationHistory(item.id)]);if(current!==detailGeneration)return;snapshot.value=detail.data;history.value=timeline.data||[];historyCursor.value=timeline.page?.next_cursor||''}
 catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)detailBusy.value=false}
}
async function moreHistory(){
 if(historyBusy.value||saving.value||!historyCursor.value||!selected.value)return
 const current=detailGeneration;historyBusy.value=true
 try{const result=await api.userModerationHistory(selected.value.id,historyCursor.value);if(current!==detailGeneration)return;const seen=new Set(history.value.map(x=>x.id));history.value.push(...(result.data||[]).filter(x=>!seen.has(x.id)));historyCursor.value=result.page?.next_cursor||''}
 catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)historyBusy.value=false}
}
async function act(action){
 if(saving.value||!snapshot.value||reason.value.trim().length<3||snapshot.value.user.id===props.viewerId)return
 const user=snapshot.value.user,status=user.status==='active'?'suspended':'active',label=action==='revoke'?'撤销该用户现有设备会话，要求重新登录':status==='suspended'?'停用该用户并撤销全部会话':'恢复该用户登录权限'
 if(!confirm(`${label}？理由：${reason.value.trim()}`))return
 const current=detailGeneration;saving.value=true;error.value='';notice.value=''
 try{if(action==='revoke')await api.revokeUserSessions(user.id,reason.value.trim());else await api.setUserStatus(user.id,status,reason.value.trim(),user.status);const [detail,timeline]=await Promise.all([api.adminUser(user.id),api.userModerationHistory(user.id)]);if(current!==detailGeneration)return;snapshot.value=detail.data;history.value=timeline.data||[];historyCursor.value=timeline.page?.next_cursor||'';reason.value='';notice.value='操作已保存，处置记录已更新。';await load(false,true)}
 catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)saving.value=false}
}
load()
</script>
<template>
<section class="admin-account-workspace"><h2>账户管理</h2><form class="admin-filters" @submit.prevent="load()"><input v-model="filters.q" :disabled="saving||busy" maxlength="100" aria-label="搜索用户" placeholder="用户名、邮箱或昵称"><select v-model="filters.status" :disabled="saving||busy" aria-label="账号状态"><option value="">全部状态</option><option value="active">正常</option><option value="suspended">已停用</option></select><select v-model="filters.role" :disabled="saving||busy" aria-label="角色"><option value="">全部角色</option><option value="member">成员</option><option value="moderator">审核员</option><option value="admin">管理员</option></select><button class="outline" :disabled="saving||busy">筛选 / 刷新</button></form><p v-if="error" class="form-error" role="alert">{{error}}</p><p v-if="notice" role="status">{{notice}}</p><div class="account-workspace-grid"><div><button v-for="item in items" :key="item.id" class="account-record" :disabled="saving" @click="open(item)"><b>{{item.display_name}} @{{item.handle}}</b><span>{{item.role}} · {{item.status==='active'?'正常':'已停用'}}</span></button><p v-if="busy">加载中…</p><p v-if="!busy&&!items.length">没有匹配的用户。</p><button v-if="cursor" class="outline" :disabled="busy||saving" @click="load(true)">加载更多用户</button></div><article v-if="selected" class="account-detail"><div class="section-heading"><h3>账户详情</h3><button class="text-button" :disabled="saving" @click="open(selected)">刷新详情</button></div><p v-if="detailBusy">读取详情…</p><template v-if="snapshot"><h3>{{snapshot.user.display_name}} @{{snapshot.user.handle}}</h3><p>{{snapshot.user.email}}</p><p>{{snapshot.user.role}} · {{snapshot.user.status==='active'?'正常':'已停用'}}</p><p>创建：{{snapshot.user.created_at}}<br>更新：{{snapshot.user.updated_at||'无'}}</p><p>有效会话 {{snapshot.active_sessions}} · 未删除稿件 {{snapshot.post_count}} · 待处理账号举报 {{snapshot.open_user_reports}}</p><p>此页面不展示登录令牌、恢复码或其他认证凭据。</p><form v-if="snapshot.user.id!==viewerId" @submit.prevent="act('status')"><label>操作理由<textarea v-model="reason" minlength="3" maxlength="500" required :disabled="saving" /></label><div class="account-actions"><button class="primary" :disabled="saving||reason.trim().length<3">{{snapshot.user.status==='active'?'停用账号':'恢复账号'}}</button><button type="button" class="outline" :disabled="saving||reason.trim().length<3||!snapshot.active_sessions" @click="act('revoke')">仅撤销设备会话</button></div></form><p v-else>自己的设备会话请到个人账号安全页面管理。</p><h3>处置历史</h3><article v-for="event in history" :key="event.id" class="account-history"><b>{{event.action==='user_status_update'?'账号状态变更':event.action==='user_sessions_revoke'?'撤销设备会话':'举报处理'}}</b><p>{{event.reason}}</p><small>{{event.created_at}} · {{event.actor_id}}</small><p v-if="event.after?.status">结果：{{event.after.status}}</p><p v-if="event.after?.revoked_sessions">撤销 {{event.after.revoked_sessions}} 个会话</p></article><p v-if="!history.length">暂无处置记录。</p><button v-if="historyCursor" class="outline" :disabled="historyBusy||saving" @click="moreHistory">加载较早记录</button></template></article></div></section>
</template>
<style scoped>
.account-workspace-grid{display:grid;grid-template-columns:minmax(210px,1fr) minmax(0,1.5fr);gap:20px;margin-top:20px}.account-record{display:flex;width:100%;flex-direction:column;gap:8px;align-items:flex-start;padding:14px;margin-bottom:10px;border:1px solid var(--line,#ddd);border-radius:10px;background:transparent;text-align:left}.account-record span{color:var(--muted,#777)}.account-detail{min-width:0;padding:16px;border:1px solid var(--line,#ddd);border-radius:12px;overflow-wrap:anywhere}.account-detail textarea{display:block;width:100%;min-height:85px;box-sizing:border-box;margin:10px 0}.account-actions{display:flex;flex-wrap:wrap;gap:8px}.account-history{border-top:1px solid var(--line,#ddd);padding:12px 0}.account-history p{white-space:pre-wrap}@media(max-width:800px){.account-workspace-grid{grid-template-columns:1fr}}
</style>
