// === Chat Widget Script ===
// /public/chat-widget.js
// app.use(express.static('public'))

const CONFIG = {
  backendUrl: "http://localhost:4000/api/chat",
  title: "Admission Assistant For TSEC",
  themeColor: "#8800cc",
  welcomeMessage:
    "Hi! I'm your Admission Assistant Chatbot. How can I help you today?",
};

(function () {
  // === Load Markdown Parser ===
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
  document.head.appendChild(script);

  // Inject CSS
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "/chat-widget.css";
  document.head.appendChild(style);

  // Create chat button
  const button = document.createElement("div");
  button.id = "chatbot-button";
  button.innerHTML = "💬";
  document.body.appendChild(button);

  // Create chat window
  const widget = document.createElement("div");
  widget.id = "chatbot-widget";
  widget.innerHTML = `
    <div class="chat-header" style="background:${CONFIG.themeColor}">
      <span>${CONFIG.title}</span>
      <button id="chatbot-close">×</button>
    </div>
    <div id="chatbot-messages" class="chat-messages"></div>
    <div class="chat-input">
      <input type="text" id="chatbot-input" placeholder="Type your message..." />
      <button id="chatbot-send">➤</button>
    </div>
  `;

  // Optional: Adjust message area height dynamically when resized
  const resizeObserver = new ResizeObserver(() => {
    const headerHeight = widget.querySelector(".chat-header").offsetHeight;
    const inputHeight = widget.querySelector(".chat-input").offsetHeight;
    const messages = widget.querySelector(".chat-messages");
    messages.style.height = `${
      widget.offsetHeight - headerHeight - inputHeight
    }px`;
  });
  resizeObserver.observe(widget);

  document.body.appendChild(widget);

  const chatWindow = document.getElementById("chatbot-widget");
  const messagesDiv = document.getElementById("chatbot-messages");
  const input = document.getElementById("chatbot-input");
  const sendBtn = document.getElementById("chatbot-send");

  // Helper: scroll to bottom
  function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // === Add Bot Message (supports Markdown) ===
  function addBotMessage(text) {
    const msg = document.createElement("div");
    msg.className = "bot-message";

    // Convert markdown to HTML (safe fallback if marked isn't loaded yet)
    if (window.marked) {
      msg.innerHTML = marked.parse(text);
    } else {
      msg.textContent = text;
    }

    messagesDiv.appendChild(msg);
    scrollToBottom();
  }

  // === Add User Message ===
  function addUserMessage(text) {
    const msg = document.createElement("div");
    msg.className = "user-message";
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    scrollToBottom();
  }

  // Toggle chat window
  button.addEventListener("click", () => {
    chatWindow.style.display = "flex";
    button.style.display = "none";
    messagesDiv.innerHTML = "";
    addBotMessage(CONFIG.welcomeMessage);
  });

  document.getElementById("chatbot-close").addEventListener("click", () => {
    chatWindow.style.display = "none";
    button.style.display = "flex";
  });

  // === Send message ===
  async function sendMessage() {
    const userText = input.value.trim();
    if (!userText) return;

    addUserMessage(userText);
    input.value = "";
    addBotMessage("_Typing..._");

    try {
      const res = await fetch(CONFIG.backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();
      messagesDiv.lastChild.remove(); // remove "Typing..."
      addBotMessage(data.reply || "Sorry, I couldn’t understand that.");
    } catch (err) {
      messagesDiv.lastChild.remove();
      addBotMessage("⚠️ Error connecting to the server.");
      console.error(err);
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
