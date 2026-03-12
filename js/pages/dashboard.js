// ─── Dashboard Page ───────────────────────────────────────────

let currentUser = null;
let currentEvent = null;

// ─── Init ─────────────────────────────────────────────────────
const initDashboard = async () => {
  try {
    const data = await api.get("/auth/me");
    currentUser = data.user;

    // Update username in sidebar
    document.getElementById("username").textContent = currentUser.username;

    if (data.events.length === 0) {
      showNoEvent();
    } else {
      // Use first event for now
      // Later user can switch between events
      currentEvent = data.events[0];
      setCurrentEvent(currentEvent);
      showDashboard();
    }
  } catch (error) {
    console.error("Eroare la încărcarea panoului:", error);
  }
};

// ─── Show No Event ────────────────────────────────────────────
const showNoEvent = () => {
  document.getElementById("noEventSection").style.display = "flex";
  document.getElementById("dashboardSection").style.display = "none";
};

// ─── Show Dashboard ───────────────────────────────────────────
const showDashboard = async () => {
  document.getElementById("noEventSection").style.display = "none";
  document.getElementById("dashboardSection").style.display = "block";

  // Set event title and type
  document.getElementById("eventTitle").textContent = currentEvent.title;
  document.getElementById("eventType").textContent = currentEvent.type;
  document.getElementById("eventDate").textContent = formatDate(currentEvent.date);
  document.getElementById("eventVenue").textContent = 
    `${currentEvent.venue}, ${currentEvent.city}`;

  // Load stats
  await loadStats();
};

// ─── Load Stats ───────────────────────────────────────────────
const loadStats = async () => {
  try {
    const data = await api.get(`/events/${currentEvent.id}/dashboard`);

    // Guests
    document.getElementById("statTotalPeople").textContent = 
      data.guests.total_people;
    document.getElementById("statConfirmed").textContent = 
      data.guests.confirmed;
    document.getElementById("statPending").textContent = 
      data.guests.pending;
    document.getElementById("statDeclined").textContent = 
      data.guests.declined;

    // Tables
    document.getElementById("statTables").textContent = 
      data.tables.total;
    document.getElementById("statOccupied").textContent = 
      data.tables.occupied_spots;
    document.getElementById("statAvailable").textContent = 
      data.tables.available_spots;

    // Todos
    document.getElementById("statTodoTotal").textContent = 
      data.todos.total;
    document.getElementById("statTodoDone").textContent = 
      data.todos.done;
    document.getElementById("statTodoOverdue").textContent = 
      data.todos.overdue;

    // Songs
    document.getElementById("statSongs").textContent = 
      data.songs.total_requests;

    // Progress bar for todos
    const todoProgress = data.todos.total > 0
      ? Math.round((data.todos.done / data.todos.total) * 100)
      : 0;
    document.getElementById("todoProgress").style.width = `${todoProgress}%`;
    document.getElementById("todoProgressText").textContent = 
      `${todoProgress}% complete`;

    // Days until event
    const daysLeft = getDaysUntilEvent(currentEvent.date);
    document.getElementById("daysLeft").textContent = daysLeft;
    document.getElementById("daysLeftLabel").textContent = 
      daysLeft === 1 ? "zi rămasă" : "zile rămase";

  } catch (error) {
    console.error("Eroare la încărcarea statisticilor:", error);
  }
};

// ─── Helpers ──────────────────────────────────────────────────
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getDaysUntilEvent = (dateString) => {
  const today = new Date();
  const eventDate = new Date(dateString);
  const diff = eventDate - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── Create Event Modal ───────────────────────────────────────
const showCreateEventModal = () => {
  document.getElementById("createEventModal").style.display = "flex";
};

const hideCreateEventModal = () => {
  document.getElementById("createEventModal").style.display = "none";
};

const handleCreateEvent = async () => {
  const type = document.getElementById("eventTypeSelect").value;
  const title = document.getElementById("eventTitleInput").value.trim();
  const date = document.getElementById("eventDateInput").value;
  const venue = document.getElementById("eventVenueInput").value.trim();
  const city = document.getElementById("eventCityInput").value.trim();

  // Type specific fields
  const bride_name = document.getElementById("brideNameInput")?.value.trim();
  const groom_name = document.getElementById("groomNameInput")?.value.trim();
  const child_name = document.getElementById("childNameInput")?.value.trim();
  const parent_name = document.getElementById("parentNameInput")?.value.trim();
  const person_name = document.getElementById("personNameInput")?.value.trim();

  if (!type || !title || !date || !venue || !city) {
    showCreateError("Completează toate câmpurile obligatorii");
    return;
  }

  const body = { type, title, date, venue, city };

  if (type === "wedding") {
    if (!bride_name || !groom_name) {
      showCreateError("Introdu numele miresei și mirelui");
      return;
    }
    body.bride_name = bride_name;
    body.groom_name = groom_name;
  }

  if (type === "baptism") {
    if (!child_name || !parent_name) {
      showCreateError("Introdu numele copilului și al părinților");
      return;
    }
    body.child_name = child_name;
    body.parent_name = parent_name;
  }

  if (type === "birthday") {
    if (!person_name) {
      showCreateError("Introdu numele persoanei sărbătorite");
      return;
    }
    body.person_name = person_name;
  }

  const createBtn = document.getElementById("createEventBtn");
  createBtn.disabled = true;
  createBtn.textContent = "Se creează....";

  try {
    const data = await api.post("/events", body);
    currentEvent = data.event;
    setCurrentEvent(currentEvent);
    hideCreateEventModal();
    showDashboard();
  } catch (error) {
    showCreateError(error.message);
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = "Creează Eveniment";
  }
};

const showCreateError = (message) => {
  const el = document.getElementById("createEventError");
  el.textContent = message;
  el.style.display = "block";
};

// Show/hide type specific fields
const handleEventTypeChange = () => {
  const type = document.getElementById("eventTypeSelect").value;

  document.getElementById("weddingFields").style.display =
    type === "wedding" ? "block" : "none";
  document.getElementById("baptismFields").style.display =
    type === "baptism" ? "block" : "none";
  document.getElementById("birthdayFields").style.display =
    type === "birthday" ? "block" : "none";
};

// ─── Start ────────────────────────────────────────────────────
initDashboard();