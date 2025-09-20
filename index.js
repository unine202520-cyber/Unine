// Tab 切换
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

// 密码显示切换
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (target.type === 'password') {
      target.type = 'text';
    } else {
      target.type = 'password';
    }
  });
});

// 登录
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById('loginMsg').innerText = error.message;
    return;
  }
  localStorage.setItem('currentUserUUID', data.user.id);
  localStorage.setItem('currentUser', data.user.email);
  window.location.href = 'home.html';
});

// 注册
document.getElementById('registerBtn').addEventListener('click', async () => {
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;
  const agree = document.getElementById('agreeTerms').checked;
  const msg = document.getElementById('registerMsg');

  msg.innerText = '';

  if (!agree) return msg.innerText = 'You must agree to the terms';
  if (password !== confirm) return msg.innerText = 'Passwords do not match';

  const { data, error } = await window.supabase.auth.signUp({ email, password });
  if (error) return msg.innerText = error.message;

  // 插入 users 表
  const { error: userError } = await window.supabase.from('users').insert([{ id: data.user.id, coins: 0, balance: 0 }]);
  if (userError) return msg.innerText = userError.message;

  msg.innerText = 'Registration successful! Please verify your email and login.';
});
