const form = document.getElementById('note-form');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editingIdInput = document.getElementById('editing-id');
const notesList = document.getElementById('notes-list');
const errorEl = document.getElementById('error');
const loadingEl = document.getElementById('loading');

// If deploying frontend separately (e.g. Netlify), set this to your backend URL (no trailing slash).
// Example: 'https://sparkling-vision.up.railway.app'
const API_BASE = 'https://sparkling-vision-production.up.railway.app'; 

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}
function clearError() {
  errorEl.hidden = true;
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderNote(note) {
  const li = document.createElement('li');
  li.className = 'note-card';
  li.innerHTML = `
    <h3>${escapeHtml(note.title)}</h3>
    ${note.content ? `<p>${escapeHtml(note.content)}</p>` : ''}
    <div class="note-meta">${formatDate(note.updated_at)}</div>
    <div class="note-actions">
      <button type="button" class="edit-btn secondary">Edit</button>
      <button type="button" class="delete-btn danger">Delete</button>
    </div>
  `;
  li.querySelector('.edit-btn').onclick = () => {
    editingIdInput.value = note.id;
    titleInput.value = note.title;
    contentInput.value = note.content || '';
    submitBtn.textContent = 'Save';
    cancelBtn.hidden = false;
    titleInput.focus();
  };
  li.querySelector('.delete-btn').onclick = async () => {
    if (!confirm('Delete this note?')) return;
    try {
      await api(`/api/notes/${note.id}`, { method: 'DELETE' });
      loadNotes();
    } catch (e) {
      showError(e.message);
    }
  };
  return li;
}

async function loadNotes() {
  loadingEl.hidden = false;
  clearError();
  try {
    const notes = await api('/api/notes');
    notesList.innerHTML = '';
    if (notes.length === 0) notesList.innerHTML = '<li class="empty-state">No notes yet. Add one above.</li>';
    else notes.forEach((n) => notesList.appendChild(renderNote(n)));
  } catch (e) {
    showError(e.message.includes('fetch') ? 'Start server with "node server.js" and open http://localhost:3000' : e.message);
  } finally {
    loadingEl.hidden = true;
  }
}

cancelBtn.onclick = () => {
  editingIdInput.value = '';
  form.reset();
  submitBtn.textContent = 'Add note';
  cancelBtn.hidden = true;
  clearError();
};

form.onsubmit = async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  const content = contentInput.value.trim();
  const id = editingIdInput.value;
  clearError();
  try {
    if (id) {
      await api(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify({ title, content }) });
      cancelBtn.click();
    } else {
      await api('/api/notes', { method: 'POST', body: JSON.stringify({ title, content: content || '' }) });
      form.reset();
    }
    loadNotes();
  } catch (e) {
    showError(e.message);
  }
};

loadNotes();
