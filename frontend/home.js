// 读取当前登录用户
async function loadUserInfo() {
  const { data: { user }, error: userError } = await window.supabase.auth.getUser();
  if (userError || !user) {
    // 未登录则跳转到登录页
    alert('请先登录');
    window.location.href = '/index.html';
    return;
  }

  // 根据 auth.users 的 id 去查询 public.users 表
  const { data, error } = await window.supabase
    .from('users')
    .select('coins, balance, account')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('加载用户信息失败:', error);
    alert('加载用户信息失败');
    return;
  }

  // 显示到页面
  document.getElementById('account').textContent = data.account ?? '—';
  document.getElementById('coins').textContent   = data.coins ?? 0;
  document.getElementById('balance').textContent = data.balance ?? 0;
}

// 页面加载完执行
loadUserInfo();
