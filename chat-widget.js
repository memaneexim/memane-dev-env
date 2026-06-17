(function() {
  const styles = `
    #ai-chat-btn { position:fixed; bottom:26px; left:26px; z-index:9999; background:#1a2b5f; color:#fff; padding:8px 20px 8px 8px; border-radius:30px; font-weight:700; cursor:pointer; box-shadow:0 4px 15px rgba(0,0,0,0.2); transition:all 0.3s ease; display:flex; align-items:center; gap:10px; font-size:15px; font-family:sans-serif; border:none; line-height:1;}
    #ai-chat-btn:hover { transform:scale(1.05); }
    .ai-btn-avatar { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #7EC8E3; display:block; margin:0; padding:0; }
    
    #ai-chat-window { position:fixed; bottom:90px; left:26px; z-index:9999; width:340px; background:#fff; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.3); display:none; flex-direction:column; overflow:hidden; border:1px solid #dee2e6; font-family:sans-serif; }
    #ai-chat-window.open { display:flex; animation:chatPop 0.3s ease; }
    #ai-chat-window * { box-sizing: border-box; margin: 0; padding: 0; line-height: normal; }
    @keyframes chatPop { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
    
    .ai-chat-head { background:#1a2b5f; color:#fff; padding:15px; display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #7EC8E3; width:100%; }
    .ai-chat-head-left { display:flex; align-items:center; gap:12px; }
    .ai-chat-head-avatar { width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid #7EC8E3; display:block; }
    .ai-chat-head button { background:none; border:none; color:#fff; font-size:24px; cursor:pointer; padding:0; margin:0; line-height:1; }
    
    .ai-chat-body { padding:15px; height:320px; overflow-y:auto; display:flex; flex-direction:column; gap:12px; background:#f4f7f9; width:100%; }
    .ai-msg { padding:12px; border-radius:12px; font-size:14px; max-width:85%; word-wrap:break-word; line-height:1.4; }
    .ai-msg.bot { background:#fff; color:#212529; border:1px solid #dee2e6; align-self:flex-start; border-bottom-left-radius:2px; }
    .ai-msg.user { background:#1a2b5f; color:#fff; align-self:flex-end; border-bottom-right-radius:2px; }
    
    .ai-chat-foot { padding:15px; background:#fff; border-top:1px solid #dee2e6; display:flex; gap:10px; align-items:center; width:100%; }
    #ai-chat-input { flex:1; border:1px solid #dee2e6; border-radius:20px; padding:10px 15px; font-size:14px; outline:none; margin:0; width:100%; background:#fff; color:#212529; }
    #ai-chat-input:focus { border-color:#7EC8E3; }
    .ai-chat-foot button { background:#1a2b5f; color:#fff; border:none; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; font-size:16px; margin:0;}
  `;
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  const avatarUrl = "/kim.jpg";
  
  // The Memory Bank
  let chatHistory = "KIM: Welcome to Memane International. I'm KIM. What commodities are you looking to source today?\n";

  const chatHTML = `
    <button id="ai-chat-btn" onclick="toggleKIMChat()">
      <img src="${avatarUrl}" class="ai-btn-avatar" alt="KIM" onerror="this.src='https://ui-avatars.com/api/?name=KIM&background=0A1520&color=7EC8E3'">
      Chat with KIM
    </button>
    <div id="ai-chat-window">
      <div class="ai-chat-head">
        <div class="ai-chat-head-left">
          <img src="${avatarUrl}" class="ai-chat-head-avatar" alt="KIM" onerror="this.src='https://ui-avatars.com/api/?name=KIM&background=0A1520&color=7EC8E3'">
          <div style="line-height:1.2; text-align:left;">
            <b style="font-size:16px; letter-spacing:0.5px;">KIM</b><br>
            <span style="font-size:10px; color:#7EC8E3; font-weight:700; letter-spacing:1px; text-transform:uppercase;">● Executive Assistant</span>
          </div>
        </div>
        <button onclick="toggleKIMChat()">✕</button>
      </div>
      <div class="ai-chat-body" id="ai-chat-body">
        <div class="ai-msg bot">Welcome to Memane International. I'm KIM. What commodities are you looking to source today?</div>
      </div>
      <div class="ai-chat-foot">
        <input type="text" id="ai-chat-input" placeholder="Type your message..." onkeydown="if(event.key==='Enter')sendKIMChat()">
        <button onclick="sendKIMChat()">➤</button>
      </div>
    </div>
  `;
  const container = document.createElement('div');
  container.innerHTML = chatHTML;
  document.body.appendChild(container);

  window.toggleKIMChat = function() {
    document.getElementById('ai-chat-window').classList.toggle('open');
  };

  window.sendKIMChat = async function() {
    const input = document.getElementById('ai-chat-input');
    const msg = input.value.trim();
    if(!msg) return;
    
    const body = document.getElementById('ai-chat-body');
    
    const udiv = document.createElement('div');
    udiv.className = 'ai-msg user';
    udiv.textContent = msg;
    body.appendChild(udiv);
    
    chatHistory += "Buyer: " + msg + "\n";
    
    input.value = '';
    body.scrollTop = body.scrollHeight;
    
    const ldiv = document.createElement('div');
    ldiv.className = 'ai-msg bot';
    ldiv.textContent = 'Typing...';
    body.appendChild(ldiv);
    body.scrollTop = body.scrollHeight;
    
    try {
      // TOKEN SAVER: Only keep the last 6 lines of conversation
      let historyLines = chatHistory.split('\n').filter(line => line.trim() !== '');
      if (historyLines.length > 6) {
        historyLines = historyLines.slice(historyLines.length - 6);
      }
      let optimizedHistory = historyLines.join('\n');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: optimizedHistory})
      });
      const data = await res.json();
      
      if (data.ok) {
        ldiv.textContent = data.reply;
        chatHistory += "KIM: " + data.reply + "\n";
      } else {
        ldiv.textContent = 'System Error: ' + (data.msg || 'Connection lost.');
      }
    } catch(e) {
      ldiv.textContent = 'Network error detected. Please contact us via WhatsApp.';
    }
    body.scrollTop = body.scrollHeight;
  };

  setTimeout(function() {
    var chatWindow = document.getElementById('ai-chat-window');
    if (chatWindow && !chatWindow.classList.contains('open')) {
      window.toggleKIMChat();
    }
  }, 3000);
})();
