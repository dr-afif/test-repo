// -----------------------------
// contacts.js
// -----------------------------

// Backend + snapshot URLs
const SHEET_URL = 'https://sheets-proxy-backend.onrender.com/contacts';
const SNAPSHOT_URL = 'https://raw.githubusercontent.com/dr-afif/hsaas-oncallroster/main/contacts-snapshot.json';

const LOADING_TIMEOUT_MS = 60000;

// -----------------------------
// Loading animation
// -----------------------------
function showLoading(timeoutMessage = null) {
  const container = document.getElementById('departments');
  container.innerHTML = `
    <div class="loader-wrapper" style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:50vh;">
      <div class="loader">
        <div>
          <ul>
            ${Array(7).fill(`
              <li>
                <svg fill="currentColor" viewBox="0 0 90 120">
                  <path d="M90,0 L90,120 L11,120 C4.9,120 0,115.07 0,109 L0,11 C0,4.92 4.92,0 11,0 L90,0 Z 
                  M71.5,81 L18.5,81 C17.12,81 16,82.12 16,83.5 C16,84.83 17.03,85.91 18.34,85.99 
                  L18.5,86 L71.5,86 C72.88,86 74,84.88 74,83.5 C74,82.17 72.97,81.09 71.66,81.00 L71.5,81 Z 
                  M71.5,57 L18.5,57 C17.12,57 16,58.12 16,59.5 C16,60.82 17.03,61.91 18.34,61.99 
                  L18.5,62 L71.5,62 C72.88,62 74,60.88 74,59.5 C74,58.12 72.88,57 71.5,57 Z 
                  M71.5,33 L18.5,33 C17.12,33 16,34.12 16,35.5 C16,36.82 17.03,37.91 18.34,37.99 
                  L18.5,38 L71.5,38 C72.88,38 74,36.88 74,35.5 C74,34.12 72.88,33 71.5,33 Z"></path>
                </svg>
              </li>
            `).join('')}
          </ul>
        </div>
        <span>Loading</span>
      </div>
    </div>
  `;

  if (timeoutMessage) {
    setTimeout(() => {
      const stillLoading = container.querySelector('.loader');
      if (stillLoading) {
        container.innerHTML = `<p style="text-align:center;">⚠️ ${timeoutMessage}</p>`;
      }
    }, LOADING_TIMEOUT_MS);
  }
}

// -----------------------------
// LocalStorage caching
// -----------------------------
function getCachedData(key) {
  const item = localStorage.getItem(key);
  if (!item) return null;
  try {
    const parsed = JSON.parse(item);
    const age = Date.now() - parsed.timestamp;
    if (age > 86400000) { // 24h
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function setCachedData(key, data) {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}

// -----------------------------
// Fetch contacts (cache → snapshot → live backend)
// -----------------------------
// -----------------------------
// Fetch contacts (cache → snapshot → live backend)
// -----------------------------
async function fetchContacts() {
  showLoading("Still loading contacts... please check your connection.");

  // 1. Cached data
  const cached = getCachedData('contactsData');
  if (cached) {
    renderDepartments(cached.data);
    updateDataSource(`Cached (${new Date(cached.timestamp).toLocaleString()})`);
    return; // ✅ stop here, cached is already valid
  }

  // 2. Snapshot fallback
  let snapshotUsed = false;
  try {
    const snapshotRes = await fetch(SNAPSHOT_URL);
    if (snapshotRes.ok) {
      const snapshotData = await snapshotRes.json();
      const contacts = snapshotData.contacts || snapshotData;
      if (contacts && contacts.length > 0) {
        renderDepartments(contacts);
        updateDataSource("Snapshot (GitHub)");
        setCachedData('contactsData', contacts);
        snapshotUsed = true;
      }
    }
  } catch (e) {
    console.warn("No snapshot available", e);
  }

  // 3. Live backend fetch
  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    const contacts = data.contacts || data;
    if (contacts && contacts.length > 0) {
      renderDepartments(contacts);
      updateDataSource(`Live (${new Date().toLocaleString()})`);
      setCachedData('contactsData', contacts);
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
    if (!snapshotUsed) {
      // ❌ no snapshot either → show fallback message
      const container = document.getElementById('departments');
      container.innerHTML = `<p style="text-align:center;">⚠️ Failed to load contacts (no backend, no snapshot available).</p>`;
      updateDataSource("❌ Failed");
    }
  }
}


// -----------------------------
// Update data source status
// -----------------------------
function updateDataSource(message) {
  const el = document.getElementById('data-source-b');
  if (el) el.innerHTML = `⏳ Data Source: ${message}`;
}

// -----------------------------
// Render departments and contacts
// -----------------------------
function renderDepartments(contacts) {
  const container = document.getElementById('departments');
  container.innerHTML = ''; // clear loader

  if (!contacts || contacts.length === 0) {
    container.innerHTML = '<p>No contacts available.</p>';
    return;
  }

  const deptMap = {};
  contacts.forEach(c => {
    if (!deptMap[c.department]) deptMap[c.department] = [];
    deptMap[c.department].push(c);
  });

  for (const dept in deptMap) {
    const deptDiv = document.createElement('div');
    deptDiv.className = 'department';

    const header = document.createElement('div');
    header.className = 'department-header';
    header.innerHTML = `<span>${dept}</span><span>▼</span>`;
    deptDiv.appendChild(header);

    const list = document.createElement('div');
    list.className = 'contacts-list';
    list.style.display = 'none';

    deptMap[dept].forEach(c => {
      const item = document.createElement('div');
      item.className = 'contact-item';

      const tel = `tel:${c.phone.replace(/\s+/g, '')}`;
      const wa = `https://wa.me/6${c.phone.replace(/\D/g,'')}`;

      item.innerHTML = `
        <span class="contact-name">${c.name}</span>
        <div class="contact-icons">
              <a href="${tel}" title="Call ${name}" class="icon-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#4CAF50" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.2.48 2.5.74 3.83.74a1 1 0 011 1v3.5a1 1 0 01-1 1A17.91 17.91 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.33.26 2.63.74 3.83a1 1 0 01-.21 1.11l-2.41 2.41z"/>
                </svg>
              </a>
              <a href="${wa}" title="WhatsApp ${name}" class="icon-link" target="_blank">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#25D366" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 00-8.64 15.22L2 22l4.95-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.2-1.2l-.3-.2-2.9.8.8-2.9-.2-.3A8 8 0 1112 20zm4.47-5.73c-.26-.13-1.53-.75-1.77-.83s-.41-.13-.58.13-.66.83-.81 1-.3.2-.56.07a6.56 6.56 0 01-1.94-1.2 7.24 7.24 0 01-1.34-1.67c-.14-.25 0-.39.1-.52s.25-.3.37-.46a1.7 1.7 0 00.25-.42.48.48 0 00-.02-.45c-.07-.13-.57-1.36-.78-1.86s-.42-.43-.57-.44h-.48a.92.92 0 00-.67.32A2.79 2.79 0 006.5 9.4a4.85 4.85 0 00.28 1.7c.3.8.9 1.55 1 1.66s1.92 2.9 4.63 3.87a5.33 5.33 0 002.45.5 2.28 2.28 0 001.5-.7 1.9 1.9 0 00.42-1.32c-.06-.12-.24-.2-.5-.34z"/>
                </svg>
              </a>
            </div>
      `;
      list.appendChild(item);
    });

    header.addEventListener('click', () => {
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });

    deptDiv.appendChild(list);
    container.appendChild(deptDiv);
  }
}

// -----------------------------
// Init
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  fetchContacts();
});
