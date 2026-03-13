// ─── Guests Page ──────────────────────────────────────────────

let currentEvent = null;
let allGuests = [];
let allTables = [];
let editingGuestId = null;

// ─── Init ─────────────────────────────────────────────────────
const initGuests = async () => {
  currentEvent = getCurrentEvent();
  if (!currentEvent) {
    globalThis.location.href = "/app/dashboard.html";
    return;
  }

  document.getElementById("eventTitle").textContent = currentEvent.title;

  await Promise.all([loadGuests(), loadTables()]);
};

// ─── Load Guests ──────────────────────────────────────────────
const loadGuests = async () => {
  try {
    const data = await api.get(`/events/${currentEvent.id}/guests`);
    allGuests = data.guests;
    renderGuests(allGuests);
    updateSummary();
  } catch (error) {
    console.error("Eroare la încărcarea invitaților:", error);
  }
};

// ─── Load Tables ──────────────────────────────────────────────
const loadTables = async () => {
  try {
    const data = await api.get(`/events/${currentEvent.id}/tables`);
    allTables = data.tables;
    populateTableDropdowns();
  } catch (error) {
    console.error("Eroare la încărcarea meselor:", error);
  }
};

// ─── Render Guests ────────────────────────────────────────────
const renderGuests = (guests) => {
  const tbody = document.getElementById("guestsTbody");

   if (allGuests.length === 0) {
    summaryBar.style.display = "none";
    filtersBar.style.display = "none";
    tableContainer.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  summaryBar.style.display = "flex";
  filtersBar.style.display = "flex";
  tableContainer.style.display = "block";

  if (guests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty">
          Niciun invitat găsit pentru filtrele selectate.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = guests.map(guest => `
    <tr>
      <td>
        <div class="guest-name">${guest.name}</div>
        ${guest.email ? `<div class="guest-meta">${guest.email}</div>` : ""}
        ${guest.phone ? `<div class="guest-meta">${guest.phone}</div>` : ""}
      </td>
      <td>
        <span class="badge badge-${guest.side}">
          ${translateSide(guest.side)}
        </span>
      </td>
      <td>
        <span class="badge badge-${guest.status}">
          ${translateStatus(guest.status)}
        </span>
      </td>
      <td class="text-center">${guest.member_count}</td>
      <td>${guest.table_id ? getTableName(guest.table_id) : '<span class="text-muted">—</span>'}</td>
      <td>
        <span class="badge ${guest.invitation_sent ? 'badge-sent' : 'badge-not-sent'}">
          ${guest.invitation_sent ? "Trimisă" : "Netrimisă"}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          ${!guest.invitation_sent ? `
            <button class="btn-icon" title="Trimite invitație"
              onclick="sendInvitation(${guest.id}, '${guest.name}')">
              ✉
            </button>
          ` : ""}
          <button class="btn-icon" title="Editează"
            onclick="openEditModal(${guest.id})">
            ✎
          </button>
          <button class="btn-icon btn-icon-danger" title="Șterge"
            onclick="deleteGuest(${guest.id}, '${guest.name}')">
            ✕
          </button>
        </div>
      </td>
    </tr>
  `).join("");
};

// ─── Update Summary ───────────────────────────────────────────
const updateSummary = () => {
  const total = allGuests.reduce((sum, g) => sum + g.member_count, 0);
  const confirmed = allGuests
    .filter(g => g.status === "confirmed")
    .reduce((sum, g) => sum + g.member_count, 0);
  const pending = allGuests
    .filter(g => g.status === "pending")
    .reduce((sum, g) => sum + g.member_count, 0);
  const declined = allGuests
    .filter(g => g.status === "declined")
    .reduce((sum, g) => sum + g.member_count, 0);

  document.getElementById("summaryTotal").textContent = total;
  document.getElementById("summaryConfirmed").textContent = confirmed;
  document.getElementById("summaryPending").textContent = pending;
  document.getElementById("summaryDeclined").textContent = declined;
};

// ─── Filter & Search ──────────────────────────────────────────
const filterGuests = () => {
  const search = document.getElementById("searchInput")
    .value.toLowerCase();
  const status = document.getElementById("filterStatus").value;
  const side = document.getElementById("filterSide").value;

  const filtered = allGuests.filter(guest => {
    const matchSearch = guest.name.toLowerCase().includes(search) ||
      (guest.email && guest.email.toLowerCase().includes(search));
    const matchStatus = !status || guest.status === status;
    const matchSide = !side || guest.side === side;
    return matchSearch && matchStatus && matchSide;
  });

  renderGuests(filtered);
};

// ─── Add Guest Modal ──────────────────────────────────────────
const openAddModal = () => {
  editingGuestId = null;
  document.getElementById("modalTitle").textContent = "Adaugă Invitat";
  document.getElementById("saveGuestBtn").textContent = "Adaugă";
  clearGuestForm();
  hideGuestError();
  document.getElementById("guestModal").style.display = "flex";
};

const openEditModal = (guestId) => {
  editingGuestId = guestId;
  const guest = allGuests.find(g => g.id === guestId);
  if (!guest) return;

  document.getElementById("modalTitle").textContent = "Editează Invitat";
  document.getElementById("saveGuestBtn").textContent = "Salvează";

  // Populate form
  document.getElementById("guestName").value = guest.name;
  document.getElementById("guestEmail").value = guest.email || "";
  document.getElementById("guestPhone").value = guest.phone || "";
  document.getElementById("guestSide").value = guest.side;
  document.getElementById("guestStatus").value = guest.status;
  document.getElementById("guestMemberCount").value = guest.member_count;
  document.getElementById("guestMealPreference").value =
    guest.meal_preference || "";
  document.getElementById("guestSpecialNeeds").value =
    guest.special_needs || "";
  document.getElementById("guestSitWith").value = guest.sit_with || "";
  document.getElementById("guestNotSitWith").value =
    guest.not_sit_with || "";

  hideGuestError();
  document.getElementById("guestModal").style.display = "flex";
};

const closeGuestModal = () => {
  document.getElementById("guestModal").style.display = "none";
  editingGuestId = null;
};

const clearGuestForm = () => {
  document.getElementById("guestName").value = "";
  document.getElementById("guestEmail").value = "";
  document.getElementById("guestPhone").value = "";
  document.getElementById("guestSide").value = "bride";
  document.getElementById("guestStatus").value = "pending";
  document.getElementById("guestMemberCount").value = "1";
  document.getElementById("guestMealPreference").value = "";
  document.getElementById("guestSpecialNeeds").value = "";
  document.getElementById("guestSitWith").value = "";
  document.getElementById("guestNotSitWith").value = "";
};

// ─── Save Guest ───────────────────────────────────────────────
const saveGuest = async () => {
  const name = document.getElementById("guestName").value.trim();
  const email = document.getElementById("guestEmail").value.trim();
  const phone = document.getElementById("guestPhone").value.trim();
  const side = document.getElementById("guestSide").value;
  const status = document.getElementById("guestStatus").value;
  const member_count = parseInt(
    document.getElementById("guestMemberCount").value
  );
  const meal_preference = document.getElementById(
    "guestMealPreference"
  ).value.trim();
  const special_needs = document.getElementById(
    "guestSpecialNeeds"
  ).value.trim();
  const sit_with = document.getElementById("guestSitWith").value.trim();
  const not_sit_with = document.getElementById(
    "guestNotSitWith"
  ).value.trim();

  if (!name) {
    showGuestError("Numele este obligatoriu");
    return;
  }

  const body = {
    name, side, status, member_count,
    ...(email && { email }),
    ...(phone && { phone }),
    ...(meal_preference && { meal_preference }),
    ...(special_needs && { special_needs }),
    ...(sit_with && { sit_with }),
    ...(not_sit_with && { not_sit_with }),
  };

  const saveBtn = document.getElementById("saveGuestBtn");
  saveBtn.disabled = true;

  try {
    if (editingGuestId) {
      await api.put(
        `/events/${currentEvent.id}/guests/${editingGuestId}`,
        body
      );
    } else {
      await api.post(`/events/${currentEvent.id}/guests`, body);
    }
    closeGuestModal();
    await loadGuests();
  } catch (error) {
    showGuestError(error.message);
  } finally {
    saveBtn.disabled = false;
  }
};

// ─── Delete Guest ─────────────────────────────────────────────
const deleteGuest = async (guestId, guestName) => {
  if (!confirm(`Sigur vrei să ștergi invitatul "${guestName}"?`)) return;

  try {
    await api.delete(`/events/${currentEvent.id}/guests/${guestId}`);
    await loadGuests();
  } catch (error) {
    alert("Eroare la ștergerea invitatului: " + error.message);
  }
};

// ─── Send Invitation ──────────────────────────────────────────
const sendInvitation = async (guestId, guestName) => {
  if (!confirm(`Trimiți invitația către "${guestName}"?`)) return;

  try {
    await api.post(
      `/events/${currentEvent.id}/guests/${guestId}/send-invitation`,
      {}
    );
    await loadGuests();
  } catch (error) {
    alert("Eroare la trimiterea invitației: " + error.message);
  }
};

// ─── Table Helpers ────────────────────────────────────────────
const getTableName = (tableId) => {
  const table = allTables.find(t => t.id === tableId);
  return table ? table.name : "—";
};

const populateTableDropdowns = () => {
  // Nothing needed here for now
  // Table assignment is done from tables page
};

// ─── Translate Helpers ────────────────────────────────────────
const translateStatus = (status) => {
  const map = {
    confirmed: "Confirmat",
    pending: "În așteptare",
    declined: "Refuzat",
  };
  return map[status] || status;
};

const translateSide = (side) => {
  const map = {
    bride: "Mireasă",
    groom: "Mire",
    both: "Ambii",
  };
  return map[side] || side;
};

// ─── Error Helpers ────────────────────────────────────────────
const showGuestError = (message) => {
  const el = document.getElementById("guestError");
  el.textContent = message;
  el.style.display = "block";
};

const hideGuestError = () => {
  document.getElementById("guestError").style.display = "none";
};

// ─── Start ────────────────────────────────────────────────────
initGuests();