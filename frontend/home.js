import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 替换为你的 Supabase 项目参数
const SUPABASE_URL = 'https://xxxx.supabase.co'
const SUPABASE_KEY = 'public-anon-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 页面加载后执行
document.addEventListener('DOMContentLoaded', loadUserInfo)

async function loadUserInfo() {
  // 1️⃣ 获取当前登录用户
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    alert('请先登录')
    location.href = '/index.html'
    return
  }

  // 2️⃣ 查询扩展表 users
  const { data, error } = await supabase
    .from('users')
    .select('coins, balance, account')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('加载用户信息失败:', error)
    alert('加载用户信息失败')
    return
  }

  // 3️⃣ 初次渲染
  renderUser(data)

  // 4️⃣ 订阅 Realtime 更新
  supabase
    .channel('realtime-user')
    .on(
      'postgres_changes',
      {
        event: '*',              // 监听 INSERT / UPDATE / DELETE
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user.id}` // 只监听当前登录用户
      },
      payload => {
        // 这里的 payload.new 就是最新数据
        if (payload.new) {
          renderUser(payload.new)
        }
      }
    )
    .subscribe()
}

// 渲染到页面
function renderUser(row) {
  document.getElementById('account').textContent = row.account ?? '—'
  document.getElementById('coins').textContent   = row.coins   ?? 0
  document.getElementById('balance').textContent = row.balance ?? 0
}
