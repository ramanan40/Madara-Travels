document.addEventListener("DOMContentLoaded", async () => {
  const chatBody = document.getElementById("chatBody");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  // 🔴 PASTE YOUR GROQ API KEY HERE (starts with gsk_...)
  const API_KEY = "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";

  // ✅ Using Groq API (Llama 3 Model) - Super Fast!
  const API_URL = "https://api.groq.com/openai/v1/chat/completions";

  // --- 1. LOAD WEBSITE DATA ---
  let websiteContext = "You are a helpful travel assistant for Madara Travels.";

  try {
    if (typeof supabase !== 'undefined') {
      const { data: services } = await supabase.from('service').select('*');
      
      if (services && services.length > 0) {
        const serviceList = services.map(s => 
          `- ${s.title} (${s.location}): ${s.description} (Price: ${s.price || 'N/A'})`
        ).join("\n");

        websiteContext = `
          You are the AI assistant for 'Madara Travels'.
          Here is our list of trips:
          ${serviceList}

          Rules:
          1. Only recommend trips from this list.
          2. Keep answers short (max 50 words) and exciting.
          3. If asked to book, say "Click the 'Book Now' button on the card!"
        `;
      }
    }
  } catch (err) {
    console.warn("Supabase skipped.");
  }

  // --- 2. HANDLE MESSAGES ---
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, "user");
    chatInput.value = "";

    const typingIndicator = showTyping();

    try {
      // ✅ GROQ API CALL (Different format than Gemini)
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // The AI Brain
          messages: [
            { role: "system", content: websiteContext }, // Instructions
            { role: "user", content: userMessage }       // User Question
          ],
          temperature: 0.7 // Creativity level
        }),
      });

      const data = await response.json();
      console.log("Groq Response:", data); // Debugging

      typingIndicator.remove();

      if (!response.ok) {
        throw new Error(data.error?.message || "API Error");
      }

      // Extract message from Groq
      const botReply = data.choices[0].message.content;
      addMessage(botReply, "bot");

    } catch (error) {
      typingIndicator.remove();
      console.error("Chat Error:", error);
      addMessage("Oops! Connection error. Check your API Key.", "bot");
    }
  });

  // --- UI Helpers ---
  function addMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);
    
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");
    // Convert newlines to line breaks
    contentDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("message-time");
    const now = new Date();
    timeDiv.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgDiv.appendChild(contentDiv);
    msgDiv.appendChild(timeDiv);
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showTyping() {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", "bot");
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content", "typing-dots");
    contentDiv.innerHTML = "<span></span><span></span><span></span>";
    msgDiv.appendChild(contentDiv);
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return msgDiv;
  }
});