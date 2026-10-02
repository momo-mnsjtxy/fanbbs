import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const samplePost = () => ({ id:'p-test', author:{id:'u-2',name:'林野',handle:'linye'}, age:'刚刚', content:'组件交互测试动态', comments:1,reposts:2,likes:3,views:4,liked:false,bookmarked:false })
const api = vi.hoisted(() => ({
  feed:vi.fn(), profile:vi.fn(), categories:vi.fn(), search:vi.fn(), bookmarks:vi.fn(), notifications:vi.fn(), adminReview:vi.fn(),
  like:vi.fn(), repost:vi.fn(), bookmark:vi.fn(), follow:vi.fn(), detail:vi.fn(), comments:vi.fn(), updateProfile:vi.fn(),
  login:vi.fn(), register:vi.fn(), logout:vi.fn(), createPost:vi.fn(), comment:vi.fn(), reply:vi.fn(), readNotifications:vi.fn(), moderate:vi.fn(), report:vi.fn(),
  conversations:vi.fn(), createConversation:vi.fn(), messages:vi.fn(), sendMessage:vi.fn(), events:vi.fn(), tags:vi.fn(), adminUsers:vi.fn(), adminContent:vi.fn(), setUserStatus:vi.fn(), createCategory:vi.fn(), deleteCategory:vi.fn(), createTag:vi.fn(), deleteTag:vi.fn(),
  profileById:vi.fn(),followers:vi.fn(),following:vi.fn(),block:vi.fn(),followCategory:vi.fn(),sessions:vi.fn(),revokeSession:vi.fn(),markConversationRead:vi.fn(),leaveConversation:vi.fn(),homepage:vi.fn(),adminHomepage:vi.fn(),updateHomepage:vi.fn()
  ,products:vi.fn(),productTypes:vi.fn(),cart:vi.fn(),setCart:vi.fn(),createOrder:vi.fn(),orders:vi.fn(),cancelOrder:vi.fn(),gamification:vi.fn(),pointEvents:vi.fn(),tasks:vi.fn(),ranks:vi.fn(),frames:vi.fn(),checkIn:vi.fn(),selectFrame:vi.fn()
  ,recover:vi.fn(),rotateRecoveryCodes:vi.fn(),changePassword:vi.fn(),deactivateAccount:vi.fn()
  ,abandonMedia:vi.fn()
}))
vi.mock('../src/api.js', async importOriginal => ({ ...(await importOriginal()), api }))
import App from '../src/App.vue'

async function render({ authenticated=false }={}) {
  if(authenticated) sessionStorage.setItem('fanbbs_user',JSON.stringify({id:'u-1',handle:'tester',name:'测试者',role:'member'}))
  const wrapper=mount(App,{attachTo:document.body});await flushPromises();return wrapper
}

