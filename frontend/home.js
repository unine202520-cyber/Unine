// frontend/home.js
// 依赖：window.supabase 已由 ../supabaseClient.js 初始化（即 window.supabase = supabase.createClient(...)）

(async function() {
  // 等待 supabase 对象就绪（通常已就绪，因为加载顺序受控）
  if (typeof window.supabase === 'undefined') {
    console.error('supabase 未就绪：请确认 ../supabaseClient.js 已正确加载且在此脚本之前。');
    return;
  }

  // 获取当前登录用户
  const { data: userData, error: userErr } = await window.supabase.auth.getUser();
  const user = userData?.user ?? null;
  if (userErr || !user) {
    // 未登录，跳回首页登录页
    alert('请先登录');
    window.location.href = '/index.html';
    return;
  }
  const userId = user.id;

  // DOM 元素
  const accountEl = document.getElementById('account');
  const coinsEl   = document.getElementById('coins');
  const balanceEl = document.getElementById('balance');
  const logoutBtn = document.getElementById('logoutBtn');

  // 渲染函数（把 numeric/string 都安全显示）
  function renderRow(row) {
    accountEl.textContent = row?.account ?? '—';
    // numeric 在 Postgres 里通常以字符串返回，尽量显示原样或转为数字
    coinsEl.textContent   = (row?.coins === null || row?.coins === undefined) ? '0' : String(row.coins);
    balanceEl.textContent = (row?.balance === null || row?.balance === undefined) ? '0' : String(row.balance);
  }

  // 初次加载用户扩展数据
  async function loadUserInfo() {
    const { data, error } = await window.supabase
      .from('users')
      .select('coins, balance, account')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('加载用户信息失败:', error);
      accountEl.textContent = '—';
      coinsEl.textContent = '0';
      balanceEl.textContent = '0';
      return;
    }
    renderRow(data);
  }

  await loadUserInfo(); // 首次加载

  // 订阅 realtime 更新（只监听当前用户行）
  const channel = window.supabase
    .channel(`user_${userId}`) // 自定义频道名（任意）
    .on(
      'postgres_changes',
      {
        event: '*',           // 可改为 'UPDATE'，此处监听所有变化
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      },
      (payload) => {
        // payload.new 包含最新行数据
        if (payload && payload.new) {
          renderRow(payload.new);
          console.info('Realtime update received for user:', payload.new);
        }
      }
    );

  // 订阅（可以 await）
  try {
    await channel.subscribe();
    console.info('Subscribed to realtime changes for users id=', userId);
  } catch (e) {
    console.error('订阅 realtime 失败：', e);
  }

  // 退出登录处理：登出、清本地信息、移除订阅并跳回首页
  logoutBtn.addEventListener('click', async () => {
    try {
      await window.supabase.auth.signOut();
    } catch (e) {
      console.warn('signOut 出错（可以忽略）', e);
    }

    // 取消订阅
    try {
      await window.supabase.removeChannel(channel);
    } catch (e) {
      // 如果 removeChannel 不可用（旧版），尝试 channel.unsubscribe()
      try { channel.unsubscribe(); } catch (e2) {}
    }

    // 清本地登录痕迹（如果你之前有存）
    localStorage.removeItem('currentUserUUID');
    localStorage.removeItem('currentUser');

    window.location.href = '/index.html';
  });

  // 页面卸载时清理订阅（防止泄漏）
  window.addEventListener('beforeunload', async () => {
    try {
      await window.supabase.removeChannel(channel);
    } catch (e) {
      try { channel.unsubscribe(); } catch (e2) {}
    }
  });
})();
