import test from 'node:test'
import assert from 'node:assert/strict'
import { api, clearSession, normalizeApiError, normalizePost, normalizeUser, refreshSession, uploadFile, fetchMediaBlob } from '../src/api.js'
test('normalizes the backend error contract',()=>{const e=normalizeApiError({error:{code:'validation_failed',message:'请检查标记字段',field_errors:{content:['不能为空']},request_id:'req_1'}},422);assert.equal(e.code,'validation_failed');assert.equal(e.status,422);assert.deepEqual(e.fieldErrors,{content:['不能为空']});assert.equal(e.requestId,'req_1')})
test('uses a safe fallback for malformed errors',()=>{const e=normalizeApiError({},500);assert.equal(e.message,'请求失败，请稍后重试');assert.equal(e.status,500)})
test('adapts the Go post contract for the timeline',()=>{const p=normalizePost({summary:'摘要',like_count:3,comment_count:2,repost_count:1,author:{display_name:'林野',handle:'linye'}});assert.equal(p.content,'摘要');assert.equal(p.author.name,'林野');assert.equal(p.likes,3);assert.equal(p.comments,2);assert.equal(p.reposts,1)})
test('adapts identity display names',()=>{assert.equal(normalizeUser({display_name:'木棉',handle:'mumian'}).name,'木棉')})
test('clears every local session credential together',()=>{const removed=[];global.sessionStorage={removeItem:key=>removed.push(key)};clearSession();assert.deepEqual(removed,['fanbbs_access_token','fanbbs_refresh_token','fanbbs_user']);delete global.sessionStorage})
test('rotates refresh credentials and cached identity together',async()=>{const values=new Map([['fanbbs_refresh_token','old-refresh']]);global.sessionStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};global.fetch=async()=>({ok:true,json:async()=>({data:{access_token:'new-access',refresh_token:'new-refresh',user:{handle:'linye',display_name:'林野'}}})});await refreshSession();assert.equal(values.get('fanbbs_access_token'),'new-access');assert.equal(values.get('fanbbs_refresh_token'),'new-refresh');assert.equal(JSON.parse(values.get('fanbbs_user')).name,'林野');delete global.fetch;delete global.sessionStorage})
test('sends the complete create-post contract without discarding metadata',async()=>{const calls=[];global.sessionStorage={getItem:()=> 'access'};global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({data:{id:'p1',author:{display_name:'作者'},content:'正文'}})}};const input={title:'完整标题',summary:'摘要',content:'正文',kind:'image',category_id:'cat-1',tag_ids:['tag-1'],media_ids:['media-1'],visibility:'followers'};await api.createPost(input);assert.equal(calls[0].url,'/api/v1/posts');assert.equal(calls[0].options.method,'POST');assert.deepEqual(JSON.parse(calls[0].options.body),input);assert.ok(calls[0].options.headers['Idempotency-Key']);delete global.fetch;delete global.sessionStorage})
test('supports parent_id comments and the dedicated replies endpoint',async()=>{const calls=[];global.sessionStorage={getItem:()=> 'access'};global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({data:{id:'c1',author:{display_name:'作者'},content:'回复',depth:1}})}};await api.comment('post/1','父级回复','comment/1');await api.reply('post/1','comment/1','专用端点回复');assert.equal(calls[0].url,'/api/v1/posts/post%2F1/comments');assert.deepEqual(JSON.parse(calls[0].options.body),{content:'父级回复',parent_id:'comment/1'});assert.equal(calls[1].url,'/api/v1/posts/post%2F1/comments/comment%2F1/replies');assert.deepEqual(JSON.parse(calls[1].options.body),{content:'专用端点回复'});delete global.fetch;delete global.sessionStorage})
test('uses canonical account and repost mutation methods',async()=>{const calls=[];global.sessionStorage={getItem:()=> 'access'};global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({data:{changed:true}})}};await api.changePassword('old-password','new-password');await api.deactivateAccount();await api.repost('post-1',true);assert.deepEqual(calls.map(c=>[c.url,c.options.method]),[['/api/v1/me/password','PUT'],['/api/v1/me/account','DELETE'],['/api/v1/posts/post-1/reposts','DELETE']]);assert.deepEqual(JSON.parse(calls[0].options.body),{current_password:'old-password',new_password:'new-password'});delete global.fetch;delete global.sessionStorage})
test('uses backend-backed profile privacy, content and cover routes',async()=>{const calls=[];global.sessionStorage={getItem:()=> 'access'};global.fetch=async(url,options={})=>{calls.push({url,options});return {ok:true,json:async()=>({data:[]})}};await api.blocks('block-cursor');await api.categoryFollows('category-cursor');await api.profilePosts('user/1');await api.profileComments('user/1','comment-cursor');await uploadFile(new File(['cover'],'cover.png',{type:'image/png'}),{cover:true,altText:'主页封面'});assert.deepEqual(calls.slice(0,4).map(call=>call.url),['/api/v1/me/blocks?limit=30&cursor=block-cursor','/api/v1/me/category-follows?limit=30&cursor=category-cursor','/api/v1/users/user%2F1/posts?limit=20','/api/v1/users/user%2F1/comments?limit=20&cursor=comment-cursor']);assert.equal(calls[4].url,'/api/v1/me/cover');assert.equal(calls[4].options.method,'PUT');delete global.fetch;delete global.sessionStorage})
test('sends rich category presentation fields through audited admin routes',async()=>{const calls=[];global.sessionStorage={getItem:()=> 'access'};global.fetch=async(url,options={})=>{calls.push({url,options});return {ok:true,json:async()=>({data:{id:'cat-1'}})}};const input={slug:'tech',name:'技术',description:'分类简介',image_url:'/media/icon.webp',background_url:'https://static.example.test/cover.webp'};await api.createCategory(input);await api.updateCategory('category/1',input);assert.deepEqual(calls.map(call=>[call.url,call.options.method]),[['/api/v1/admin/categories','POST'],['/api/v1/admin/categories/category%2F1','PATCH']]);assert.deepEqual(JSON.parse(calls[0].options.body),input);assert.deepEqual(JSON.parse(calls[1].options.body),input);delete global.fetch;delete global.sessionStorage})
test('covers product detail, cart removal and owned order detail routes',async()=>{const calls=[];global.sessionStorage={getItem:()=> 'access'};global.fetch=async(url,options={})=>{calls.push({url,options});return {ok:true,json:async()=>({data:{}})}};await api.products('type/1');await api.product('product/1');await api.setCart('product/1',3);await api.removeCart('product/1');await api.order('order/1');assert.deepEqual(calls.map(call=>[call.url,call.options.method||'GET']),[['/api/v1/products?limit=50&type_id=type%2F1','GET'],['/api/v1/products/product%2F1','GET'],['/api/v1/me/cart/product%2F1','PUT'],['/api/v1/me/cart/product%2F1','DELETE'],['/api/v1/orders/order%2F1','GET']]);assert.deepEqual(JSON.parse(calls[2].options.body),{quantity:3});delete global.fetch;delete global.sessionStorage})
test('covers audited admin catalog and manual order transition routes',async()=>{const calls=[];global.sessionStorage={getItem:()=> 'access'};global.fetch=async(url,options={})=>{calls.push({url,options});return {ok:true,json:async()=>({data:{}})}};await api.adminProductTypes();await api.createProductType({slug:'goods',name:'周边'});await api.updateProductType('type/1',{slug:'goods',name:'社区周边'});await api.deleteProductType('type/1','不再使用 / 合并');await api.adminProducts();await api.createProduct({type_id:'type-1',sku:'sticker',name:'贴纸'});await api.updateProduct('product/1',{type_id:'type-1',sku:'sticker',name:'新版贴纸'});await api.deleteProduct('product/1','停止供应');await api.adminOrders('created');await api.adminOrder('order/1');await api.transitionOrder('order/1',{status:'fulfilled',fulfillment_carrier:'local',tracking_code:'LOCAL-1',reason:'人工交付'});assert.deepEqual(calls.map(call=>[call.url,call.options.method||'GET']),[['/api/v1/admin/product-types','GET'],['/api/v1/admin/product-types','POST'],['/api/v1/admin/product-types/type%2F1','PATCH'],['/api/v1/admin/product-types/type%2F1?reason=%E4%B8%8D%E5%86%8D%E4%BD%BF%E7%94%A8%20%2F%20%E5%90%88%E5%B9%B6','DELETE'],['/api/v1/admin/products?limit=100','GET'],['/api/v1/admin/products','POST'],['/api/v1/admin/products/product%2F1','PATCH'],['/api/v1/admin/products/product%2F1?reason=%E5%81%9C%E6%AD%A2%E4%BE%9B%E5%BA%94','DELETE'],['/api/v1/admin/orders?limit=100&status=created','GET'],['/api/v1/admin/orders/order%2F1','GET'],['/api/v1/admin/orders/order%2F1','PATCH']]);assert.deepEqual(JSON.parse(calls.at(-1).options.body),{status:'fulfilled',fulfillment_carrier:'local',tracking_code:'LOCAL-1',reason:'人工交付'});delete global.fetch;delete global.sessionStorage})
test('marks every notification read by preserving an explicit empty id list',async()=>{let call;global.sessionStorage={getItem:()=> 'access'};global.fetch=async(url,options={})=>{call={url,options};return {ok:true,json:async()=>({data:{read:true}})}};await api.readNotifications([]);assert.equal(call.url,'/api/v1/notifications/read');assert.equal(call.options.method,'PUT');assert.deepEqual(JSON.parse(call.options.body),{ids:[]});delete global.fetch;delete global.sessionStorage})
test('covers explicit collection privacy and membership routes',async()=>{const calls=[];global.sessionStorage={getItem:()=> 'access'};global.fetch=async(url,options={})=>{calls.push({url,options});return {ok:true,json:async()=>({data:{posts:[]}})}};await api.collections();await api.createCollection({name:'精选',description:'公开内容',visibility:'public'});await api.setCollectionPost('collection/1','post/1');await api.publicCollections('user/1');await api.collection('collection/1');assert.deepEqual(calls.map(c=>[c.url,c.options.method||'GET']),[['/api/v1/me/collections?limit=30','GET'],['/api/v1/me/collections','POST'],['/api/v1/me/collections/collection%2F1/posts/post%2F1','PUT'],['/api/v1/users/user%2F1/collections?limit=30','GET'],['/api/v1/collections/collection%2F1?limit=20','GET']]);delete global.fetch;delete global.sessionStorage})
test('covers shipping snapshots and manual tracking routes',async()=>{const calls=[];global.sessionStorage={getItem:()=> 'access'};global.fetch=async(url,options={})=>{calls.push({url,options});return {ok:true,json:async()=>({data:{}})}};const address={label:'家',recipient_name:'测试者',phone:'123',region:'北京',address_line:'测试路 1 号',postal_code:'',is_default:true};await api.createShippingAddress(address);await api.createOrder('address/1');await api.tracking('order/1');await api.addTrackingEvent('order/1',{status:'in_transit',description:'运输中',location:'北京',reason:'人工更新'});assert.deepEqual(calls.map(c=>[c.url,c.options.method||'GET']),[['/api/v1/me/shipping-addresses','POST'],['/api/v1/orders','POST'],['/api/v1/orders/order%2F1/tracking','GET'],['/api/v1/admin/orders/order%2F1/tracking-events','POST']]);assert.deepEqual(JSON.parse(calls[1].options.body),{address_id:'address/1'});delete global.fetch;delete global.sessionStorage})

