// ─── Tables Page ──────────────────────────────────────────────

let currentEvent = null;
let allTables = [];
let editingTableId = null;

// ─── Init ─────────────────────────────────────────────────────
const initTables = async () => {
  currentEvent = getCurrentEvent();
  if (!currentEvent) {
    globalThis.location.href = "/app/dashboard.html";
    return;
  }

  document.getElementById("eventTitle").textContent = currentEvent.title;
  await loadTables();
};

// ─── Load Tables ──────────────────────────────────────────────
const loadTables = async () => {
  try {
    const data = await api.get(`/events/${currentEvent.id}/tables`);
    allTables = data.tables;
    renderTables();
    updateSummary();
  } catch (error) {
    console.error("Eroare la încărcarea meselor:", error);
  }
};

// ─── Render Tables ────────────────────────────────────────────
const renderTables = () => {
  const container = document.getElementById("tablesGrid");
  const emptyState = document.getElementById("emptyState");

  if (allTables.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  container.style.display = "grid";

  container.innerHTML = allTables.map(table => {
    const occupiedPercent = table.capacity > 0
      ? Math.round((table.occupied_spots / table.capacity) * 100)
      : 0;

    const statusClass = occupiedPercent === 100
      ? "table-card-full"
      : occupiedPercent > 70
        ? "table-card-almost"
        : "table-card-available";

    return `
      <div class="table-card ${statusClass}">
        <div class="table-card-header">
          <span class="table-card-name">${table.name}</span>
          <div class="action-buttons">
            <button class="btn-icon" title="Editează"
              onclick="openEditModal(${table.id})">✎</button>
            <button class="btn-icon btn-icon-danger" title="Șterge"
              onclick="deleteTable(${table.id}, '${table.name}')">✕</button>
          </div>
        </div>

        <div class="table-capacity-bar">
          <div class="table-capacity-fill" 
            style="width: ${occupiedPercent}%"></div>
        </div>

        <div class="table-card-stats">
          <span class="table-spots">
            <strong>${table.occupied_spots}</strong> / ${table.capacity} locuri
          </span>
          <span class="table-available 
            ${table.capacity - table.occupied_spots === 0 
              ? 'text-error' : 'text-success'}">
            ${table.capacity - table.occupied_spots} libere
          </span>
        </div>

        ${table.guests && table.guests.length > 0 ? `
          <div class="table-guests-list">
            ${table.guests.map(g => `
              <div class="table-guest-item">
                <span>${g.name}</span>
                <span class="text-muted">${g.member_count} pers.</span>
              </div>
            `).join("")}
          </div>
        ` : `
          <div class="table-no-guests">
            Niciun invitat asignat
          </div>
        `}
      </div>
    `;
  }).join("");
};

// ─── Update Summary ───────────────────────────────────────────
const updateSummary = () => {
  const totalTables = allTables.length;
  const totalCapacity = allTables.reduce((s, t) => s + t.capacity, 0);
  const occupiedSpots = allTables.reduce((s, t) => s + t.occupied_spots, 0);
  const availableSpots = totalCapacity - occupiedSpots;

  document.getElementById("summaryTables").textContent = totalTables;
  document.getElementById("summaryCapacity").textContent = totalCapacity;
  document.getElementById("summaryOccupied").textContent = occupiedSpots;
  document.getElementById("summaryAvailable").textContent = availableSpots;
};

// ─── Add/Edit Modal ───────────────────────────────────────────
const openAddModal = () => {
  editingTableId = null;
  document.getElementById("modalTitle").textContent = "Adaugă Masă";
  document.getElementById("saveTableBtn").textContent = "Adaugă";
  document.getElementById("tableName").value = "";
  document.getElementById("tableCapacity").value = "8";
  hideTableError();
  document.getElementById("tableModal").style.display = "flex";
};

const openEditModal = (tableId) => {
  editingTableId = tableId;
  const table = allTables.find(t => t.id === tableId);
  if (!table) return;

  document.getElementById("modalTitle").textContent = "Editează Masă";
  document.getElementById("saveTableBtn").textContent = "Salvează";
  document.getElementById("tableName").value = table.name;
  document.getElementById("tableCapacity").value = table.capacity;
  hideTableError();
  document.getElementById("tableModal").style.display = "flex";
};

const closeTableModal = () => {
  document.getElementById("tableModal").style.display = "none";
  editingTableId = null;
};

// ─── Save Table ───────────────────────────────────────────────
const saveTable = async () => {
  const name = document.getElementById("tableName").value.trim();
  const capacity = parseInt(document.getElementById("tableCapacity").value);

  if (!name) {
    showTableError("Numele mesei este obligatoriu");
    return;
  }

  if (!capacity || capacity < 1) {
    showTableError("Capacitatea trebuie să fie cel puțin 1");
    return;
  }

  const saveBtn = document.getElementById("saveTableBtn");
  saveBtn.disabled = true;

  try {
    if (editingTableId) {
      await api.put(
        `/events/${currentEvent.id}/tables/${editingTableId}`,
        { name, capacity }
      );
    } else {
      await api.post(`/events/${currentEvent.id}/tables`, { name, capacity });
    }
    closeTableModal();
    await loadTables();
  } catch (error) {
    showTableError(error.message);
  } finally {
    saveBtn.disabled = false;
  }
};

// ─── Delete Table ─────────────────────────────────────────────
const deleteTable = async (tableId, tableName) => {
  if (!confirm(`Sigur vrei să ștergi masa "${tableName}"?`)) return;

  try {
    await api.delete(`/events/${currentEvent.id}/tables/${tableId}`);
    await loadTables();
  } catch (error) {
    alert("Eroare: " + error.message);
  }
};

// ─── Error Helpers ────────────────────────────────────────────
const showTableError = (message) => {
  const el = document.getElementById("tableError");
  el.textContent = message;
  el.style.display = "block";
};

const hideTableError = () => {
  document.getElementById("tableError").style.display = "none";
};

// ─── Start ────────────────────────────────────────────────────
initTables();