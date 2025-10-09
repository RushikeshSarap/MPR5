// === Chat Widget Script ===
// Place this file in /public/chat-widget.js
// and serve it statically via Express: app.use(express.static('public'))

const CONFIG = {
  backendUrl: "http://localhost:4000/api/chat", // 🔗 Replace with your backend endpoint
  title: "Admission Assistant 🤖",
  themeColor: "#0066cc",
  welcomeMessage: "Hi! I'm your Admission Assistant. How can I help you today?",
};

(function () {
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
  document.body.appendChild(widget);

  const chatWindow = document.getElementById("chatbot-widget");
  const messagesDiv = document.getElementById("chatbot-messages");
  const input = document.getElementById("chatbot-input");
  const sendBtn = document.getElementById("chatbot-send");

  // Show welcome message
  function addBotMessage(text) {
    const msg = document.createElement("div");
    msg.className = "bot-message";
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function addUserMessage(text) {
    const msg = document.createElement("div");
    msg.className = "user-message";
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
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

  // Send message
  async function sendMessage() {
    const userText = input.value.trim();
    if (!userText) return;

    addUserMessage(userText);
    input.value = "";
    addBotMessage("Typing...");

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