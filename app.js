// js/app.js
// Simple gallery: loads data/photos.json and renders cards, category filters and a search box.

const galleryRow = document.getElementById('galleryRow');
const categoryButtons = document.getElementById('categoryButtons');
const searchInput = document.getElementById('searchInput');
const noResults = document.getElementById('noResults');

let photos = [];
let currentCategory = 'All';

// fetch the JSON
fetch('data/photos.json')
  .then(resp => resp.json())
  .then(data => {
    photos = data;
    renderCategoryButtons();
    renderGallery();
  })
  .catch(err => {
    galleryRow.innerHTML = `<div class="col-12"><div class="alert alert-danger">Failed to load photos.json — check console.</div></div>`;
    console.error(err);
  });

// create category buttons (unique categories from JSON)
function renderCategoryButtons() {
  const categories = ['All', ...new Set(photos.map(p => p.category || 'Uncategorized'))];
  categoryButtons.innerHTML = categories.map(cat => `
    <button class="btn btn-sm btn-outline-secondary me-1 mb-1 ${cat === 'All' ? 'active' : ''}" data-category="${cat}">
      ${cat}
    </button>
  `).join('');

  // add click listeners
  categoryButtons.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryButtons.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderGallery();
    });
  });
}

// render the gallery based on current filters
function renderGallery() {
  const q = (searchInput.value || '').trim().toLowerCase();

  const filtered = photos.filter(p => {
    const inCategory = currentCategory === 'All' || (p.category || 'Uncategorized') === currentCategory;
    const matchesQuery = q === '' || (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.tags && p.tags.join(' ').toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
    return inCategory && matchesQuery;
  });

  if (filtered.length === 0) {
    galleryRow.innerHTML = '';
    noResults.classList.remove('d-none');
    return;
  } else {
    noResults.classList.add('d-none');
  }

  galleryRow.innerHTML = filtered.map(p => `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="card photo-card h-100">
        <div class="ratio ratio-4x3">
          <img src="${p.thumb || p.url}" loading="lazy" alt="${escapeHtml(p.title)}" class="card-img-top w-100" style="object-fit:cover;cursor:pointer" data-id="${p.id}">
        </div>
        <div class="card-body p-2">
          <h6 class="card-title mb-1" style="font-size:0.95rem">${escapeHtml(p.title)}</h6>
          <p class="card-text text-muted small mb-0">${escapeHtml(p.category || '')}</p>
        </div>
      </div>
    </div>
  `).join('');

  // Add click listener to all images to open modal
  galleryRow.querySelectorAll('img[data-id]').forEach(img => {
    img.addEventListener('click', () => openModal(img.getAttribute('data-id')));
  });
}

// search input listener
searchInput.addEventListener('input', () => renderGallery());

/* Modal logic */
const photoModal = new bootstrap.Modal(document.getElementById('photoModal'), {});
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');

function openModal(id) {
  const p = photos.find(x => String(x.id) === String(id));
  if (!p) return;
  modalImage.src = p.url;
  modalImage.alt = p.title || '';
  modalTitle.textContent = p.title || '';
  modalDesc.textContent = p.description || '';
  photoModal.show();
}

/* small utility to avoid XSS when injecting text into markup */
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}
