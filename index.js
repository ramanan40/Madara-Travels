document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIG ---
  const navAvatar = document.getElementById("navAvatar");
  const profileDropdown = document.getElementById("profileDropdown");
  const serviceContainer = document.querySelector(".serviceitems");
  const filterButtonContainer = document.querySelector(".filter-buttons");
  const toggleButton = document.getElementById('theme-toggle');
  const backToTopBtn = document.getElementById("backToTop");
  const searchInput = document.getElementById('searchInput');
  const preloader = document.getElementById("preloader");

  // 🔴 WEATHER KEY
  const WEATHER_API_KEY = "74a2639016180d99fdf49579d8607fc2"; 

  // ===================================================
  // 0. PRELOADER FIX
  // ===================================================
  function hidePreloader() {
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 500);
    }
  }
  window.addEventListener("load", hidePreloader);
  setTimeout(hidePreloader, 3000); // Force hide fallback

  /* ===================================================
     1. THEME TOGGLE
     =================================================== */
  function applyTheme(theme) {
      const root = document.documentElement;
      if (theme === 'dark') {
          document.body.classList.add('dark-mode');
          if(toggleButton) toggleButton.innerHTML = '🌙';
      } else {
          document.body.classList.remove('dark-mode');
          if(toggleButton) toggleButton.innerHTML = '☀️';
      }
      localStorage.setItem('theme', theme);
  }
  applyTheme(localStorage.getItem('theme') || 'light');

  if (toggleButton) {
      toggleButton.addEventListener('click', () => {
          const current = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
          applyTheme(current);
      });
  }

  /* ===================================================
     2. NAVBAR & DROPDOWN
     =================================================== */
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      hamburger.classList.toggle("open");
    });
  }
  
  // Close menu on link click
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      if (hamburger) hamburger.classList.remove("open");
    });
  });

  if (navAvatar) {
    navAvatar.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
    });
  }

  document.addEventListener("click", (e) => {
    if (profileDropdown && !profileDropdown.contains(e.target) && navAvatar && !navAvatar.contains(e.target)) {
      profileDropdown.classList.remove("show");
    }
  });

  /* ===================================================
     3. AUTH & USER DATA
     =================================================== */
  const dropdownAvatar = document.getElementById("dropdownAvatar");
  const dropdownName = document.getElementById("dropdownName");
  const dropdownEmail = document.getElementById("dropdownEmail");
  const logoutBtn = document.getElementById("logoutBtn");

  async function loadUserData() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const user = data.session.user;
      if (dropdownName) dropdownName.textContent = user.user_metadata.username || "Traveler";
      if (dropdownEmail) dropdownEmail.textContent = user.email;
      const avatarUrl = user.user_metadata.avatar_url;
      if (avatarUrl && avatarUrl.startsWith("data:image")) {
        if (navAvatar) navAvatar.src = avatarUrl;
        if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
      }
    }
  }
  loadUserData();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      localStorage.removeItem("userData");
      window.location.href = "index.html";
    });
  }

  /* ===================================================
     4. LOAD SERVICES (SEARCH + FILTER + HEARTS)
     =================================================== */
  let currentCategory = "all";
  let currentSearch = "";
  let userFavorites = new Set(); 

  async function initFavorites() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: favs } = await supabase
        .from('favorites')
        .select('service_id')
        .eq('user_id', session.user.id);
      if(favs) favs.forEach(f => userFavorites.add(f.service_id));
    }
    loadServices(); 
  }
  initFavorites();

  async function loadServices() {
    if (!serviceContainer) return;
    serviceContainer.innerHTML = "";

    let query = supabase.from('service').select('*');

    // 1. Filter by Category
    if (currentCategory !== "all") {
  // .ilike ignores case (Adventure = adventure)
// .trim() removes accidental spaces
query = query.ilike('category', currentCategory.trim());
    }
    if (currentSearch.length > 0) {
      // .ilike is Case-Insensitive
      // 2. Apply Search Filter (Logic: Title OR Description OR Location OR Category)
    if (currentSearch.length > 0) {
      // I added 'category.ilike.%${currentSearch}%' at the end
      query = query.or(`title.ilike.%${currentSearch}%,description.ilike.%${currentSearch}%,location.ilike.%${currentSearch}%,category.ilike.%${currentSearch}%`);
    }
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      serviceContainer.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:40px;">No trips found matching "${currentSearch}".</p>`;
      return;
    }

    for (const service of data) {
      const card = document.createElement('div');
      card.className = 'service-card';
      card.setAttribute('data-aos', 'fade-up');

      // Fake Data for Rich Look
      const rating = (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1);
      const days = Math.floor(Math.random() * (7 - 3) + 3);
      const isLiked = userFavorites.has(service.id) ? 'active' : '';

      // Weather
      let weatherBadge = '';
      if (service.location) {
        const w = await fetchWeather(service.location);
        if (w) weatherBadge = `<div class="weather-badge"><img src="${w.icon}"><span>${w.temp}°C</span></div>`;
      }

      card.innerHTML = `
        <div class="badge-container">
          <div class="rating-badge">⭐ ${rating}</div>
          ${weatherBadge ? weatherBadge : `<div class="rating-badge">⏱️ ${days} Days</div>`}
        </div>

        <button class="heart-btn ${isLiked}" onclick="toggleHeart(this, '${service.id}')">
          <i class="fa-solid fa-heart"></i>
        </button>

        <a href="details.html?id=${service.id}">
          <img src="${service.image_url}" alt="${service.title}">
        </a>

        <div class="service-card-content">
          <div class="service-card-title">${service.title}</div>
          <div class="service-card-desc">${service.description}</div>
          <div class="service-action-row">
            <div class="service-card-price">${service.price || 'Check Price'}</div>
            <button class="book-now-btn" data-service-id="${service.id}">
              <span>Book Now</span>
            </button>
          </div>
        </div>
      `;
      serviceContainer.appendChild(card);
    }
    if(typeof AOS !== 'undefined') AOS.refresh();
  }

  // --- WEATHER FETCH ---
  async function fetchWeather(city) {
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API_KEY}`);
      if (!res.ok) return null;
      const data = await res.json();
      return { temp: Math.round(data.main.temp), icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`, desc: data.weather[0].main };
    } catch (err) { return null; }
  }

  // --- LISTENERS: FILTER BUTTONS ---
  if(filterButtonContainer) {
    filterButtonContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        // Reset Buttons
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Set Category, Clear Search Input (Optional UX choice)
        currentCategory = e.target.dataset.category;
        currentSearch = ""; 
        if(searchInput) searchInput.value = ""; 
        
        loadServices();
      }
    });
  }

  // --- LISTENERS: SEARCH INPUT ---
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      currentSearch = val;
      
      // ** SMART FIX: If searching, reset category to ALL so we search everything **
      if (val.length > 0 && currentCategory !== 'all') {
         currentCategory = 'all';
         // Update button UI
         document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.category === 'all') btn.classList.add('active');
         });
      }
      loadServices();
    });
  }

  /* ===================================================
     VOICE SEARCH (Jarvis Mode)
     =================================================== */
  const voiceBtn = document.getElementById('voiceBtn');
  
  if (voiceBtn) {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('listening')) recognition.stop();
        else recognition.start();
      });

      recognition.onstart = () => {
        voiceBtn.classList.add('listening');
        if(searchInput) searchInput.placeholder = "Listening... Speak now...";
      };

      recognition.onend = () => {
        voiceBtn.classList.remove('listening');
        if(searchInput) searchInput.placeholder = "Where do you want to go?...";
      };

      recognition.onresult = (event) => {
        let transcript = event.results[0][0].transcript;
        // Remove trailing periods from voice text
        transcript = transcript.replace(/\.$/, ""); 
        console.log("Voice heard:", transcript);
        
        if (searchInput) {
          searchInput.value = transcript;
          currentSearch = transcript.trim();
          
          // ** SMART FIX: Reset category on voice search too **
          currentCategory = 'all';
          document.querySelectorAll('.filter-btn').forEach(btn => {
             btn.classList.remove('active');
             if(btn.dataset.category === 'all') btn.classList.add('active');
          });
          
          loadServices();
        }
      };
    } else {
      voiceBtn.style.display = 'none';
    }
  }

  // --- HEART TOGGLE ---
  window.toggleHeart = async (btn, serviceId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Swal.fire("Login Required", "Please log in to save trips.", "warning");
      return;
    }
    btn.classList.add('animating');
    setTimeout(() => btn.classList.remove('animating'), 300);
    const id = parseInt(serviceId);
    if (userFavorites.has(id)) {
      btn.classList.remove('active');
      userFavorites.delete(id);
      await supabase.from('favorites').delete().match({ user_id: session.user.id, service_id: id });
    } else {
      btn.classList.add('active');
      userFavorites.add(id);
      await supabase.from('favorites').insert([{ user_id: session.user.id, service_id: id }]);
    }
  };

  // --- BOOKING CLICK ---
  if (serviceContainer) {
    serviceContainer.addEventListener('click', async (e) => {
      const bookButton = e.target.closest('.book-now-btn');
      if (bookButton) {
        const serviceId = bookButton.dataset.serviceId;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          Swal.fire("Login Required", "You must be logged in to book.", "warning");
          return;
        }
        window.location.href = `payment.html?id=${serviceId}`;
      }
    });
  }

  // --- NEWSLETTER ---
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      Swal.fire({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
        icon: 'success', title: 'Subscribed successfully!'
      });
      document.getElementById('newsletterEmail').value = "";
    });
  }
  
  // --- ANIMATE STATS & BACK TO TOP ---
  // (These remain the same as your previous file, adding them here for completeness)
  const stats = document.querySelectorAll('.stat-number');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const end = parseInt(target.innerText.replace(/\D/g,''));
        const suffix = target.innerText.replace(/[0-9]/g,'');
        let start = 0;
        let timer = setInterval(() => {
          start += end / 50;
          if (start >= end) { target.innerText = end + suffix; clearInterval(timer); }
          else target.innerText = Math.floor(start) + suffix;
        }, 20);
        observer.unobserve(target);
      }
    });
  });
  stats.forEach(s => observer.observe(s));
  
  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) backToTopBtn.classList.add("visible");
      else backToTopBtn.classList.remove("visible");
    });
    backToTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});