beforeEach(()=>{
  vi.clearAllMocks();sessionStorage.clear();localStorage.clear();history.replaceState({},'','#home')
  vi.stubGlobal('confirm',vi.fn(()=>true));vi.stubGlobal('prompt',vi.fn(()=> '足够长的审核测试理由'))
  api.feed.mockResolvedValue({data:[samplePost()]});api.profile.mockResolvedValue({data:{id:'u-1',handle:'tester',display_name:'测试者',role:'member'}})
  api.categories.mockResolvedValue({data:[{id:'cat-1',name:'技术'}]});api.search.mockResolvedValue({data:{posts:[samplePost()],users:[{id:'u-2',handle:'linye',display_name:'林野',following:false}],tags:[{id:'tag-1',name:'城市'}]}})
  api.bookmarks.mockResolvedValue({data:[{...samplePost(),bookmarked:true}]});api.notifications.mockResolvedValue({data:[]});api.comments.mockResolvedValue({data:[]});api.detail.mockResolvedValue({data:samplePost()})
  api.bookmark.mockResolvedValue({data:{changed:true}});api.follow.mockResolvedValue({data:{changed:true}});api.logout.mockResolvedValue({data:{}})
  api.conversations.mockResolvedValue({data:[{id:'cnv-1',title:'林野',updated_at:'刚刚',last_message:{content:'你好'}}]});api.messages.mockResolvedValue({data:[{id:'msg-1',sender_id:'u-2',content:'你好',created_at:'刚刚'}]});api.sendMessage.mockResolvedValue({data:{id:'msg-2',sender_id:'u-1',content:'收到',created_at:'刚刚'}})
  api.events.mockResolvedValue({data:[],page:{next_cursor:''}})
  api.tags.mockResolvedValue({data:[{id:'tag-1',name:'城市',slug:'city'}]});api.adminUsers.mockResolvedValue({data:[{id:'u-2',display_name:'林野',handle:'linye',role:'member',status:'active'}]});api.adminContent.mockResolvedValue({data:[]});api.setUserStatus.mockResolvedValue({data:{status:'suspended'}})
  api.sessions.mockResolvedValue({data:[{id:'sess-1',current:true,created_at:'今天'}]});api.profileById.mockResolvedValue({data:{id:'u-2',name:'林野',handle:'linye',bio:'简介',follower_count:1,following_count:2,post_count:3,following:false,blocked_by_me:false}});api.followers.mockResolvedValue({data:[]});api.following.mockResolvedValue({data:[]});api.block.mockResolvedValue({data:{changed:true}});api.followCategory.mockResolvedValue({data:{changed:true}});api.revokeSession.mockResolvedValue({data:{revoked:true}})
  api.markConversationRead.mockResolvedValue({data:{read:true}});api.leaveConversation.mockResolvedValue({data:{left:true}});api.homepage.mockResolvedValue({data:{payload:{carousel:[],announcements:[]}}});api.adminHomepage.mockResolvedValue({data:{version:1,status:'published',payload:{carousel:[],announcements:[]}}})
  api.productTypes.mockResolvedValue({data:[]});api.products.mockResolvedValue({data:[{id:'prod-1',name:'社区贴纸',description:'本地履约',inventory:3}]});api.cart.mockResolvedValue({data:[]});api.setCart.mockResolvedValue({data:{product:{id:'prod-1',name:'社区贴纸'},quantity:1}});api.createOrder.mockResolvedValue({data:{id:'ord-1',status:'created',items:[{name:'社区贴纸',quantity:1}]}});api.orders.mockResolvedValue({data:[]});api.gamification.mockResolvedValue({data:{level_name:'新芽',title:'成员',points_balance:10,rank:2}});api.pointEvents.mockResolvedValue({data:[]});api.tasks.mockResolvedValue({data:[]});api.ranks.mockResolvedValue({data:[]});api.frames.mockResolvedValue({data:[]});api.checkIn.mockResolvedValue({data:{}})
  api.register.mockResolvedValue({data:{access_token:'a',refresh_token:'r',user:{id:'u-new',handle:'new',display_name:'新用户'},recovery_codes:['AAAAA-BBBBB-CCCCC-DDDDD']}});api.recover.mockResolvedValue({data:{changed:true,recovery_codes:['EEEEE-FFFFF-GGGGG-HHHHH']}});api.rotateRecoveryCodes.mockResolvedValue({data:{recovery_codes:['IIIII-JJJJJ-KKKKK-LLLLL']}})
  api.createPost.mockResolvedValue({data:samplePost()});api.comment.mockResolvedValue({data:{id:'c-new',depth:0,author:{id:'u-1',name:'测试者',handle:'tester'},content:'回复',age:'刚刚'}});api.reply.mockResolvedValue({data:{id:'c-reply',parent_id:'c-root',depth:1,author:{id:'u-1',name:'测试者',handle:'tester'},content:'嵌套回复',age:'刚刚'}});api.repost.mockResolvedValue({data:{changed:true}});api.report.mockResolvedValue({data:{id:'report-1'}})
  api.changePassword.mockResolvedValue({data:{changed:true}});api.deactivateAccount.mockResolvedValue({data:{deactivated:true}})
  api.abandonMedia.mockResolvedValue({})
})

