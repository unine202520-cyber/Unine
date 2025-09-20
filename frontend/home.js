// home.js
async function loadUserInfo() {
  const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
  if (userError || !user) {
    alert('请先登录');
    window.location.href = '/index.html';
    return;
  }

  const { data, error } = await window.supabaseClient
    .from('users')
    .select('coins, balance, account')
    .eq('id', user.id)
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
loadUserInfo();

// 订阅 Realtime（假设已在 Supabase 控制台开启）
window.supabaseClient
  .channel('realtime-user')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'users',
      filter: `id=eq.${(await window.supabaseClient.auth.getUser()).data.user.id}`
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
