// Render backend URL for contacts sheet
const SHEET_URL = 'https://sheets-proxy-backend.onrender.com/contacts';

async function fetchContacts() {
  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();  // parse JSON from Render
    const values = data.values;

    if (!values || values.length < 2) return [];

    // First row contains headers
    const headers = values[0]; 

    // Remaining rows contain contact values
    const contacts = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      for (let j = 0; j < headers.length; j += 2) {
        const name = row[j];
        const phone = row[j + 1];
        const deptHeader = headers[j];
        if (name && phone) {
          // Extract department name from header (e.g., "RESQ NAME" → "RESQ")
          const department = deptHeader.split(' ')[0];
          contacts.push({ name, phone, department });
        }
      }
    }

    return contacts;

  } catch (err) {
    console.error('Error fetching contacts:', err);
    return [];
  }
}

function renderDepartments(contacts) {
  const container = document.getElementById('departments');
  container.innerHTML = ''; // clear previous content

  if (contacts.length === 0) {
    container.innerHTML = '<p>No contacts available.</p>';
    return;
  }

  // Group contacts by department
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
    deptMap[dept].forEach(c => {
      const item = document.createElement('div');
      item.className = 'contact-item';

      const tel = `tel:${c.phone.replace(/\s+/g, '')}`;
      const wa = `https://wa.me/${c.phone.replace(/\D/g,'')}`;

      item.innerHTML = `
        <span class="contact-name">${c.name}</span>
        <div class="contact-icons">
          <a href="${tel}" title="Call ${c.name}" class="icon-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#4CAF50" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.2.48 2.5.74 3.83.74a1 1 0 011 1v3.5a1 1 0 01-1 1A17.91 17.91 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.33.26 2.63.74 3.83a1 1 0 01-.21 1.11l-2.41 2.41z"/>
            </svg>
          </a>
          <a href="${wa}" title="WhatsApp ${c.name}" class="icon-link" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#25D366" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 00-8.64 15.22L2 22l4.95-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.2-1.2l-.3-.2-2.9.8.8-2.9-.2-.3A8 8 0 1112 20zm4.47-5.73c-.26-.13-1.53-.75-1.77-.83s-.41-.13-.58.13-.66.83-.81 1-.3.2-.56.07a6.56 6.56 0 01-1.94-1.2 7.24 7.24 0 01-1.34-1.67c-.14-.25 0-.39.1-.52s.25-.3.37-.46a1.7 1.7 0 00.25-.42.48.48 0 00-.02-.45c-.07-.13-.57-1.36-.78-1.86s-.42-.43-.57-.44h-.48a.92.92 0 00-.67.32A2.79 2.79 0 006.5 9.4a4.85 4.85 0 00.28 1.7c.3.8.9 1.55 1 1.66s1.92 2.9 4.63 3.87a5.33 5.33 0 002.45.5 2.28 2.28 0 001.5-.7 1.9 1.9 0 00.42-1.32c-.06-.12-.24-.2-.5-.34z"/>
            </svg>
          </a>
        </div>
      `;

      list.appendChild(item);
    });
    deptDiv.appendChild(list);

    // Fixed collapse toggle for first-click issue
    header.addEventListener('click', () => {
      const current = window.getComputedStyle(list).display;
      list.style.display = current === 'none' ? 'block' : 'none';
    });

    container.appendChild(deptDiv);
  }
}

// Initialize
fetchContacts().then(renderDepartments);
