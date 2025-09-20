// --- Tab 切换 ---
const showLogin = document.getElementById('showLogin');
const showRegister = document.getElementById('showRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

showLogin.addEventListener('click', () => {
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  showLogin.classList.add('active');
  showRegister.classList.remove('active');
});

showRegister.addEventListener('click', () => {
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  showRegister.classList.add('active');
  showLogin.classList.remove('active');
});

// --- 登录 ---
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const msg = document.getElementById('loginMsg');
  msg.innerText = '';

  if (!email || !password) {
    msg.innerText = '请输入邮箱和密码';
    return;
  }

  const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
  if (error) {
    msg.innerText = error.message;
    return;
  }

  // 保存用户信息
  localStorage.setItem('currentUserUUID', data.user.id);
  localStorage.setItem('currentUser', data.user.email);

  // 跳转主页
  window.location.href = 'frontend/hoem.html';
});

// --- 注册 ---
document.getElementById('registerBtn').addEventListener('click', async () => {
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const confirm = document.getElementById('regConfirmPassword').value.trim();
  const agree = document.getElementById('agreeTerms').checked;
  const msg = document.getElementById('registerMsg');
  msg.innerText = '';

  if (!agree) return msg.innerText = '请先同意条款';
  if (!email || !password) return msg.innerText = '请输入邮箱和密码';
  if (password !== confirm) return msg.innerText = '两次输入的密码不一致';

  // 1. 注册 Supabase Auth 用户
  const { data, error } = await window.supabase.auth.signUp({ email, password });
  if (error) return msg.innerText = error.message;

  // 2. 插入扩展 users 表（coins/balance 初始为0）
  const userId = data.user?.id;
  if (userId) {
    const { error: userError } = await window.supabase
      .from('users')
      .insert([{ id: userId, coins: 0, balance: 0 }]);
    if (userError) return msg.innerText = '注册成功但写入扩展表失败：' + userError.message;
  }

  msg.style.color = 'green';
  msg.innerText = '注册成功！请前往邮箱验证后再登录。';
});