test('preserves owner/filter-scoped notification cursors and authoritative count contracts',async t=>{
  const calls=[];global.sessionStorage={getItem:()=> 'access'}
  global.fetch=async(url,options={})=>{calls.push({url,options});return {ok:true,json:async()=>({data:{total:7,by_type:{message:2},conversations:1,messages:3}})}}
  t.after(()=>{delete global.fetch;delete global.sessionStorage})
  await api.notifications('seek /+',{type:'message',unread:true})
  assert.equal(calls[0].url,'/api/v1/notifications?limit=30&type=message&unread=true&cursor=seek+%2F%2B')
  assert.equal(calls[0].options.headers.Authorization,'Bearer access')
  const inbox=await api.notificationCounts(),chat=await api.conversationCounts()
  assert.equal(inbox.data.total,7);assert.equal(chat.data.messages,3)
  assert.deepEqual(calls.slice(1).map(call=>call.url),['/api/v1/notifications/counts','/api/v1/conversations/counts'])
  await api.notifications();assert.equal(calls.at(-1).url,'/api/v1/notifications?limit=30')
})
test('notification preference patches preserve explicit false and omit mandatory notices',async t=>{
  const calls=[];global.sessionStorage={getItem:()=> 'access'}
  global.fetch=async(url,options={})=>{calls.push({url,options});return {ok:true,json:async()=>({data:{preferences:{like:false,message:true,moderation:true}}})}}
  t.after(()=>{delete global.fetch;delete global.sessionStorage})
  await api.notificationPreferences();const result=await api.updateNotificationPreferences({like:false,message:true})
  assert.equal(calls[0].url,'/api/v1/me/notification-preferences');assert.equal(calls[1].options.method,'PATCH')
  assert.deepEqual(JSON.parse(calls[1].options.body),{preferences:{like:false,message:true}})
  assert.equal(result.data.preferences.like,false)
})
test('normalizes private author snapshots without redirecting unpublished content to public endpoints',async t=>{
  const calls=[],post={id:'post/one',status:'rejected',body:'私有正文',author:{display_name:'作者'}},moderation={state:'rejected',reason:'请补充说明'}
  global.sessionStorage={getItem:()=> 'access'}
  global.fetch=async(url,options={})=>{calls.push({url,options});return {ok:true,json:async()=>url.includes('?')?{data:[post],page:{next_cursor:'next'}}:{data:{post,moderation}}}}
  t.after(()=>{delete global.fetch;delete global.sessionStorage})
  const list=await api.ownPosts('rejected','seek /+'),detail=await api.ownPost('post/one')
  assert.deepEqual(calls.map(call=>call.url),['/api/v1/me/posts?limit=20&status=rejected&cursor=seek+%2F%2B','/api/v1/me/posts/post%2Fone'])
  assert.equal(list.data[0].content,'私有正文');assert.equal(list.page.next_cursor,'next')
  assert.equal(detail.data.post.author.name,'作者');assert.deepEqual(detail.data.moderation,moderation)
})

