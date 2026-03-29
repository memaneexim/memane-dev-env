(function() {
  // 1. Inject the CSS into the page
  const styles = `
    #ai-chat-btn { position:fixed; bottom:26px; left:26px; z-index:888; background:linear-gradient(135deg, var(--navy, #1a2b5f), #0A1520); color:#fff; padding:6px 18px 6px 6px; border-radius:30px; font-weight:700; cursor:pointer; box-shadow:0 0 20px rgba(52, 152, 219, 0.4); transition:all 0.3s ease; display:flex; align-items:center; gap:10px; font-size:0.9rem; border:1px solid rgba(126, 200, 227, 0.3); font-family:inherit;}
    #ai-chat-btn:hover { transform:scale(1.05); box-shadow:0 0 25px rgba(52, 152, 219, 0.6); }
    .ai-btn-avatar { width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid #7EC8E3; background:#000; }
    
    #ai-chat-window { position:fixed; bottom:90px; left:26px; z-index:889; width:350px; background:#fff; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.3); display:none; flex-direction:column; overflow:hidden; border:1px solid #dee2e6; transform-origin:bottom left; animation:chatPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); font-family:inherit;}
    #ai-chat-window.open { display:flex; }
    @keyframes chatPop { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
    
    .ai-chat-head { background:linear-gradient(135deg, var(--navy, #1a2b5f), #0A1520); color:#fff; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #7EC8E3; }
    .ai-chat-head-left { display:flex; align-items:center; gap:12px; }
    .ai-chat-head-avatar { width:46px; height:46px; border-radius:50%; object-fit:cover; border:2px solid #7EC8E3; box-shadow: 0 0 10px rgba(126, 200, 227, 0.5); background:#000;}
    .ai-chat-head button { background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer; line-height:1; opacity:0.8; transition:opacity 0.2s; }
    .ai-chat-head button:hover { opacity:1; color:#7EC8E3; }
    
    .ai-chat-body { padding:16px; height:340px; overflow-y:auto; display:flex; flex-direction:column; gap:14px; background:#f4f7f9; }
    .ai-msg { padding:12px 14px; border-radius:12px; font-size:0.85rem; max-width:85%; line-height:1.5; position:relative; }
    .ai-msg.bot { background:#fff; color:#212529; border:1px solid #dee2e6; align-self:flex-start; border-bottom-left-radius:2px; box-shadow:0 2px 4px rgba(0,0,0,0.03); }
    .ai-msg.user { background:var(--navy, #1a2b5f); color:#fff; align-self:flex-end; border-bottom-right-radius:2px; box-shadow:0 2px 6px rgba(26, 43, 95, 0.25); }
    
    .ai-chat-foot { padding:14px; background:#fff; border-top:1px solid #dee2e6; display:flex; gap:8px; }
    #ai-chat-input { flex:1; border:1px solid #dee2e6; border-radius:20px; padding:10px 16px; font-size:0.85rem; outline:none; transition:border 0.2s; }
    #ai-chat-input:focus { border-color:#7EC8E3; box-shadow:0 0 0 3px rgba(126, 200, 227, 0.2); }
    .ai-chat-foot button { background:var(--navy, #1a2b5f); color:#7EC8E3; border:none; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s; }
    .ai-chat-foot button:hover { background:#0A1520; transform:scale(1.05); }
    
    @media(max-width:768px) { #ai-chat-window { left:16px; right:16px; width:auto; bottom:80px; } #ai-chat-btn { left:16px; bottom:16px; } }
  `;
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  // High-res futuristic AI Core Avatar
  const avatarUrl = "https://images.unsplash.com/photo-1614729939124-03290b56c9ce?w=200&h=200&fit=crop";

  // 2. Inject the HTML into the page
  const chatHTML = `
    <div id="ai-chat-btn" onclick="toggleNovaChat()">
      <img src="${avatarUrl}" class="ai-btn-avatar" alt="KIM AI">
      Initialize KIM AI
    </div>
    <div id="ai-chat-window">
      <div class="ai-chat-head">
        <div class="ai-chat-head-left">
          <img src="${avatarUrl}" class="ai-chat-head-avatar" alt="KIM AI">
          <div style="line-height:1.3;">
            <b style="font-size:1.05rem; letter-spacing:0.5px;">KIM v1.0</b><br>
            <span style="font-size:0.65rem; color:#7EC8E3; font-weight:700; letter-spacing:1px; text-transform:uppercase;">● System Online</span>
          </div>
        </div>
        <button onclick="toggleNovaChat()">✕</button>
      </div>
      <div class="ai-chat-body" id="ai-chat-body">
        <div class="ai-msg bot">System online. Hello, I am KIM—the Artificial Intelligence Export Specialist for Memane International. How can I accelerate your global sourcing today?</div>
      </div>
      <div class="ai-chat-foot">
        <input type="text" id="ai-chat-input" placeholder="Initialize query..." onkeydown="if(event.key==='Enter')sendNovaChat()">
        <button onclick="sendNovaChat()">➤</button>
      </div>
    </div>
  `;
  const container = document.createElement('div');
  container.innerHTML = chatHTML;
  document.body.appendChild(container);

  // 3. Logic & Functions attached to global window
  window.toggleNovaChat = function() {
    document.getElementById('ai-chat-window').classList.toggle('open');
  };

  window.sendNovaChat = async function() {
    const input = document.getElementById('ai-chat-input');
    const msg = input.value.trim();
    if(!msg) return;
    
    const body = document.getElementById('ai-chat-body');
    
    // Add user message
    const udiv = document.createElement('div');
    udiv.className = 'ai-msg user';
    udiv.textContent = msg;
    body.appendChild(udiv);
    
    input.value = '';
    body.scrollTop = body.scrollHeight;
    
    // Show Loading
    const ldiv = document.createElement('div');
    ldiv.className = 'ai-msg bot';
    ldiv.innerHTML = '<span style="color:#7EC8E3; font-weight:bold;">Processing...</span>';
    body.appendChild(ldiv);
    body.scrollTop = body.scrollHeight;
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: msg})
      });
      const data = await res.json();
      
      if (data.ok) {
        ldiv.textContent = data.reply;
      } else {
        // Detailed error for debugging
        ldiv.textContent = 'System Error: ' + (data.msg || 'Connection lost.');
      }
    } catch(e) {
      ldiv.textContent = 'Network error detected. Please contact us via WhatsApp.';
    }
    body.scrollTop = body.scrollHeight;
  };

  // Auto-open chat after 3 seconds
  setTimeout(function() {
    var chatWindow = document.getElementById('ai-chat-window');
    if (chatWindow && !chatWindow.classList.contains('open')) {
      window.toggleNovaChat();
    }
  }, 3000);

})();
