import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const samplePost = () => ({ id:'p-test', author:{id:'u-2',name:'林野',handle:'linye'}, age:'刚刚', content:'组件交互测试动态', comments:1,reposts:2,likes:3,views:4,liked:false,bookmarked:false })
const api = vi.hoisted(() => ({
  feed:vi.fn(), profile:vi.fn(), categories:vi.fn(), search:vi.fn(), bookmarks:vi.fn(), notifications:vi.fn(), adminReview:vi.fn(),
  like:vi.fn(), repost:vi.fn(), bookmark:vi.fn(), follow:vi.fn(), detail:vi.fn(), comments:vi.fn(), updateProfile:vi.fn(),
  login:vi.fn(), register:vi.fn(), logout:vi.fn(), createPost:vi.fn(), comment:vi.fn(), reply:vi.fn(), readNotifications:vi.fn(), moderate:vi.fn(), report:vi.fn(),
  conversations:vi.fn(), conversation:vi.fn(), createConversation:vi.fn(), messages:vi.fn(), sendMessage:vi.fn(), events:vi.fn(), tags:vi.fn(), adminUsers:vi.fn(), adminContent:vi.fn(), setUserStatus:vi.fn(), createCategory:vi.fn(), updateCategory:vi.fn(), deleteCategory:vi.fn(), createTag:vi.fn(), updateTag:vi.fn(), deleteTag:vi.fn(),
  profileById:vi.fn(),profilePosts:vi.fn(),profileComments:vi.fn(),followers:vi.fn(),following:vi.fn(),block:vi.fn(),blocks:vi.fn(),followCategory:vi.fn(),categoryFollows:vi.fn(),sessions:vi.fn(),revokeSession:vi.fn(),markConversationRead:vi.fn(),leaveConversation:vi.fn(),homepage:vi.fn(),adminHomepage:vi.fn(),updateHomepage:vi.fn()
  ,products:vi.fn(),product:vi.fn(),productTypes:vi.fn(),cart:vi.fn(),setCart:vi.fn(),removeCart:vi.fn(),createOrder:vi.fn(),orders:vi.fn(),order:vi.fn(),cancelOrder:vi.fn(),gamification:vi.fn(),pointEvents:vi.fn(),tasks:vi.fn(),ranks:vi.fn(),frames:vi.fn(),checkIn:vi.fn(),selectFrame:vi.fn()
  ,adminProductTypes:vi.fn(),createProductType:vi.fn(),updateProductType:vi.fn(),deleteProductType:vi.fn(),adminProducts:vi.fn(),adminProduct:vi.fn(),createProduct:vi.fn(),updateProduct:vi.fn(),deleteProduct:vi.fn(),adminOrders:vi.fn(),adminOrder:vi.fn(),transitionOrder:vi.fn()
  ,recover:vi.fn(),rotateRecoveryCodes:vi.fn(),changePassword:vi.fn(),deactivateAccount:vi.fn()
  ,updatePost:vi.fn(),deletePost:vi.fn(),postRevisions:vi.fn(),updateComment:vi.fn(),deleteComment:vi.fn(),likeComment:vi.fn(),moderatePost:vi.fn(),postControls:vi.fn()
  ,abandonMedia:vi.fn()
  ,collections:vi.fn(),createCollection:vi.fn(),updateCollection:vi.fn(),deleteCollection:vi.fn(),setCollectionPost:vi.fn(),publicCollections:vi.fn(),collection:vi.fn()
  ,shippingAddresses:vi.fn(),createShippingAddress:vi.fn(),updateShippingAddress:vi.fn(),deleteShippingAddress:vi.fn(),tracking:vi.fn(),addTrackingEvent:vi.fn()
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
  api.categories.mockResolvedValue({data:[{id:'cat-1',slug:'tech',name:'技术',description:'分享代码、产品与数字生活',image_url:'/media/tech-icon.webp',background_url:'/media/tech-cover.webp',post_count:12}]});api.search.mockResolvedValue({data:{posts:[samplePost()],users:[{id:'u-2',handle:'linye',display_name:'林野',following:false}],tags:[{id:'tag-1',name:'城市'}]}})
  api.bookmarks.mockResolvedValue({data:[{...samplePost(),bookmarked:true}]});api.notifications.mockResolvedValue({data:[]});api.adminReview.mockResolvedValue({data:[]});api.comments.mockResolvedValue({data:[]});api.detail.mockResolvedValue({data:samplePost()})
  api.bookmark.mockResolvedValue({data:{changed:true}});api.follow.mockResolvedValue({data:{changed:true}});api.logout.mockResolvedValue({data:{}})
  api.conversations.mockResolvedValue({data:[{id:'cnv-1',title:'林野',updated_at:'刚刚',last_message:{content:'你好'}}]});api.conversation.mockResolvedValue({data:{id:'cnv-1',members:[]}});api.messages.mockResolvedValue({data:[{id:'msg-1',sender_id:'u-2',content:'你好',created_at:'刚刚'}]});api.sendMessage.mockResolvedValue({data:{id:'msg-2',sender_id:'u-1',content:'收到',created_at:'刚刚'}})
  api.events.mockResolvedValue({data:[],page:{next_cursor:''}})
  api.tags.mockResolvedValue({data:[{id:'tag-1',name:'城市',slug:'city'}]});api.adminUsers.mockResolvedValue({data:[{id:'u-2',display_name:'林野',handle:'linye',role:'member',status:'active'}]});api.adminContent.mockResolvedValue({data:[]});api.setUserStatus.mockResolvedValue({data:{status:'suspended'}})
  api.sessions.mockResolvedValue({data:[{id:'sess-1',current:true,created_at:'今天'}]});api.blocks.mockResolvedValue({data:[]});api.categoryFollows.mockResolvedValue({data:[]});api.profileById.mockResolvedValue({data:{id:'u-2',name:'林野',handle:'linye',bio:'简介',follower_count:1,following_count:2,post_count:3,following:false,blocked_by_me:false}});api.profilePosts.mockResolvedValue({data:[samplePost()]});api.profileComments.mockResolvedValue({data:[]});api.followers.mockResolvedValue({data:[]});api.following.mockResolvedValue({data:[]});api.block.mockResolvedValue({data:{changed:true}});api.followCategory.mockResolvedValue({data:{changed:true}});api.revokeSession.mockResolvedValue({data:{revoked:true}})
  api.collections.mockResolvedValue({data:[]});api.publicCollections.mockResolvedValue({data:[]});api.collection.mockResolvedValue({data:{collection:{id:'col-1',name:'公开精选',description:'公开内容'},posts:[]}});api.createCollection.mockResolvedValue({data:{id:'col-1',name:'公开精选',description:'公开内容',visibility:'public',item_count:0,version:1}});api.deleteCollection.mockResolvedValue({data:{deleted:true}});api.setCollectionPost.mockResolvedValue({data:{changed:true}})
  api.markConversationRead.mockResolvedValue({data:{read:true}});api.leaveConversation.mockResolvedValue({data:{left:true}});api.homepage.mockResolvedValue({data:{payload:{carousel:[],announcements:[]}}});api.adminHomepage.mockResolvedValue({data:{version:1,status:'published',payload:{carousel:[],announcements:[]}}})
  const product={id:'prod-1',type_id:'type-1',type_name:'周边',sku:'community-sticker',name:'社区贴纸',description:'本地履约',inventory:3,status:'active'}
  api.productTypes.mockResolvedValue({data:[{id:'type-1',slug:'goods',name:'周边',status:'active'}]});api.products.mockResolvedValue({data:[product]});api.product.mockResolvedValue({data:product});api.cart.mockResolvedValue({data:[]});api.setCart.mockImplementation((_id,quantity)=>Promise.resolve({data:{product,quantity}}));api.removeCart.mockResolvedValue({data:{deleted:true}});api.createOrder.mockResolvedValue({data:{id:'ord-1',status:'created',created_at:'今天',items:[{product_id:'prod-1',sku:'community-sticker',name:'社区贴纸',quantity:1}]}});api.orders.mockResolvedValue({data:[]});api.order.mockResolvedValue({data:{id:'ord-1',status:'created',created_at:'今天',items:[{product_id:'prod-1',sku:'community-sticker',name:'社区贴纸',quantity:1}]}});api.cancelOrder.mockResolvedValue({data:{id:'ord-1',status:'cancelled',items:[]}});api.gamification.mockResolvedValue({data:{level:2,level_name:'新芽',title:'成员',points_balance:10,lifetime_points:25,rank:2}});api.pointEvents.mockResolvedValue({data:[]});api.tasks.mockResolvedValue({data:[]});api.ranks.mockResolvedValue({data:[]});api.frames.mockResolvedValue({data:[]});api.checkIn.mockResolvedValue({data:{}})
  api.shippingAddresses.mockResolvedValue({data:[]});api.createShippingAddress.mockResolvedValue({data:{id:'addr-1',label:'家',recipient_name:'测试者',phone:'123',region:'北京',address_line:'测试路 1 号',postal_code:'',is_default:true,version:1}});api.updateShippingAddress.mockResolvedValue({data:{id:'addr-1',version:2}});api.deleteShippingAddress.mockResolvedValue({data:{deleted:true}});api.addTrackingEvent.mockResolvedValue({data:{id:'trk-2',status:'in_transit',description:'手工更新',location:'',occurred_at:'今天',source:'manual'}})
  api.adminProductTypes.mockResolvedValue({data:[{id:'type-1',slug:'goods',name:'周边',status:'active'}]});api.adminProducts.mockResolvedValue({data:[product]});api.adminOrders.mockResolvedValue({data:[{id:'ord-1',user_id:'u-2',status:'created',items:[{product_id:'prod-1',name:'社区贴纸',quantity:1}]}]});api.adminOrder.mockResolvedValue({data:{id:'ord-1',user_id:'u-2',status:'created',items:[{product_id:'prod-1',sku:'community-sticker',name:'社区贴纸',quantity:1}]}});api.transitionOrder.mockResolvedValue({data:{id:'ord-1',user_id:'u-2',status:'cancelled',items:[]}});api.createProductType.mockResolvedValue({data:{id:'type-2',slug:'books',name:'图书',status:'active'}});api.updateProductType.mockResolvedValue({data:{id:'type-1',slug:'goods',name:'社区周边',status:'active'}});api.deleteProductType.mockResolvedValue({data:{deleted:true}});api.createProduct.mockResolvedValue({data:product});api.updateProduct.mockResolvedValue({data:product});api.deleteProduct.mockResolvedValue({data:{deleted:true}})
  api.createCategory.mockImplementation(input=>Promise.resolve({data:{id:'cat-new',post_count:0,...input}}));api.updateCategory.mockImplementation((id,input)=>Promise.resolve({data:{id,post_count:12,...input}}));api.deleteCategory.mockResolvedValue({data:{deleted:true}});api.createTag.mockResolvedValue({data:{id:'tag-new',slug:'new-tag',name:'新标签'}});api.updateTag.mockImplementation((id,input)=>Promise.resolve({data:{id,...input}}));api.deleteTag.mockResolvedValue({data:{deleted:true}})
  api.register.mockResolvedValue({data:{access_token:'a',refresh_token:'r',user:{id:'u-new',handle:'new',display_name:'新用户'},recovery_codes:['AAAAA-BBBBB-CCCCC-DDDDD']}});api.recover.mockResolvedValue({data:{changed:true,recovery_codes:['EEEEE-FFFFF-GGGGG-HHHHH']}});api.rotateRecoveryCodes.mockResolvedValue({data:{recovery_codes:['IIIII-JJJJJ-KKKKK-LLLLL']}})
  api.createPost.mockResolvedValue({data:samplePost()});api.comment.mockResolvedValue({data:{id:'c-new',depth:0,author:{id:'u-1',name:'测试者',handle:'tester'},content:'回复',age:'刚刚'}});api.reply.mockResolvedValue({data:{id:'c-reply',parent_id:'c-root',depth:1,author:{id:'u-1',name:'测试者',handle:'tester'},content:'嵌套回复',age:'刚刚'}});api.repost.mockResolvedValue({data:{changed:true}});api.report.mockResolvedValue({data:{id:'report-1'}})
  api.updatePost.mockImplementation((_id,_version,input)=>Promise.resolve({data:{...samplePost(),...input,content:input.content,category:input.category_id?{id:input.category_id,name:'技术'}:null,tags:input.tag_ids.map(id=>({id,name:'城市'})),version:3}}));api.deletePost.mockResolvedValue({data:{deleted:true}});api.postRevisions.mockResolvedValue({data:[]});api.updateComment.mockResolvedValue({data:{}});api.deleteComment.mockResolvedValue({data:{deleted:true}});api.likeComment.mockResolvedValue({data:{liked:true,like_count:1}});api.moderatePost.mockResolvedValue({data:{state:'published'}});api.postControls.mockResolvedValue({data:{pinned:true,recommended:false}})
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
  it('presents rich category artwork with separate hot and latest feeds',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(b=>b.text().includes('发现')).trigger('click');await flushPromises()
    await wrapper.find('.category-card-main').trigger('click');await flushPromises();expect(location.hash).toBe('#category-cat-1');expect(wrapper.find('.category-hero').text()).toContain('分享代码、产品与数字生活');expect(wrapper.find('.category-hero').attributes('style')).toContain('tech-cover.webp')
    const categoryTabs=wrapper.findAll('.tabs button');expect(categoryTabs.map(button=>button.text())).toEqual(['热门','最新']);await categoryTabs[1].trigger('click');await flushPromises();expect(api.feed).toHaveBeenLastCalledWith('latest',{categoryId:'cat-1'});wrapper.unmount()
  })
  it('edits all rich category presentation fields in the admin taxonomy view',async()=>{
    api.profile.mockResolvedValueOnce({data:{id:'u-1',handle:'admin',display_name:'管理员',role:'admin'}});const wrapper=await render({authenticated:true});await wrapper.find('.user-chip').trigger('click');await flushPromises();await wrapper.find('.admin-link').trigger('click');await flushPromises();await wrapper.findAll('.admin-tabs button')[3].trigger('click');await flushPromises()
    await wrapper.find('.rich-taxonomy-row button').trigger('click');await wrapper.find('.category-admin-form textarea').setValue('更新后的分类描述');const fields=wrapper.findAll('.category-admin-form input');await fields[2].setValue('/media/new-icon.webp');await fields[3].setValue('https://static.example.test/new-cover.webp');await wrapper.find('.category-admin-form').trigger('submit');await flushPromises()
    expect(api.updateCategory).toHaveBeenCalledWith('cat-1',{name:'技术',slug:'tech',description:'更新后的分类描述',image_url:'/media/new-icon.webp',background_url:'https://static.example.test/new-cover.webp'});expect(wrapper.text()).toContain('更新后的分类描述');wrapper.unmount()
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
    expect(api.sendMessage).toHaveBeenCalledWith('cnv-1','收到');expect(wrapper.findAll('.message-bubble')).toHaveLength(2);expect(wrapper.find('#private-message').element.value).toBe('');wrapper.unmount()
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
  it('loads supported public profile content tabs without inventing private collections',async()=>{
    api.profileComments.mockResolvedValueOnce({data:[{id:'comment-profile',post_id:'p-test',content:'公开回复',age:'刚刚'}]})
    const wrapper=await render({authenticated:true});await wrapper.find('.author').trigger('click');await flushPromises();expect(api.profilePosts).toHaveBeenCalledWith('u-2');expect(wrapper.text()).toContain('组件交互测试动态')
    await wrapper.findAll('.profile-content-tabs button')[1].trigger('click');await flushPromises();expect(api.profileComments).toHaveBeenCalledWith('u-2');expect(wrapper.text()).toContain('公开回复');expect(wrapper.findAll('.profile-content-tabs button').map(button=>button.text())).toEqual(['帖子','回复']);wrapper.unmount()
  })
  it('loads and manages blocked users and followed categories',async()=>{
    api.blocks.mockResolvedValueOnce({data:[{id:'u-blocked',display_name:'被屏蔽用户',handle:'blocked'}]});api.categoryFollows.mockResolvedValueOnce({data:[{category:{id:'cat-followed',name:'摄影',post_count:4}}]})
    const wrapper=await render({authenticated:true});await wrapper.find('.user-chip').trigger('click');await flushPromises();expect(api.blocks).toHaveBeenCalledWith();expect(api.categoryFollows).toHaveBeenCalledWith();expect(wrapper.text()).toContain('被屏蔽用户');expect(wrapper.text()).toContain('摄影')
    await wrapper.find('.privacy-grid section:first-child .outline').trigger('click');await flushPromises();expect(api.block).toHaveBeenCalledWith('u-blocked',true);expect(wrapper.text()).not.toContain('被屏蔽用户')
    await wrapper.find('.privacy-grid section:nth-child(2) .outline').trigger('click');await flushPromises();expect(api.followCategory).toHaveBeenCalledWith('cat-followed',true);expect(wrapper.text()).not.toContain('4 篇帖子');wrapper.unmount()
  })
  it('shows server-backed read state and can leave a conversation',async()=>{
    api.conversation.mockResolvedValueOnce({data:{id:'cnv-1',members:[{user:{id:'u-1'},read_at:'2026-10-02T12:00:00Z'},{user:{id:'u-2'},read_at:'2026-10-02T12:10:00Z'}]}});api.messages.mockResolvedValueOnce({data:[{id:'msg-mine',sender_id:'u-1',content:'需要已读状态',created_at:'2026-10-02T12:05:00Z'}]})
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(b=>b.text().includes('消息')).trigger('click');await flushPromises();await wrapper.findAll('.message-tabs button')[1].trigger('click');await flushPromises();await wrapper.find('.conversation-row').trigger('click');await flushPromises();expect(wrapper.find('.read-receipt').text()).toContain('已读')
    await wrapper.find('.leave-conversation').trigger('click');await flushPromises();expect(api.leaveConversation).toHaveBeenCalledWith('cnv-1');expect(wrapper.find('.message-thread').exists()).toBe(false);wrapper.unmount()
  })
  it('filters and opens products and manages every cart quantity action',async()=>{
    const product={id:'prod-1',type_id:'type-1',type_name:'周边',sku:'community-sticker',name:'社区贴纸',description:'详情说明',inventory:3,status:'active'};api.products.mockResolvedValue({data:[product]});api.cart.mockResolvedValueOnce({data:[{product,quantity:2}]})
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(button=>button.text().includes('商城')).trigger('click');await flushPromises();await wrapper.findAll('.product-type-filter button')[1].trigger('click');await flushPromises();expect(api.products).toHaveBeenLastCalledWith('type-1')
    await wrapper.find('.product-grid .outline').trigger('click');await flushPromises();expect(api.product).toHaveBeenCalledWith('prod-1');expect(wrapper.text()).toContain('详情说明')
    await wrapper.find('.quantity-control button').trigger('click');await flushPromises();expect(api.setCart).toHaveBeenCalledWith('prod-1',1);await wrapper.find('.remove-cart').trigger('click');await flushPromises();expect(api.removeCart).toHaveBeenCalledWith('prod-1');expect(wrapper.find('.cart-panel').exists()).toBe(false);wrapper.unmount()
  })
  it('loads immutable order detail and cancels a created order',async()=>{
    const order={id:'ord-detail',status:'created',created_at:'今天',items:[{product_id:'prod-1',sku:'community-sticker',name:'社区贴纸',quantity:2}]};api.orders.mockResolvedValueOnce({data:[order]});api.order.mockResolvedValueOnce({data:order});api.cancelOrder.mockResolvedValueOnce({data:{...order,status:'cancelled',cancelled_at:'现在'}})
    const wrapper=await render({authenticated:true});await wrapper.find('.user-chip').trigger('click');await flushPromises();await wrapper.findAll('.profile-shortcuts button').find(button=>button.text()==='我的订单').trigger('click');await flushPromises();await wrapper.find('.order-summary').trigger('click');await flushPromises();expect(api.order).toHaveBeenCalledWith('ord-detail');expect(wrapper.text()).toContain('community-sticker')
    await wrapper.find('.order-detail .outline').trigger('click');await flushPromises();expect(api.cancelOrder).toHaveBeenCalledWith('ord-detail','足够长的审核测试理由');expect(wrapper.find('.order-detail').text()).toContain('cancelled');wrapper.unmount()
  })
  it('renders complete local reward history, tasks, frames and ranks',async()=>{
    api.pointEvents.mockResolvedValueOnce({data:[{id:'points-1',amount:5,event_type:'daily_checkin',description:'每日签到',created_at:'今天'}]});api.tasks.mockResolvedValueOnce({data:[{id:'task-1',name:'社区协助',description:'完成一次审核协助',repeat_policy:'once',reward_points:10,reward_frame_id:'frame-1',claimed:true}]});api.ranks.mockResolvedValueOnce({data:[{rank:1,user_id:'u-1',display_name:'测试者',lifetime_points:25,level:2,title:'成员'}]});api.frames.mockResolvedValueOnce({data:[{id:'frame-1',name:'秋日',image_url:'/frames/autumn.png',entitled:true,selected:true}]})
    const wrapper=await render({authenticated:true});await wrapper.find('.user-chip').trigger('click');await flushPromises();await wrapper.findAll('.profile-shortcuts button').find(button=>button.text()==='等级与积分').trigger('click');await flushPromises();expect(wrapper.text()).toContain('累计 25 分');expect(wrapper.text()).toContain('本期已获奖');expect(wrapper.text()).toContain('#1 测试者');expect(wrapper.text()).toContain('每日签到');expect(wrapper.text()).toContain('使用中')
    await wrapper.find('.clear-frame').trigger('click');await flushPromises();expect(api.selectFrame).toHaveBeenCalledWith('');wrapper.unmount()
  })
  it('uses backend admin catalog CRUD and local order transitions',async()=>{
    api.profile.mockResolvedValueOnce({data:{id:'u-1',handle:'admin',display_name:'管理员',role:'admin'}});const wrapper=await render({authenticated:true});await wrapper.find('.user-chip').trigger('click');await flushPromises();await wrapper.find('.admin-link').trigger('click');await flushPromises();await wrapper.findAll('.admin-tabs button').find(button=>button.text()==='商品订单').trigger('click');await flushPromises();expect(api.adminProductTypes).toHaveBeenCalled();expect(api.adminProducts).toHaveBeenCalled();expect(api.adminOrders).toHaveBeenCalledWith('')
    const typeForm=wrapper.find('.admin-inline-form');await typeForm.find('[aria-label="类型名称"]').setValue('图书');await typeForm.find('[aria-label="类型标识"]').setValue('books');await typeForm.trigger('submit');await flushPromises();expect(api.createProductType).toHaveBeenCalledWith({slug:'books',name:'图书',status:'active',reason:''})
    vi.stubGlobal('prompt',vi.fn().mockReturnValueOnce('local').mockReturnValueOnce('LOCAL-2').mockReturnValueOnce('人工交付完成'));api.transitionOrder.mockResolvedValueOnce({data:{id:'ord-1',user_id:'u-2',status:'fulfilled',fulfillment_carrier:'local',tracking_code:'LOCAL-2',items:[]}});await wrapper.findAll('.admin-orders .primary').find(button=>button.text()==='记录手工履约').trigger('click');await flushPromises();expect(api.transitionOrder).toHaveBeenCalledWith('ord-1',{status:'fulfilled',fulfillment_carrier:'local',tracking_code:'LOCAL-2',reason:'人工交付完成'});wrapper.unmount()
  })
  it('renders complete post metadata and submits the full editable contract',async()=>{
    const post={...samplePost(),author:{id:'u-1',name:'测试者',handle:'tester'},title:'完整标题',summary:'完整摘要',category:{id:'cat-1',name:'技术'},tags:[{id:'tag-1',name:'城市'}],visibility:'followers',version:2}
    api.feed.mockResolvedValueOnce({data:[post]});api.detail.mockResolvedValueOnce({data:{...post}})
    const wrapper=await render({authenticated:true});const feedPost=wrapper.find('article.post');expect(feedPost.text()).toContain('完整标题');expect(feedPost.text()).toContain('完整摘要');expect(feedPost.text()).toContain('技术');expect(feedPost.text()).toContain('#城市');expect(feedPost.text()).toContain('仅关注者可见')
    await feedPost.find('.post-content').trigger('click');await flushPromises();await wrapper.find('.owner-actions .outline').trigger('click');await flushPromises();const editor=wrapper.find('.post-editor');expect(editor.exists()).toBe(true);await editor.find('#edit-post-title-field').setValue('修改后标题');await editor.find('#edit-post-summary').setValue('修改后摘要');await editor.find('#edit-post-content').setValue('修改后正文');await editor.find('#edit-post-category').setValue('');await editor.find('#edit-post-visibility').setValue('public');await editor.find('.tag-picker input').setValue(false);await editor.find('form').trigger('submit');await flushPromises()
    expect(api.updatePost).toHaveBeenCalledWith('p-test',2,{title:'修改后标题',summary:'修改后摘要',content:'修改后正文',category_id:'',tag_ids:[],visibility:'public'});wrapper.unmount()
  })
  it('renders immutable revision snapshots instead of the current post body',async()=>{
    const post={...samplePost(),author:{id:'u-1',name:'测试者',handle:'tester'},title:'当前标题',version:2};api.feed.mockResolvedValueOnce({data:[post]});api.detail.mockResolvedValueOnce({data:post});api.postRevisions.mockResolvedValueOnce({data:[{version:1,title:'历史标题',summary:'历史摘要',body:'历史快照正文',visibility:'followers',category_id:'cat-1',tag_ids:['tag-1'],created_at:'昨天'}]})
    const wrapper=await render({authenticated:true});await wrapper.find('.post-content').trigger('click');await flushPromises();await wrapper.findAll('.owner-actions .outline')[1].trigger('click');await flushPromises();expect(wrapper.find('.revision-list').text()).toContain('历史快照正文');expect(wrapper.find('.revision-list').text()).not.toContain('组件交互测试动态');wrapper.unmount()
  })
  it('uses backend notification fields, deep-links safe subjects, and marks all pages read',async()=>{
    api.notifications.mockResolvedValueOnce({data:[{id:'ntf-1',type:'like',subject_type:'post',subject_id:'p-test',actor:{id:'u-2',display_name:'林野',handle:'linye'},payload:{},created_at:'今天'}],page:{next_cursor:'more'}})
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(button=>button.text().includes('消息')).trigger('click');await flushPromises();const notification=wrapper.find('.notification-action');expect(notification.text()).toContain('林野 赞了你的帖子');expect(notification.text()).toContain('post · p-test')
    await notification.trigger('click');await flushPromises();expect(api.readNotifications).toHaveBeenCalledWith(['ntf-1']);expect(api.detail).toHaveBeenCalledWith('p-test');expect(location.hash).toBe('#post-p-test');await wrapper.find('.back').trigger('click');await flushPromises()
    await wrapper.find('.section-heading>.text-button').trigger('click');await flushPromises();expect(api.readNotifications).toHaveBeenCalledWith([]);wrapper.unmount()
  })
  it('accepts nested message reconnect events and refreshes receipt members',async()=>{
    vi.useFakeTimers();api.events.mockResolvedValueOnce({data:[],page:{next_cursor:'event-1'}}).mockResolvedValueOnce({data:[{cursor:'event-2',type:'notification.created',notification:{id:'ntf-message',type:'message',subject_type:'message',subject_id:'msg-2',payload:{conversation_id:'cnv-1'}}}],page:{next_cursor:'event-2'}})
    api.conversation.mockResolvedValueOnce({data:{id:'cnv-1',members:[]}}).mockResolvedValueOnce({data:{id:'cnv-1',members:[{user:{id:'u-2'},read_at:'2026-10-02T12:10:00Z'}]}});api.messages.mockResolvedValueOnce({data:[{id:'msg-1',sender_id:'u-1',content:'你好',created_at:'2026-10-02T12:05:00Z'}]}).mockResolvedValueOnce({data:[{id:'msg-2',sender_id:'u-2',content:'新消息',created_at:'2026-10-02T12:08:00Z'},{id:'msg-1',sender_id:'u-1',content:'你好',created_at:'2026-10-02T12:05:00Z'}],page:{next_cursor:''}})
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(button=>button.text().includes('消息')).trigger('click');await flushPromises();await wrapper.findAll('.message-tabs button')[1].trigger('click');await flushPromises();await wrapper.find('.conversation-row').trigger('click');await flushPromises();await vi.advanceTimersByTimeAsync(15000);await flushPromises()
    expect(api.events).toHaveBeenLastCalledWith('event-1');expect(api.conversation).toHaveBeenCalledTimes(2);expect(api.messages).toHaveBeenCalledTimes(2);expect(wrapper.text()).toContain('新消息');wrapper.unmount();vi.useRealTimers()
  })
  it('suspends reported users and filters admin users by backend status',async()=>{
    api.profile.mockResolvedValueOnce({data:{id:'u-1',handle:'admin',display_name:'管理员',role:'admin'}});api.adminReview.mockResolvedValueOnce({data:[{id:'report-user',target_type:'user',target_id:'u-2',reason:'用户举报',status:'open'}]})
    const wrapper=await render({authenticated:true});await wrapper.find('.user-chip').trigger('click');await flushPromises();await wrapper.find('.admin-link').trigger('click');await flushPromises();await wrapper.find('.review-item .primary').trigger('click');await flushPromises();expect(api.moderate).toHaveBeenCalledWith('report-user','suspend_user','足够长的审核测试理由')
    await wrapper.findAll('.admin-tabs button')[1].trigger('click');await flushPromises();await wrapper.find('.admin-user-filters select').setValue('suspended');await wrapper.find('.admin-user-filters').trigger('submit');await flushPromises();expect(api.adminUsers).toHaveBeenLastCalledWith({status:'suspended',role:'',q:''});wrapper.unmount()
  })
  it('returns from a profile post detail to the same public profile route',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.find('.author').trigger('click');await flushPromises();await wrapper.find('.profile-content-row>button').trigger('click');await flushPromises();expect(location.hash).toBe('#post-p-test');await wrapper.find('.back').trigger('click');await flushPromises();expect(location.hash).toBe('#user-u-2');expect(api.profileById).toHaveBeenLastCalledWith('u-2');expect(wrapper.find('.public-profile').exists()).toBe(true);wrapper.unmount()
  })
  it('hydrates every supported top-level hash on startup',async()=>{
    const routes=[['shop',api.productTypes],['orders',api.orders],['gamification',api.gamification],['saved',api.bookmarks],['messages',api.notifications],['me',api.sessions],['admin',api.adminReview],['discover',api.categories]]
    for(const [route,loader] of routes){loader.mockClear();history.replaceState({},'',`#${route}`);const wrapper=await render({authenticated:true});expect(loader,`#${route} loader`).toHaveBeenCalled();expect(location.hash).toBe(`#${route}`);wrapper.unmount()}
  })
  it('creates a privacy-explicit collection and opens its visible posts',async()=>{
    const wrapper=await render({authenticated:true});await wrapper.findAll('aside nav button').find(b=>b.text().includes('收藏')).trigger('click');await flushPromises();const form=wrapper.find('.collection-panel form');const fields=form.findAll('input');await fields[0].setValue('公开精选');await fields[1].setValue('公开内容');await form.find('select').setValue('public');await form.trigger('submit');await flushPromises();expect(api.createCollection).toHaveBeenCalledWith({name:'公开精选',description:'公开内容',visibility:'public'});expect(fields[0].element.value).toBe('');await wrapper.find('.collection-panel article button').trigger('click');await flushPromises();expect(api.collection).toHaveBeenCalledWith('col-1');expect(wrapper.text()).toContain('公开内容');wrapper.unmount()
  })
  it('saves an address and snapshots it when creating a local order',async()=>{
    const address={id:'addr-1',label:'家',recipient_name:'测试者',phone:'123',region:'北京',address_line:'测试路 1 号',postal_code:'',is_default:true,version:1};api.orders.mockResolvedValueOnce({data:[{id:'ord-1',status:'created',created_at:'今天',items:[]}]});api.shippingAddresses.mockResolvedValueOnce({data:[]}).mockResolvedValueOnce({data:[]}).mockResolvedValueOnce({data:[address]});const wrapper=await render({authenticated:true});await wrapper.find('.user-chip').trigger('click');await flushPromises();await wrapper.findAll('.profile-shortcuts button').find(b=>b.text().includes('我的订单')).trigger('click');await flushPromises();const form=wrapper.find('.address-form');const inputs=form.findAll('input');for(const [i,value] of ['家','测试者','123','北京','测试路 1 号',''].entries())await inputs[i].setValue(value);await inputs[6].setValue(true);await form.trigger('submit');await flushPromises();expect(api.createShippingAddress).toHaveBeenCalled();expect(inputs[0].element.value).toBe('');expect(wrapper.text()).toContain('测试路 1 号');wrapper.unmount()
  })
  it('refreshes canonical defaults after address edit/delete and appends manual tracking',async()=>{
    const address={id:'addr-1',label:'家',recipient_name:'测试者',phone:'123',region:'北京',address_line:'旧地址',postal_code:'',is_default:true,version:1};api.orders.mockResolvedValue({data:[]});api.shippingAddresses.mockResolvedValue({data:[address]});vi.stubGlobal('prompt',vi.fn().mockReturnValueOnce('测试者').mockReturnValueOnce('123').mockReturnValueOnce('北京').mockReturnValueOnce('新地址'));const wrapper=await render({authenticated:true});await wrapper.find('.user-chip').trigger('click');await flushPromises();await wrapper.findAll('.profile-shortcuts button').find(b=>b.text().includes('我的订单')).trigger('click');await flushPromises();await wrapper.find('.address-row .outline').trigger('click');await flushPromises();expect(api.updateShippingAddress).toHaveBeenCalledWith('addr-1',1,expect.objectContaining({address_line:'新地址',is_default:true}));expect(api.shippingAddresses.mock.calls.length).toBeGreaterThan(2);await wrapper.find('.address-row .danger-button').trigger('click');await flushPromises();expect(api.deleteShippingAddress).toHaveBeenCalledWith('addr-1');wrapper.unmount()
    api.profile.mockResolvedValueOnce({data:{id:'u-1',handle:'admin',display_name:'管理员',role:'admin'}});api.adminOrder.mockResolvedValueOnce({data:{id:'ord-1',user_id:'u-2',status:'fulfilled',items:[],tracking_events:[]}});vi.stubGlobal('prompt',vi.fn().mockReturnValueOnce('in_transit').mockReturnValueOnce('手工更新').mockReturnValueOnce('').mockReturnValueOnce('人工物流更新'));const admin=await render({authenticated:true});await admin.find('.user-chip').trigger('click');await flushPromises();await admin.find('.admin-link').trigger('click');await flushPromises();await admin.findAll('.admin-tabs button')[4].trigger('click');await flushPromises();await admin.find('.admin-orders .order-summary').trigger('click');await flushPromises();await admin.find('.append-tracking').trigger('click');await flushPromises();expect(api.addTrackingEvent).toHaveBeenCalledWith('ord-1',{status:'in_transit',description:'手工更新',location:'',reason:'人工物流更新'});expect(admin.text()).toContain('手工更新');admin.unmount()
  })
  it('resumes an interrupted publish action after login',async()=>{
    api.login.mockResolvedValueOnce({data:{access_token:'a',refresh_token:'r',user:{id:'u-1',handle:'tester',display_name:'测试者'}}});const wrapper=await render();await wrapper.find('.rail-compose').trigger('click');await flushPromises();expect(wrapper.find('[role="dialog"]').text()).toContain('欢迎回来');await wrapper.find('#identity').setValue('tester');await wrapper.find('#password').setValue('secret-pass');await wrapper.find('[role="dialog"] form').trigger('submit');await flushPromises();expect(api.login).toHaveBeenCalledWith('tester','secret-pass');expect(wrapper.find('.composer').exists()).toBe(true);expect(api.categories).toHaveBeenCalled();wrapper.unmount()
  })
  it('retries a failed section loader without adding another history entry',async()=>{
    api.categories.mockRejectedValueOnce(Object.assign(new Error('分类暂时不可用'),{code:'network_error'}));const push=vi.spyOn(history,'pushState');const wrapper=await render();await wrapper.findAll('aside nav button').find(button=>button.text().includes('发现')).trigger('click');await flushPromises();expect(wrapper.find('[role="alert"]').text()).toContain('分类暂时不可用');const calls=push.mock.calls.length;await wrapper.find('.section-retry').trigger('click');await flushPromises();expect(api.categories).toHaveBeenCalledTimes(2);expect(wrapper.find('.category-card-main').exists()).toBe(true);expect(push.mock.calls.length).toBe(calls);push.mockRestore();wrapper.unmount()
  })
  it('ignores a repeated publish submit while the real mutation is pending',async()=>{
    let resolveCreate;api.createPost.mockReturnValueOnce(new Promise(resolve=>{resolveCreate=resolve}));const wrapper=await render({authenticated:true});await wrapper.find('.rail-compose').trigger('click');await flushPromises();await wrapper.find('#draft').setValue('只发布一次');const form=wrapper.find('.composer-form');await form.trigger('submit');await form.trigger('submit');expect(api.createPost).toHaveBeenCalledTimes(1);resolveCreate({data:samplePost()});await flushPromises();wrapper.unmount()
  })
})
