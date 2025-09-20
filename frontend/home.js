async function init() {
  // 1️⃣ 获取当前登录用户
  const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
  if (userError || !user) {
    alert('请先登录');
    window.location.href = '/index.html';
    return;
  }
  const userId = user.id;

  // 2️⃣ 初次加载用户信息
  await loadUserInfo(userId);

  // 3️⃣ 订阅 Realtime
  window.supabaseClient
    .channel('realtime-user')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      },
      payload => {
        if (payload.new) {
          document.getElementById('account').textContent = payload.new.account ?? '—';
          document.getElementById('coins').textContent   = payload.new.coins ?? 0;
          document.getElementById('balance').textContent = payload.new.balance ?? 0;
        }
      }
    )
    .subscribe();
}

// 单独的函数：加载用户信息
async function loadUserInfo(userId) {
  const { data, error } = await window.supabaseClient
    .from('users')
    .select('coins, balance, account')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('加载用户信息失败:', error);
    alert('加载用户信息失败');
    return;
  }

  document.getElementById('account').textContent = data.account ?? '—';
  document.getElementById('coins').textContent   = data.coins ?? 0;
  document.getElementById('balance').textContent = data.balance ?? 0;
}

// 页面加载完执行
init();