describe('FanBBS core interactions',()=>{
  it('separates server errors from the network-only demo fallback',async()=>{
    api.feed.mockRejectedValueOnce(Object.assign(new Error('服务校验失败'),{code:'validation_failed'}));const wrapper=await render()
    expect(wrapper.text()).toContain('动态加载失败');expect(wrapper.text()).not.toContain('本地预览数据');wrapper.unmount()
    api.feed.mockRejectedValueOnce(Object.assign(new Error('无法连接'),{code:'network_error'}));const offline=await render();expect(offline.text()).toContain('本地预览数据');offline.unmount()
  })
  it('guards rapid likes and applies the server count',async()=>{
    let resolveLike;api.like.mockReturnValue(new Promise(r=>{resolveLike=r}));const wrapper=await render({authenticated:true})
    const like=wrapper.findAll('article.post footer button')[2];await like.trigger('click');await like.trigger('click');expect(api.like).toHaveBeenCalledTimes(1)
    resolveLike({data:{liked:true,like_count:4}});await flushPromises();expect(like.text()).toContain('4');wrapper.unmount()
  })
  it('filters from a category and exposes searched users, follows and tags',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(b=>b.text().includes('发现')).trigger('click');await flushPromises()
    await wrapper.find('.chips button').trigger('click');await flushPromises();expect(api.feed).toHaveBeenLastCalledWith('recommended',{categoryId:'cat-1'})
    await wrapper.findAll('aside nav button').find(b=>b.text().includes('发现')).trigger('click');await flushPromises();await wrapper.find('#discover-q').setValue('技术');await wrapper.find('.discover-search').trigger('submit');await flushPromises();expect(api.search).toHaveBeenCalledWith('技术');expect(wrapper.text()).toContain('用户');expect(wrapper.text()).toContain('# 城市')
    await wrapper.find('.user-result .outline').trigger('click');await flushPromises();expect(api.follow).toHaveBeenCalledWith('u-2',false);wrapper.unmount()
  })
  it('returns to the originating section and removes an unbookmarked saved row',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(b=>b.text().includes('收藏')).trigger('click');await flushPromises()
    await wrapper.find('.compact-result>button:first-child').trigger('click');await flushPromises();expect(location.hash).toBe('#post-p-test')
    await wrapper.find('.back').trigger('click');await flushPromises();expect(location.hash).toBe('#saved');expect(wrapper.text()).toContain('我的收藏')
    await wrapper.find('.compact-result .outline').trigger('click');await flushPromises();expect(wrapper.text()).not.toContain('组件交互测试动态');wrapper.unmount()
  })
  it('clears an unverified cached identity',async()=>{
    api.profile.mockRejectedValueOnce(Object.assign(new Error('已停用'),{status:401,code:'authentication_required'}));const wrapper=await render({authenticated:true})
    expect(wrapper.text()).toContain('登录');expect(sessionStorage.getItem('fanbbs_user')).toBeNull();wrapper.unmount()
  })
  it('opens a private conversation and appends a sent message',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(b=>b.text().includes('消息')).trigger('click');await flushPromises()
    await wrapper.findAll('.message-tabs button')[1].trigger('click');await flushPromises();await wrapper.find('.conversation-row').trigger('click');await flushPromises()
    await wrapper.find('#private-message').setValue('收到');await wrapper.find('.message-compose').trigger('submit');await flushPromises()
    expect(api.sendMessage).toHaveBeenCalledWith('cnv-1','收到');expect(wrapper.findAll('.message-bubble')).toHaveLength(2);wrapper.unmount()
  })
  it('shows admin user operations only after verified role lookup',async()=>{
    api.profile.mockResolvedValueOnce({data:{id:'u-1',handle:'admin',display_name:'管理员',role:'admin'}});const wrapper=await render({authenticated:true})
    await wrapper.find('.user-chip').trigger('click');await flushPromises();await wrapper.find('.admin-link').trigger('click');await flushPromises()
    await wrapper.findAll('.admin-tabs button')[1].trigger('click');await flushPromises();expect(wrapper.text()).toContain('林野 @linye')
    await wrapper.find('.review-item .outline').trigger('click');await flushPromises();expect(api.setUserStatus).toHaveBeenCalledWith('u-2','suspended','足够长的审核测试理由');wrapper.unmount()
  })
  it('follows conversation and message cursors and starts reconnect polling',async()=>{
    api.conversations.mockResolvedValueOnce({data:[{id:'cnv-1',title:'一号'}],page:{next_cursor:'conversations-next'}}).mockResolvedValueOnce({data:[{id:'cnv-2',title:'二号'}],page:{next_cursor:''}})
    api.messages.mockResolvedValueOnce({data:[{id:'msg-new',sender_id:'u-2',content:'新',created_at:'刚刚'}],page:{next_cursor:'messages-next'}}).mockResolvedValueOnce({data:[{id:'msg-old',sender_id:'u-2',content:'旧',created_at:'昨天'}],page:{next_cursor:''}})
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(b=>b.text().includes('消息')).trigger('click');await flushPromises();await wrapper.findAll('.message-tabs button')[1].trigger('click');await flushPromises()
    expect(api.events).toHaveBeenCalledWith('');await wrapper.find('.load-more').trigger('click');await flushPromises();expect(api.conversations).toHaveBeenLastCalledWith('conversations-next')
    await wrapper.findAll('.conversation-row')[0].trigger('click');await flushPromises();await wrapper.find('.load-more').trigger('click');await flushPromises();expect(api.messages).toHaveBeenLastCalledWith('cnv-1','messages-next');expect(wrapper.findAll('.message-bubble')).toHaveLength(2);wrapper.unmount()
  })
  it('loads and deduplicates cursor-paged feed results',async()=>{
    api.feed.mockResolvedValueOnce({data:[samplePost()],page:{next_cursor:'feed-next'}}).mockResolvedValueOnce({data:[samplePost(),{...samplePost(),id:'p-second',content:'第二页动态'}],page:{next_cursor:''}})
    const wrapper=await render();expect(wrapper.text()).toContain('加载更多动态');await wrapper.find('.timeline>.load-more').trigger('click');await flushPromises()
    expect(api.feed).toHaveBeenLastCalledWith('recommended',{},'feed-next');expect(wrapper.findAll('article.post')).toHaveLength(2);expect(wrapper.text()).toContain('第二页动态');expect(wrapper.text()).not.toContain('加载更多动态');wrapper.unmount()
  })
  it('loads a public profile and applies follow/block controls',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.find('.author').trigger('click');await flushPromises();expect(api.profileById).toHaveBeenCalledWith('u-2');expect(location.hash).toBe('#user-u-2')
    await wrapper.find('.profile-actions .primary').trigger('click');await flushPromises();expect(api.follow).toHaveBeenCalledWith('u-2',false)
    await wrapper.findAll('.profile-actions button')[2].trigger('click');await flushPromises();expect(api.block).toHaveBeenCalledWith('u-2',false);wrapper.unmount()
  })
  it('creates a local fulfillment order without presenting payment',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(b=>b.text().includes('商城')).trigger('click');await flushPromises()
    expect(wrapper.text()).toContain('不含付款');await wrapper.find('.product-grid .primary').trigger('click');await flushPromises();expect(api.setCart).toHaveBeenCalledWith('prod-1',1)
    await wrapper.find('.cart-panel .primary').trigger('click');await flushPromises();expect(api.createOrder).toHaveBeenCalledTimes(1);expect(wrapper.text()).not.toContain('银行卡');wrapper.unmount()
  })
  it('shows one-time recovery codes before closing registration',async()=>{
    const wrapper=await render();await wrapper.find('.top-actions .primary').trigger('click');await flushPromises();await wrapper.find('#new-handle').setValue('new_user');await wrapper.find('#new-email').setValue('new@example.test');await wrapper.find('#new-name').setValue('新用户');await wrapper.find('#new-password').setValue('secure-pass-1');await wrapper.find('.dialog form').trigger('submit');await flushPromises()
    expect(wrapper.text()).toContain('AAAAA-BBBBB-CCCCC-DDDDD');expect(wrapper.find('[role="dialog"]').exists()).toBe(true);await wrapper.find('.recovery-codes .primary').trigger('click');expect(wrapper.find('[role="dialog"]').exists()).toBe(false);wrapper.unmount()
  })
  it('abandons completed uploads when a later file upload fails and preserves the composer',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.find('.top-actions [aria-label="发布"]').trigger('click');await wrapper.find('#draft').setValue('保留这份待发布草稿')
    const picker=wrapper.find('.media-picker input');const files=[new File(['first'],'first.png',{type:'image/png'}),new File(['second'],'second.png',{type:'image/png'})];Object.defineProperty(picker.element,'files',{value:files,configurable:true});await picker.trigger('change')
    vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({status:201,ok:true,json:async()=>({data:{id:'media-first'}})}).mockResolvedValueOnce({status:500,ok:false,json:async()=>({error:{code:'upload_failed',message:'第二个文件上传失败'}})}))
    await wrapper.find('.composer .primary').trigger('click');await flushPromises();expect(api.abandonMedia).toHaveBeenCalledWith('media-first');expect(api.createPost).not.toHaveBeenCalled();expect(wrapper.find('#draft').element.value).toBe('保留这份待发布草稿');expect(wrapper.findAll('.selected-media li')).toHaveLength(2);wrapper.unmount();vi.unstubAllGlobals()
  })
  it('abandons every upload when post creation fails and preserves the composer',async()=>{
    api.createPost.mockRejectedValueOnce(new Error('帖子创建失败'));const wrapper=await render({authenticated:true});await wrapper.find('.top-actions [aria-label="发布"]').trigger('click');await wrapper.find('#draft').setValue('稍后重试的草稿')
    const picker=wrapper.find('.media-picker input');const files=[new File(['first'],'first.png',{type:'image/png'}),new File(['second'],'second.png',{type:'image/png'})];Object.defineProperty(picker.element,'files',{value:files,configurable:true});await picker.trigger('change')
    vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({status:201,ok:true,json:async()=>({data:{id:'media-one'}})}).mockResolvedValueOnce({status:201,ok:true,json:async()=>({data:{id:'media-two'}})}))
    await wrapper.find('.composer .primary').trigger('click');await flushPromises();expect(api.abandonMedia.mock.calls.map(call=>call[0])).toEqual(['media-one','media-two']);expect(wrapper.find('#draft').element.value).toBe('稍后重试的草稿');expect(wrapper.findAll('.selected-media li')).toHaveLength(2);wrapper.unmount();vi.unstubAllGlobals()
  })
  it('publishes the complete post contract selected in the composer',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.find('.top-actions [aria-label="发布"]').trigger('click');await flushPromises()
    expect(api.categories).toHaveBeenCalled();expect(api.tags).toHaveBeenCalled();await wrapper.find('#compose-title-field').setValue('一篇完整文章');await wrapper.find('#compose-summary').setValue('文章摘要');await wrapper.find('#draft').setValue('文章正文');await wrapper.find('#compose-kind').setValue('image');await wrapper.find('#compose-category').setValue('cat-1');await wrapper.find('#compose-visibility').setValue('followers');await wrapper.find('.tag-picker input').setValue(true)
    await wrapper.find('.composer-form').trigger('submit');await flushPromises();expect(api.createPost).toHaveBeenCalledWith({content:'文章正文',title:'一篇完整文章',summary:'文章摘要',kind:'image',category_id:'cat-1',tag_ids:['tag-1'],media_ids:[],visibility:'followers'});wrapper.unmount()
  })
  it('changes the password with confirmation and surfaces account errors',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.find('.user-chip').trigger('click');await flushPromises();const form=wrapper.find('.security-form');await form.find('#current-password').setValue('old-password');await form.find('#account-new-password').setValue('new-password');await form.find('#confirm-new-password').setValue('different-password');await form.trigger('submit');expect(api.changePassword).not.toHaveBeenCalled();expect(wrapper.text()).toContain('两次输入的新密码不一致')
    await form.find('#confirm-new-password').setValue('new-password');api.changePassword.mockRejectedValueOnce(new Error('当前密码不正确'));await form.trigger('submit');await flushPromises();expect(confirm).toHaveBeenCalledWith(expect.stringContaining('其他设备'));expect(api.changePassword).toHaveBeenCalledWith('old-password','new-password');expect(wrapper.text()).toContain('当前密码不正确');wrapper.unmount()
  })
  it('deactivates the account only after a clear confirmation and clears the session',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.find('.user-chip').trigger('click');await flushPromises();await wrapper.find('.danger-zone .danger-button').trigger('click');await flushPromises();expect(confirm).toHaveBeenCalledWith(expect.stringContaining('立即退出'));expect(api.deactivateAccount).toHaveBeenCalledTimes(1);expect(sessionStorage.getItem('fanbbs_user')).toBeNull();expect(wrapper.text()).toContain('登录');wrapper.unmount()
  })
  it('renders reply depth, posts through the reply endpoint and reports comments',async()=>{
    api.comments.mockResolvedValueOnce({data:[{id:'c-root',depth:0,author:{id:'u-2',name:'林野',handle:'linye'},content:'根回复',age:'刚刚',like_count:0},{id:'c-child',parent_id:'c-root',depth:1,author:{id:'u-3',name:'木棉',handle:'mumian'},content:'子回复',age:'刚刚',like_count:0}]});const wrapper=await render({authenticated:true});await wrapper.find('.post-content').trigger('click');await flushPromises();expect(wrapper.find('[data-depth="1"]').exists()).toBe(true)
    await wrapper.find('[data-depth="0"] .comment-actions button:nth-child(2)').trigger('click');await wrapper.find('#reply-c-root').setValue('嵌套回复');await wrapper.find('.inline-reply').trigger('submit');await flushPromises();expect(api.reply).toHaveBeenCalledWith('p-test','c-root','嵌套回复');expect(wrapper.findAll('.comment')).toHaveLength(3)
    const nested=wrapper.findAll('.comment').find(item=>item.text().includes('子回复'));await nested.findAll('.comment-actions button').find(button=>button.text()==='举报').trigger('click');await flushPromises();expect(api.report).toHaveBeenCalledWith('comment','c-child','足够长的审核测试理由');wrapper.unmount()
  })
  it('reports a user and toggles repost from both feed state and detail',async()=>{
    const reposted={...samplePost(),reposted:true,reposts:2};api.feed.mockResolvedValueOnce({data:[reposted]});api.detail.mockResolvedValueOnce({data:{...reposted}});const wrapper=await render({authenticated:true});await wrapper.find('.post-content').trigger('click');await flushPromises();const repostButton=wrapper.findAll('.detail-post footer button')[1];await repostButton.trigger('click');await flushPromises();expect(api.repost).toHaveBeenCalledWith('p-test',true);expect(repostButton.text()).toContain('1')
    await wrapper.find('.back').trigger('click');await wrapper.find('.author').trigger('click');await flushPromises();await wrapper.find('.report-user').trigger('click');await flushPromises();expect(api.report).toHaveBeenCalledWith('user','u-2','足够长的审核测试理由');wrapper.unmount()
  })
})
