/**
 * MkDocs 站点客户端登录系统
 *
 * 功能：
 *   - 首页无需登录即可浏览
 *   - 其他页面需要登录后才能访问
 *   - 右上角显示登录 / 退出按钮
 *   - 登录弹窗，支持键盘回车提交
 *   - 账号分级：admin（管理员）/ user（普通账户）
 *     普通账户：不显示"维护指南"栏目，不能编辑页面和查看网页源代码
 *
 * 账号管理：python manage_users.py add <用户名> <密码> [角色]
 *
 * 安全说明：
 *   静态站点无后端，这是"客户端认证"，仅提供软门槛保护。
 *   页面 HTML 源码已包含内容，技术用户可通过查看源码绕过。
 *   如需真正的访问控制，请使用服务端认证（Nginx + Flask/FastAPI）。
 */
(function () {
  "use strict";

  // ==================== 配置 ====================
  var STORAGE_KEY = "mkdocs_auth_session";
  var SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 小时过期

  // ==================== 工具函数 ====================

  /** SHA-256 哈希（浏览器 Web Crypto API，回退到纯 JS 实现） */
  function sha256(message) {
    if (crypto && crypto.subtle && crypto.subtle.digest) {
      // 原生 Web Crypto API
      var buf = new TextEncoder().encode(message);
      return crypto.subtle.digest("SHA-256", buf).then(function (hash) {
        return Array.from(new Uint8Array(hash))
          .map(function (b) { return b.toString(16).padStart(2, "0"); })
          .join("");
      });
    }
    // 纯 JS 回退实现
    return Promise.resolve(sha256Pure(message));
  }

  /** 纯 JavaScript SHA-256 实现（用于 crypto.subtle 不可用时） */
  function sha256Pure(message) {
    function rrot(x, n) { return (x >>> n) | (x << (32 - n)); }
    var K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f3ee3,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var bytes = new TextEncoder().encode(message);
    var bitLen = bytes.length * 8;
    // padding
    var padded = [];
    for (var i = 0; i < bytes.length; i++) padded.push(bytes[i]);
    padded.push(0x80);
    while (padded.length % 64 !== 56) padded.push(0);
    var bl = padded.length;
    for (var i2 = 0; i2 < 8; i2++) padded.push((bitLen >>> (56 - i2 * 8)) & 0xff);
    for (var chunk = 0; chunk < padded.length; chunk += 64) {
      var w = new Array(64);
      for (var j = 0; j < 16; j++) {
        w[j] = (padded[chunk+j*4]<<24)|(padded[chunk+j*4+1]<<16)|(padded[chunk+j*4+2]<<8)|(padded[chunk+j*4+3]);
      }
      for (var j2 = 16; j2 < 64; j2++) {
        var s0 = rrot(w[j2-15],7) ^ rrot(w[j2-15],18) ^ (w[j2-15] >>> 3);
        var s1 = rrot(w[j2-2],17) ^ rrot(w[j2-2],19) ^ (w[j2-2] >>> 10);
        w[j2] = (w[j2-16]+s0+w[j2-7]+s1) | 0;
      }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (var t = 0; t < 64; t++) {
        var S1 = rrot(e,6)^rrot(e,11)^rrot(e,25);
        var ch = (e&f)^(~e&g);
        var temp1 = (h+S1+ch+K[t]+w[t])|0;
        var S0 = rrot(a,2)^rrot(a,13)^rrot(a,22);
        var maj = (a&b)^(a&c)^(b&c);
        var temp2 = (S0+maj)|0;
        h=g; g=f; f=e; e=(d+temp1)|0; d=c; c=b; b=a; a=(temp1+temp2)|0;
      }
      H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
      H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
    }
    var hex = "";
    for (var k = 0; k < 8; k++) {
      hex += (H[k]>>>24&0xff).toString(16).padStart(2,"0");
      hex += (H[k]>>>16&0xff).toString(16).padStart(2,"0");
      hex += (H[k]>>>8&0xff).toString(16).padStart(2,"0");
      hex += (H[k]&0xff).toString(16).padStart(2,"0");
    }
    return hex;
  }

  /** 规范化 URL 路径 */
  function normalizePath(urlString) {
    try {
      var url = new URL(urlString, window.location.origin);
      return url.pathname.replace(/\/index\.html$/, "/").replace(/\/+$/, "/");
    } catch (e) {
      return "";
    }
  }

  /** 判断当前页是否为首页 */
  function isHomepage() {
    var logoLink =
      document.querySelector(".md-header__button.md-logo[href]") ||
      document.querySelector(".md-nav--primary .md-nav__link[href]");
    if (!logoLink) return false;
    return normalizePath(logoLink.href) === normalizePath(window.location.href);
  }

  /** 获取 users.json 的 URL */
  function getUsersJsonUrl() {
    var script = document.querySelector('script[src*="auth.js"]');
    if (script) {
      return script.getAttribute("src").replace(/auth\.js(\?.*)?$/, "users.json");
    }
    return "javascripts/users.json";
  }

  // ==================== 会话管理 ====================

  function getSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var session = JSON.parse(raw);
      if (Date.now() - session.timestamp > SESSION_MAX_AGE) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session;
    } catch (e) {
      console.error("[auth] 读取会话失败:", e);
      return null;
    }
  }

  function setSession(username, role) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ username: username, role: role || "user", timestamp: Date.now() })
      );
      return true;
    } catch (e) {
      console.error("[auth] 写入会话失败:", e);
      return false;
    }
  }

  function clearSession() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // ==================== 用户验证 ====================

  var usersCache = null;

  async function loadUsers() {
    if (usersCache) return usersCache;
    try {
      var url = getUsersJsonUrl();
      console.log("[auth] 加载用户数据:", url);
      var resp = await fetch(url);
      if (!resp.ok) {
        console.error("[auth] users.json HTTP 状态:", resp.status);
        return null;
      }
      usersCache = await resp.json();
      console.log("[auth] 用户数据加载成功, 共", usersCache.users.length, "个用户");
      return usersCache;
    } catch (e) {
      console.error("[auth] 加载用户数据失败:", e);
      return null;
    }
  }

  /** 验证账号密码，成功返回用户对象（含角色），失败返回 null */
  async function validateUser(username, password) {
    var data = await loadUsers();
    if (!data || !data.users) return null;
    var user = data.users.find(function (u) { return u.username === username; });
    if (!user) {
      console.log("[auth] 用户不存在:", username);
      return null;
    }
    var hash = await sha256(user.salt + password);
    var ok = hash === user.password_hash;
    console.log("[auth] 验证结果:", ok ? "成功" : "密码错误");
    return ok ? user : null;
  }

  // ==================== 角色权限 ====================

  var RESTRICT_ATTR = "data-auth-hidden";

  /** 是否管理员 */
  function isAdmin(session) {
    return !!(session && session.role === "admin");
  }

  /** 当前页是否属于"维护指南"栏目 */
  function isMaintainPage() {
    return window.location.pathname.indexOf("/maintain/") !== -1;
  }

  /** 获取首页 URL（用于无权限时跳转） */
  function getHomeUrl() {
    var logoLink =
      document.querySelector(".md-header__button.md-logo[href]") ||
      document.querySelector(".md-nav--primary .md-nav__link[href]");
    return logoLink ? logoLink.href : "/";
  }

  /** 普通账户限制：隐藏"维护指南"导航入口和编辑/查看源码按钮 */
  function applyRoleRestrictions() {
    // 隐藏导航中指向 maintain/ 的入口（顶部标签 + 侧边栏目录）
    var links = document.querySelectorAll('a[href*="/maintain/"]');
    links.forEach(function (a) {
      var target = a.closest("li") || a;
      target.style.display = "none";
      target.setAttribute(RESTRICT_ATTR, "1");
    });
    // 隐藏"编辑此页 / 查看源代码"按钮
    var btns = document.querySelectorAll(".md-content__button");
    btns.forEach(function (b) {
      b.style.display = "none";
      b.setAttribute(RESTRICT_ATTR, "1");
    });
  }

  /** 移除普通账户限制（退出登录或切换为管理员时调用） */
  function removeRoleRestrictions() {
    var hidden = document.querySelectorAll("[" + RESTRICT_ATTR + "]");
    hidden.forEach(function (el) {
      el.style.display = "";
      el.removeAttribute(RESTRICT_ATTR);
    });
  }

  // ==================== UI：右上角按钮 ====================

  function renderHeaderButton() {
    var header = document.querySelector(".md-header__inner");
    if (!header) {
      console.warn("[auth] 找不到 .md-header__inner, 延迟重试");
      setTimeout(renderHeaderButton, 200);
      return;
    }

    var old = document.getElementById("auth-widget");
    if (old) old.remove();

    var session = getSession();
    var widget = document.createElement("div");
    widget.id = "auth-widget";
    widget.className = "auth-widget";

    if (session) {
      var nameSpan = document.createElement("span");
      nameSpan.className = "auth-user-name";
      nameSpan.textContent = session.username;

      var roleBadge = document.createElement("span");
      roleBadge.className = isAdmin(session)
        ? "auth-role-badge auth-role-admin"
        : "auth-role-badge auth-role-user";
      roleBadge.textContent = isAdmin(session) ? "管理员" : "普通用户";

      var logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "auth-btn auth-btn-out";
      logoutBtn.textContent = "退出";
      logoutBtn.addEventListener("click", handleLogout);

      widget.appendChild(nameSpan);
      widget.appendChild(roleBadge);
      widget.appendChild(logoutBtn);
    } else {
      var loginBtn = document.createElement("button");
      loginBtn.type = "button";
      loginBtn.className = "auth-btn auth-btn-in";
      loginBtn.textContent = "登录";
      loginBtn.addEventListener("click", openLoginModal);

      widget.appendChild(loginBtn);
    }

    header.appendChild(widget);
  }

  // ==================== UI：登录弹窗 ====================

  function openLoginModal() {
    var existing = document.getElementById("auth-overlay");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.id = "auth-overlay";
    overlay.className = "auth-overlay";

    var card = document.createElement("div");
    card.className = "auth-card";

    var title = document.createElement("h2");
    title.className = "auth-card-title";
    title.textContent = "登录";
    card.appendChild(title);

    var hint = document.createElement("p");
    hint.className = "auth-card-hint";
    hint.textContent = "请输入账号和密码以查看内容";
    card.appendChild(hint);

    // 用 <div> 替代 <form>，彻底杜绝表单提交导致页面刷新
    var formBox = document.createElement("div");
    formBox.className = "auth-form";

    // 账号
    var grp1 = document.createElement("div");
    grp1.className = "auth-field";
    var lbl1 = document.createElement("label");
    lbl1.textContent = "账号";
    lbl1.htmlFor = "auth-input-user";
    var inp1 = document.createElement("input");
    inp1.type = "text";
    inp1.id = "auth-input-user";
    inp1.placeholder = "请输入账号";
    inp1.autocomplete = "username";
    grp1.appendChild(lbl1);
    grp1.appendChild(inp1);
    formBox.appendChild(grp1);

    // 密码
    var grp2 = document.createElement("div");
    grp2.className = "auth-field";
    var lbl2 = document.createElement("label");
    lbl2.textContent = "密码";
    lbl2.htmlFor = "auth-input-pass";
    var inp2 = document.createElement("input");
    inp2.type = "password";
    inp2.id = "auth-input-pass";
    inp2.placeholder = "请输入密码";
    inp2.autocomplete = "current-password";
    grp2.appendChild(lbl2);
    grp2.appendChild(inp2);
    formBox.appendChild(grp2);

    // 错误提示
    var errBox = document.createElement("div");
    errBox.id = "auth-err";
    errBox.className = "auth-err";
    formBox.appendChild(errBox);

    // 按钮行
    var btnRow = document.createElement("div");
    btnRow.className = "auth-btn-row";

    // 登录按钮：type=button，用 click 事件处理，不走 form submit
    var submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "auth-btn auth-btn-go";
    submitBtn.textContent = "登录";
    submitBtn.addEventListener("click", handleLogin);
    btnRow.appendChild(submitBtn);

    // 首页允许取消
    if (isHomepage()) {
      var cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "auth-btn auth-btn-cancel";
      cancelBtn.textContent = "取消";
      cancelBtn.addEventListener("click", closeLoginModal);
      btnRow.appendChild(cancelBtn);
    }

    formBox.appendChild(btnRow);
    card.appendChild(formBox);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    // 回车键提交
    function onEnter(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleLogin();
      }
    }
    inp1.addEventListener("keydown", onEnter);
    inp2.addEventListener("keydown", onEnter);

    setTimeout(function () { inp1.focus(); }, 80);
  }

  function closeLoginModal() {
    var overlay = document.getElementById("auth-overlay");
    if (overlay) overlay.remove();
    document.body.style.overflow = "";
  }

  // ==================== 事件处理 ====================

  async function handleLogin() {
    var userInput = document.getElementById("auth-input-user");
    var passInput = document.getElementById("auth-input-pass");
    var errBox = document.getElementById("auth-err");
    var btn = document.querySelector(".auth-btn-go");

    if (!userInput || !passInput) return;

    var username = userInput.value.trim();
    var password = passInput.value;

    if (!username || !password) {
      if (errBox) errBox.textContent = "请输入账号和密码";
      return;
    }

    if (errBox) errBox.textContent = "";
    if (btn) { btn.disabled = true; btn.textContent = "验证中..."; }

    try {
      var user = await validateUser(username, password);
      if (user) {
        var role = user.role || "user";
        // 普通账户无权访问"维护指南"，登录后跳回首页
        if (role !== "admin" && isMaintainPage()) {
          setSession(user.username, role);
          window.location.replace(getHomeUrl());
          return;
        }
        var saved = setSession(user.username, role);
        if (!saved) {
          if (errBox) errBox.textContent = "会话保存失败，请检查浏览器设置";
          if (btn) { btn.disabled = false; btn.textContent = "登录"; }
          return;
        }
        closeLoginModal();
        revealContent();
        renderHeaderButton();
        removeRoleRestrictions();
        if (role !== "admin") applyRoleRestrictions();
      } else {
        if (errBox) errBox.textContent = "账号或密码错误，请重试";
        passInput.value = "";
        passInput.focus();
      }
    } catch (err) {
      console.error("[auth] 登录异常:", err);
      if (errBox) errBox.textContent = "验证失败: " + (err.message || "未知错误");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "登录"; }
    }
  }

  function handleLogout() {
    clearSession();
    removeRoleRestrictions();
    renderHeaderButton();
    if (!isHomepage()) {
      hideContent();
      openLoginModal();
    }
  }

  // ==================== 内容显示 / 隐藏 ====================

  function hideContent() {
    var content = document.querySelector(".md-content");
    if (content) content.style.display = "none";
    var sidebars = document.querySelectorAll(".md-sidebar");
    sidebars.forEach(function (s) { s.style.display = "none"; });
  }

  function revealContent() {
    var content = document.querySelector(".md-content");
    if (content) content.style.display = "";
    var sidebars = document.querySelectorAll(".md-sidebar");
    sidebars.forEach(function (s) { s.style.display = ""; });
  }

  // ==================== 初始化 ====================

  function init() {
    console.log("[auth] 初始化, homepage=", isHomepage());
    var session = getSession();
    console.log("[auth] 会话:", session ? session.username : "无");

    renderHeaderButton();

    // 普通账户禁止访问"维护指南"栏目，直接跳回首页
    if (session && !isAdmin(session) && isMaintainPage()) {
      console.log("[auth] 普通账户无权访问维护指南，跳转首页");
      window.location.replace(getHomeUrl());
      return;
    }

    if (isHomepage()) {
      revealContent();
    } else {
      if (session) {
        revealContent();
      } else {
        hideContent();
        openLoginModal();
      }
    }

    // 普通账户隐藏维护指南入口和编辑/源码按钮
    if (session && !isAdmin(session)) {
      applyRoleRestrictions();
    }
  }

  // 等 Material 主题 JS 完成后再初始化，避免 header 还没渲染好
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 50);
    });
  } else {
    setTimeout(init, 50);
  }
})();