test('fetches private media only through the configured bearer-authenticated route and refuses unsupported bytes',async t=>{
  const calls=[];global.sessionStorage={getItem:()=> 'owner-access'}
  const image=new Blob(['synthetic image'],{type:'image/png'}),signal=new AbortController().signal
  global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,status:200,blob:async()=>image}}
  t.after(()=>{delete global.fetch;delete global.sessionStorage})
  assert.equal(await fetchMediaBlob('media/one',{signal}),image)
  assert.equal(calls[0].url,'/api/v1/media/media%2Fone');assert.equal(calls[0].options.headers.Authorization,'Bearer owner-access')
  assert.equal(calls[0].options.signal,signal);assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[0].options.redirect,'error')
  global.fetch=async()=>({ok:true,status:200,blob:async()=>new Blob(['<html>'],{type:'text/html'})})
  await assert.rejects(fetchMediaBlob('media-two'),e=>e.code==='unsupported_media')
  global.fetch=async()=>({ok:false,status:404,json:async()=>({error:{code:'media_not_found',message:'媒体不存在'}})})
  await assert.rejects(fetchMediaBlob('foreign'),e=>e.status===404&&e.code==='media_not_found')
})
test('propagates media cancellation without retrying or masking it as a network failure',async t=>{
  global.sessionStorage={getItem:()=> 'owner-access'};let calls=0
  global.fetch=async()=>{calls++;throw new DOMException('Aborted','AbortError')}
  t.after(()=>{delete global.fetch;delete global.sessionStorage})
  await assert.rejects(fetchMediaBlob('cancelled'),e=>e.name==='AbortError');assert.equal(calls,1)
})

