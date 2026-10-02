const avatars = ['林','木','山','陈']
export const demoPosts = [
  { id:'p1', author:{name:'林野',handle:'linye'}, age:'2 小时', content:'大家现在最常用的自托管评论系统是什么？', comments:23,reposts:4,likes:56,views:'1.2K',liked:false },
  { id:'p2', author:{name:'木棉',handle:'mumian'}, age:'4 小时', content:'今天把新社区的通知逻辑终于理顺了。✨', comments:12,reposts:3,likes:89,views:'2.1K',liked:false },
  { id:'p3', author:{name:'山河',handle:'shanhe'}, age:'6 小时', content:'傍晚沿河走了一圈，风里已经有秋天的味道。', comments:28,reposts:6,likes:173,views:'3.6K',liked:false, media:true, mediaAlt:'暖色夕阳下的河岸、城市与大桥插画' },
  { id:'p4', author:{name:'陈墨',handle:'chenmo'}, age:'8 小时', content:'周末一起做个小型 game jam，有人来吗？', comments:42,reposts:7,likes:96,views:'4.8K',liked:false, repostedBy:'夜航船' }
].map((p,i)=>({...p, avatar:avatars[i]}))
export const demoComments = [{id:'c1',author:{name:'海风',handle:'haifeng'},content:'我最近在试 Isso，部署挺轻。',age:'1 小时'},{id:'c2',author:{name:'小屿',handle:'xiaoyu'},content:'如果要统一登录，建议把 SSO 一起评估。',age:'45 分钟'}]
