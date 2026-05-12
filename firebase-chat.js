// ================= FIREBASE REAL-TIME CHAT =================
// Uses Firebase Compat (v8-style) CDN — works on file:// AND http://

// Firebase is loaded via <script> tags in HTML (compat version)
// Those tags must appear BEFORE this script in your HTML

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "campus-reshare.firebaseapp.com",
  databaseURL: "https://campus-reshare-default-rtdb.firebaseio.com",
  projectId: "campus-reshare",
  storageBucket: "campus-reshare.appspot.com",
  messagingSenderId: "182045823730",
  appId: "1:182045823730:web:..."
};

// Init only once
if(!firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ── State ──
let currentChatUser     = "";
let currentChatItemName = "";
let chatListener        = null;   // holds .off() ref to avoid duplicate listeners

// ── Open chat popup ──
window.openChat = function(phone, itemName){
  currentChatUser     = phone;
  currentChatItemName = itemName || "";

  const chatBox = document.getElementById("chatBox");
  if(!chatBox){ console.error("chatBox element missing!"); return; }

  const title = document.getElementById("chatTitle");
  if(title) title.innerText = "Chat about: " + currentChatItemName;

  chatBox.style.display = "flex";

  // Remove previous listener
  if(chatListener){ chatListener.off(); chatListener = null; }

  listenMessages();

  setTimeout(() => {
    const inp = document.getElementById("chatInput");
    if(inp) inp.focus();
  }, 150);
};

// ── Close chat popup ──
window.closeChat = function(){
  const chatBox = document.getElementById("chatBox");
  if(chatBox) chatBox.style.display = "none";
  if(chatListener){ chatListener.off(); chatListener = null; }
};

// ── Send a message ──
window.sendMessage = function(){
  const input = document.getElementById("chatInput");
  if(!input || !input.value.trim()) return;

  const sender  = localStorage.getItem("user");
  const roomKey = getRoomKey(sender, currentChatUser, currentChatItemName);

  db.ref("chats/" + roomKey).push({
    message:   input.value.trim(),
    sender:    sender,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });

  input.value = "";
};

// ── Listen for new messages in real time ──
function listenMessages(){
  const currentUser = localStorage.getItem("user");
  const roomKey     = getRoomKey(currentUser, currentChatUser, currentChatItemName);
  const ref         = db.ref("chats/" + roomKey);

  chatListener = ref;   // store so we can .off() later

  ref.on("value", function(snapshot){
    const box = document.getElementById("chatMessages");
    if(!box) return;

    box.innerHTML = "";

    if(!snapshot.exists()){
      box.innerHTML = "<p class='chat-empty'>No messages yet. Say hello!</p>";
      return;
    }

    snapshot.forEach(function(child){
      const c    = child.val();
      const isMe = c.sender === currentUser;

      let timeStr = "";
      if(c.timestamp){
        timeStr = new Date(c.timestamp).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
      }

      const msg = document.createElement("div");
      msg.className = isMe ? "my-msg" : "other-msg";
      msg.innerHTML = "<div>" + escHtml(c.message) + "</div><small class='msg-time'>" + timeStr + "</small>";
      box.appendChild(msg);
    });

    box.scrollTop = box.scrollHeight;
  });
}

// ── Room key: sorted so A<->B share same room ──
function getRoomKey(a, b, item){
  const safeItem = (item || "general").toLowerCase().replace(/[^a-z0-9]/g,"_").substring(0,30);
  const parts    = [san(a), san(b)].sort().join("__");
  return safeItem + "__" + parts;
}
function san(s){ return (s||"x").replace(/[.#$\[\]@]/g,"_"); }
function escHtml(t){
  return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Enter key sends message ──
document.addEventListener("keydown", function(e){
  if(e.key === "Enter"){
    const chatBox = document.getElementById("chatBox");
    if(chatBox && chatBox.style.display === "flex") window.sendMessage();
  }
});