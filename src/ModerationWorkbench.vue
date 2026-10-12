<script setup>
import {onUnmounted, ref} from 'vue'
import {api} from './api.js'
import ProtectedMedia from './ProtectedMedia.vue'
const filters=ref({status:'pending',type:'post',q:''}), items=ref([]),cursor=ref(''),queueBusy=ref(false),detailBusy=ref(false),saving=ref(false),error=ref(''),notice=ref('')
const selected=ref(null),snapshot=ref(null),commentSnapshot=ref(null),history=ref([]),historyCursor=ref(''),historyBusy=ref(false),reason=ref('')
let queueGeneration=0,detailGeneration=0
onUnmounted(()=>{queueGeneration++;detailGeneration++})
const labels={pending:'待审核',rejected:'已驳回',published:'已发布',draft:'草稿',deleted:'已删除'}
async function loadQueue(preserve=false){
 const current=++queueGeneration;queueBusy.value=true;error.value='';cursor.value=''
 if(!preserve){detailGeneration++;selected.value=null;snapshot.value=null;commentSnapshot.value=null;history.value=[];reason.value='';detailBusy.value=false}
 try{const result=await api.adminContent(filters.value);if(current===queueGeneration){items.value=result.data||[];cursor.value=result.page?.next_cursor||''}}
 catch(e){if(current===queueGeneration)error.value=e.message}
 finally{if(current===queueGeneration)queueBusy.value=false}
}
async function more(){
 if(queueBusy.value||!cursor.value)return
 const current=queueGeneration;queueBusy.value=true
 try{const result=await api.adminContent(filters.value,cursor.value);if(current!==queueGeneration)return;const seen=new Set(items.value.map(item=>`${item.type}:${item.id}`));items.value.push(...(result.data||[]).filter(item=>!seen.has(`${item.type}:${item.id}`)));cursor.value=result.page?.next_cursor||''}
 catch(e){if(current===queueGeneration)error.value=e.message}finally{if(current===queueGeneration)queueBusy.value=false}
}
async function open(item){
 if(saving.value)return
 const current=++detailGeneration;selected.value=item;snapshot.value=null;commentSnapshot.value=null;history.value=[];historyCursor.value='';historyBusy.value=false;reason.value='';notice.value='';error.value='';detailBusy.value=true
 if(item.type==='comment'){
  try{const [detail,timeline]=await Promise.all([api.adminComment(item.id),api.commentModerationHistory(item.id)]);if(current!==detailGeneration)return;commentSnapshot.value=detail.data;history.value=timeline.data||[];historyCursor.value=timeline.page?.next_cursor||''}
  catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)detailBusy.value=false}
  return
 }
 if(item.type!=='post'||item.status==='deleted'){detailBusy.value=false;return}
 try{const [post,timeline]=await Promise.all([api.adminSubmission(item.id),api.submissionHistory(item.id)]);if(current!==detailGeneration)return;snapshot.value=post.data;history.value=timeline.data||[];historyCursor.value=timeline.page?.next_cursor||''}
 catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)detailBusy.value=false}
}
async function moreHistory(){
 if(historyBusy.value||!historyCursor.value||!selected.value)return
 const current=detailGeneration;historyBusy.value=true
 try{const result=selected.value.type==='comment'?await api.commentModerationHistory(selected.value.id,historyCursor.value):await api.submissionHistory(selected.value.id,historyCursor.value);if(current===detailGeneration){history.value.push(...result.data||[]);historyCursor.value=result.page?.next_cursor||''}}
 catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)historyBusy.value=false}
}
async function removePost(){
 if(saving.value||!snapshot.value||reason.value.trim().length<3)return
 if(!confirm('移除这篇已发布帖子？公开列表和原帖将不可读取，处置理由会通知作者。'))return
 const current=detailGeneration,post=snapshot.value.post;saving.value=true;error.value=''
 try{const result=await api.removeReviewedPost(post.id,post.version,reason.value.trim());if(current!==detailGeneration)return;snapshot.value={...snapshot.value,post:{...post,status:'deleted',version:result.data.version}};selected.value={...selected.value,status:'deleted'};reason.value='';notice.value='帖子已移除，处置理由已通知作者。';const timeline=await api.submissionHistory(post.id);if(current!==detailGeneration)return;history.value=timeline.data||[];historyCursor.value=timeline.page?.next_cursor||'';await loadQueue(true)}
 catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)saving.value=false}
}
async function removeComment(){
 if(saving.value||!commentSnapshot.value||reason.value.trim().length<3)return
 if(!confirm('移除这条评论？已有子回复会保留，原楼层按删除占位显示。'))return
 const current=detailGeneration,item=commentSnapshot.value;saving.value=true;error.value=''
 try{await api.removeReviewedComment(item.id,item.version,reason.value.trim());const [detail,timeline]=await Promise.all([api.adminComment(item.id),api.commentModerationHistory(item.id)]);if(current!==detailGeneration)return;commentSnapshot.value=detail.data;history.value=timeline.data||[];historyCursor.value=timeline.page?.next_cursor||'';reason.value='';notice.value='评论已移除，处置理由已通知作者。';await loadQueue(true)}
 catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)saving.value=false}
}
async function decide(decision){
 if(saving.value||!snapshot.value||reason.value.trim().length<3)return
 const current=detailGeneration,id=selected.value.id,version=snapshot.value.post.version
 saving.value=true;error.value=''
 try{
  await api.moderatePost(id,decision,reason.value.trim(),version)
  const [post,timeline]=await Promise.all([api.adminSubmission(id),api.submissionHistory(id)])
  if(current!==detailGeneration)return
  snapshot.value=post.data;history.value=timeline.data||[];historyCursor.value=timeline.page?.next_cursor||'';reason.value='';notice.value=decision==='published'?'稿件已发布，决定已通知作者':'稿件已驳回，作者可以修订后重新提交'
  await loadQueue(true)
 }catch(e){if(current===detailGeneration)error.value=e.code==='version_conflict'?'稿件在你查看后已变更。请重新加载详情后再作决定。':e.message}
 finally{if(current===detailGeneration)saving.value=false}
}
async function control(field){
 if(saving.value||!snapshot.value||reason.value.trim().length<3)return
 const current=detailGeneration,post=snapshot.value.post;saving.value=true;error.value=''
 try{if(field==='comments_locked')await api.setCommentLock(post.id,post.version,!post.comments_locked,reason.value.trim());else await api.postControls(post.id,{[field]:!post[field],reason:reason.value.trim()});const [result,timeline]=await Promise.all([api.adminSubmission(post.id),api.submissionHistory(post.id)]);if(current===detailGeneration){snapshot.value=result.data;history.value=timeline.data||[];historyCursor.value=timeline.page?.next_cursor||'';notice.value=field==='comments_locked'?'评论开关已更新，作者已收到通知':'展示设置已更新';reason.value=''}}
 catch(e){if(current===detailGeneration)error.value=e.message}finally{if(current===detailGeneration)saving.value=false}
}
loadQueue()
</script>