test('terminal authentication failure clears credentials and signals the rendered application',async t=>{
  const values=new Map([['fanbbs_access_token','expired-access'],['fanbbs_refresh_token','expired-refresh'],['fanbbs_user','cached-user']]),events=[],calls=[]
  global.sessionStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}
  global.window={dispatchEvent:event=>events.push(event)}
  global.fetch=async(url,options)=>{calls.push({url,options});return {status:401,ok:false,json:async()=>({error:{code:'authentication_required',message:'登录已失效'}})}}
  t.after(()=>{delete global.fetch;delete global.sessionStorage;delete global.window})
  await assert.rejects(api.ownPost('private'),e=>e.status===401)
  assert.equal(values.size,0);assert.equal(events.length,1);assert.equal(events[0].type,'fanbbs:session-cleared');assert.equal(events[0].detail.reason,'expired')
  assert.equal(calls[1].url,'/api/v1/auth/refresh');assert.equal(calls.at(-1).options.headers.Authorization,undefined)
})

test('a late failed refresh cannot clear a replacement login or emit its expiry event',async t=>{
  const values=new Map([['fanbbs_access_token','old-access'],['fanbbs_refresh_token','old-refresh'],['fanbbs_user','old-user']]),events=[]
  global.sessionStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}
  global.window={dispatchEvent:event=>events.push(event)};let finish
  global.fetch=()=>new Promise(resolve=>{finish=resolve})
  t.after(()=>{delete global.fetch;delete global.sessionStorage;delete global.window})
  const pending=refreshSession();values.set('fanbbs_access_token','new-access');values.set('fanbbs_refresh_token','new-refresh');values.set('fanbbs_user','new-user')
  finish({status:401,ok:false,json:async()=>({error:{code:'authentication_required'}})})
  assert.equal(await pending,null);assert.equal(values.get('fanbbs_access_token'),'new-access');assert.equal(values.get('fanbbs_user'),'new-user');assert.equal(events.length,0)
})

test('a late successful refresh cannot overwrite a replacement access token even with a retained refresh value',async t=>{
  const values=new Map([['fanbbs_access_token','old-access'],['fanbbs_refresh_token','same-refresh'],['fanbbs_user','old-user']])
  global.sessionStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}
  let finish;global.fetch=()=>new Promise(resolve=>{finish=resolve})
  t.after(()=>{delete global.fetch;delete global.sessionStorage})
  const pending=refreshSession();values.set('fanbbs_access_token','replacement-access');values.set('fanbbs_user','replacement-user')
  finish({status:200,ok:true,json:async()=>({data:{access_token:'late-old-access',refresh_token:'late-old-refresh',user:{id:'old',handle:'old'}}})})
  assert.equal(await pending,null);assert.equal(values.get('fanbbs_access_token'),'replacement-access');assert.equal(values.get('fanbbs_user'),'replacement-user');assert.equal(values.get('fanbbs_refresh_token'),'same-refresh')
})