<template>
 <section class="moderation-workbench" aria-label="内容审核工作台">
  <form class="admin-filters" @submit.prevent="loadQueue(false)"><label>状态<select v-model="filters.status" :disabled="saving"><option value="">全部状态</option><option v-for="(label,status) in labels" :key="status" :value="status">{{label}}</option></select></label><label>类型<select v-model="filters.type" :disabled="saving" @change="filters.type==='comment'&&(filters.status='published')"><option value="post">帖子</option><option value="comment">评论</option><option value="">全部</option></select></label><label>内容搜索<input v-model="filters.q" maxlength="100" :disabled="saving" placeholder="标题或正文"></label><button class="outline" :disabled="saving||queueBusy">筛选 / 刷新</button></form>
  <p v-if="error" class="form-error" role="alert">{{error}}</p><p v-if="notice" role="status">{{notice}}</p>
  <div class="review-workbench-grid">
   <div class="review-queue" :aria-busy="queueBusy"><p v-if="queueBusy" role="status">正在加载队列…</p><button v-for="item in items" :key="item.type+item.id" class="submission-row" :class="{selected:selected?.id===item.id}" :disabled="saving" @click="open(item)"><span class="status-label" :data-status="item.status">{{labels[item.status]||item.status}}</span><strong>{{item.title||'评论'}}</strong><p>{{item.body?.slice(0,130)}}</p><small>{{item.author_id}} · 举报 {{item.open_reports||0}}</small></button><p v-if="!items.length&&!queueBusy" class="empty-copy">没有匹配的内容。</p><button v-if="cursor" class="outline" :disabled="queueBusy||saving" @click="more">加载更多</button></div>
   <article class="review-reading-pane" :aria-busy="detailBusy">
    <p v-if="!selected" class="empty-copy">选择一份稿件，阅读完整正文和附件后作出决定。</p><p v-else-if="detailBusy" role="status">正在加载私密审核详情…</p>
    <template v-else-if="selected">
     <div class="section-heading"><h2>{{snapshot?.post.title||selected.title||'内容详情'}}</h2><button class="text-button" :disabled="saving" @click="open(selected)">重新加载详情</button></div>
     <template v-if="snapshot"><p>{{snapshot.post.author?.name}} · 版本 {{snapshot.post.version}} · {{labels[snapshot.post.status]}}</p><p v-if="snapshot.post.summary" class="muted-copy">{{snapshot.post.summary}}</p><div class="submission-body">{{snapshot.post.content}}</div><ProtectedMedia v-if="snapshot.post.status!=='deleted'&&snapshot.post.media?.length" :key="snapshot.post.id" :media="snapshot.post.media" :review-post-id="snapshot.post.id" /><section v-if="snapshot.moderation?.reason" class="review-snapshot"><b>{{snapshot.post.status==='pending'?'提交说明':'最近审核说明'}}</b><p>{{snapshot.moderation.reason}}</p></section>
      <section v-if="['pending','published'].includes(snapshot.post.status)" class="submission-actions"><label for="review-decision-reason">审核 / 操作理由<textarea id="review-decision-reason" v-model="reason" minlength="3" maxlength="500" :disabled="saving" placeholder="至少 3 个字，审核结果会通知作者"></textarea></label><template v-if="snapshot.post.status==='pending'"><button class="outline" :disabled="saving||reason.trim().length<3" @click="decide('rejected')">驳回修改</button><button class="primary" :disabled="saving||reason.trim().length<3" @click="decide('published')">审核通过并发布</button></template><template v-else><button class="outline" :disabled="saving||reason.trim().length<3" @click="control('pinned')">{{snapshot.post.pinned?'取消置顶':'置顶'}}</button><button class="outline" :disabled="saving||reason.trim().length<3" @click="control('recommended')">{{snapshot.post.recommended?'取消推荐':'推荐'}}</button><button class="outline" :disabled="saving||reason.trim().length<3" @click="control('comments_locked')">{{snapshot.post.comments_locked?'重新开放评论':'关闭新评论与回复'}}</button><button class="danger-button" :disabled="saving||reason.trim().length<3" @click="removePost">移除已发布帖子</button></template></section>
      <section class="review-timeline" aria-label="提交与审核记录"><h3>提交与审核记录</h3><p v-if="!history.length" class="muted-copy">暂无审核记录。</p><article v-for="event in history" :key="event.id"><strong>{{event.action==='submission_submit'?'作者提交':event.action==='submission_withdraw'?'作者撤回':event.action==='post_comments_lock'?(event.after?.comments_locked?'关闭评论':'重新开放评论'):event.action==='post_feed_controls_update'?'更新展示设置':event.action==='post_moderation_remove'?'移除已发布帖子':event.after?.state==='published'?'审核通过':'审核驳回'}}</strong><small>{{event.created_at}} · {{event.actor_id}}</small><p>{{event.reason}}</p></article><button v-if="historyCursor" class="text-button" :disabled="historyBusy" @click="moreHistory">加载较早记录</button></section>
     </template>
     <template v-else-if="commentSnapshot"><p>评论 · {{labels[commentSnapshot.status]}} · 版本 {{commentSnapshot.version}} · 作者 {{commentSnapshot.author_id}}</p><div class="submission-body">{{commentSnapshot.body}}</div><section v-if="commentSnapshot.parent" class="review-snapshot"><h3>上一级评论 · {{labels[commentSnapshot.parent.status]}}</h3><p class="submission-body">{{commentSnapshot.parent.body}}</p></section><section v-if="commentSnapshot.post" class="review-snapshot"><h3>所在帖子：{{commentSnapshot.post.title||'动态'}}</h3><p class="submission-body">{{commentSnapshot.post.body||commentSnapshot.post.content}}</p><ProtectedMedia v-if="commentSnapshot.post.media?.length" :media="commentSnapshot.post.media" :review-post-id="commentSnapshot.post.id" /></section><form v-if="commentSnapshot.status==='published'" class="submission-actions" @submit.prevent="removeComment"><label>处置理由<textarea v-model="reason" minlength="3" maxlength="500" required :disabled="saving" /></label><button class="primary" :disabled="saving||reason.trim().length<3">{{saving?'处理中…':'移除评论'}}</button></form><section class="review-timeline"><h3>评论处置记录</h3><article v-for="event in history" :key="event.id"><strong>{{event.action==='comment_moderation_remove'?'直接移除评论':'举报处置'}}</strong><small>{{event.created_at}} · {{event.actor_id}}</small><p>{{event.reason}}</p></article><p v-if="!history.length">暂无处置记录。</p><button v-if="historyCursor" class="text-button" :disabled="historyBusy" @click="moreHistory">加载较早记录</button></section></template>
     <template v-else><div class="submission-body">{{selected.body}}</div><p class="muted-copy">{{selected.type==='comment'?'评论上下文暂时无法读取，请重试。':selected.status==='deleted'?'已删除稿件不可再审核。':'暂时无法加载完整稿件，请重试详情。'}}</p></template>
    </template>
   </article>
  </div>
 </section>
</template>
