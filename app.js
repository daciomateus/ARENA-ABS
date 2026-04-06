const quadras = ['A', 'B', 'S', 'E'];
const horarios = [17, 18, 19, 20, 21, 22];
const diasReservaPermitidos = [1, 2, 3, 4, 5, 6];
const pendingSelectionKey = 'arena-abs-pending-selection';
const bookingsTable = 'reservas';
const syncIntervalMs = 10000;

const weekRangeEl = document.querySelector('#week-range');
const scheduleGrid = document.querySelector('#schedule-grid');
const mobileDayStrip = document.querySelector('#mobile-day-strip');
const mobileSchedule = document.querySelector('#mobile-schedule');
const selectedSlotTitle = document.querySelector('#selected-slot-title');
const selectedSlotPrice = document.querySelector('#selected-slot-price');
const slotDetails = document.querySelector('#slot-details');
const selectionList = document.querySelector('#selection-list');
const bookingSummary = document.querySelector('#booking-summary');
const cancelBookingButton = document.querySelector('#cancel-booking');
const continueBookingButton = document.querySelector('#continue-booking');
const formMessage = document.querySelector('#form-message');
const prevWeekButton = document.querySelector('#prev-week');
const nextWeekButton = document.querySelector('#next-week');
const courtFilter = document.querySelector('#court-filter');
const todayIndicator = document.querySelector('#today-indicator');
const availabilitySummary = document.querySelector('#availability-summary');
const bookingDrawer = document.querySelector('#booking-drawer');
const closeDrawerButton = document.querySelector('#close-drawer');

let currentStartDate = normalizeDate(new Date());
let selectedMobileDate = normalizeDate(new Date());
let selectedReservation = null;
let selectedCourtFilter = 'all';
let pendingSelections = [];
let bookingsCache = [];
let syncTimer = null;

function normalizeBookingRow(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    court: row.court,
    hour: Number(row.hour),
    price: Number(row.price),
    datetime: row.datetime
  };
}

function serializeBooking(booking) {
  return {
    id: booking.id,
    customer_name: booking.customerName,
    phone: booking.phone,
    court: booking.court,
    hour: booking.hour,
    price: booking.price,
    datetime: booking.datetime
  };
}

async function fetchBookings() {
  const { data, error } = await window.supabaseClient
    .from(bookingsTable)
    .select('*')
    .order('datetime', { ascending: true });

  if (error) {
    throw error;
  }

  bookingsCache = (data || []).map(normalizeBookingRow);
}

async function insertBookings(bookings) {
  const payload = bookings.map(serializeBooking);
  const { data, error } = await window.supabaseClient
    .from(bookingsTable)
    .insert(payload)
    .select();

  if (error) {
    throw error;
  }

  bookingsCache = (data || []).map(normalizeBookingRow).concat(
    bookingsCache.filter((existing) => !payload.some((item) => item.id === existing.id))
  );
}

async function removeBooking(id) {
  const { error } = await window.supabaseClient
    .from(bookingsTable)
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  bookingsCache = bookingsCache.filter((booking) => booking.id !== id);
}

function savePendingSelections() {
  localStorage.setItem(pendingSelectionKey, JSON.stringify(pendingSelections));
}

function normalizeDate(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function isBookableDay(date) {
  return diasReservaPermitidos.includes(date.getDay());
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatDateLong(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function formatDayShort(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

function formatPrice(price) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getSlotPrice(hour) {
  return hour <= 17 ? 60 : 70;
}

function buildSlotDate(date, hour) {
  const slotDate = new Date(date);
  slotDate.setHours(hour, 0, 0, 0);
  return slotDate;
}

function getBookingId(date, hour, court) {
  const isoDate = new Date(date);
  isoDate.setHours(0, 0, 0, 0);
  return `${isoDate.toISOString().slice(0, 10)}-${hour}-${court}`;
}

function getVisibleDays() {
  const days = [];
  let cursor = new Date(currentStartDate);

  while (days.length < 7) {
    if (isBookableDay(cursor)) {
      days.push(new Date(cursor));
    }

    cursor = addDays(cursor, 1);
  }

  return days;
}

function syncSelectedMobileDate(visibleDays) {
  if (!visibleDays.some((day) => isSameDay(day, selectedMobileDate))) {
    selectedMobileDate = new Date(visibleDays[0]);
  }
}

function getVisibleCourts() {
  return selectedCourtFilter === 'all' ? quadras : [selectedCourtFilter];
}

function canCancelBooking(booking) {
  const now = new Date();
  const bookingDate = new Date(booking.datetime);
  return bookingDate.getTime() - now.getTime() >= 60 * 60 * 1000;
}

function isPastSlot(date, hour) {
  return buildSlotDate(date, hour).getTime() < new Date().getTime();
}

function findBooking(date, hour, court) {
  const id = getBookingId(date, hour, court);
  return bookingsCache.find((booking) => booking.id === id);
}

function getPendingSelectionIndex(slotId) {
  return pendingSelections.findIndex((selection) => selection.id === slotId);
}

function isPendingSelection(slotId) {
  return getPendingSelectionIndex(slotId) >= 0;
}

function getPendingTotal() {
  return pendingSelections.reduce((total, selection) => total + selection.price, 0);
}

function openDrawer() {
  bookingDrawer.classList.add('booking-drawer--open');
}

function closeDrawer() {
  bookingDrawer.classList.remove('booking-drawer--open');
}

function clearPendingSelections() {
  pendingSelections = [];
  localStorage.removeItem(pendingSelectionKey);
}

function resetInteractionState(options = {}) {
  const { keepFilter = true } = options;
  selectedReservation = null;
  clearPendingSelections();
  bookingDrawer.dataset.mode = 'empty';
  selectedSlotTitle.textContent = 'Selecione um ou mais horarios';
  selectedSlotPrice.textContent = 'R$ 0,00';
  slotDetails.textContent = 'Clique em um horario disponivel para adicionar a reserva. Voce pode combinar varias horas e quadras antes de confirmar.';
  slotDetails.className = 'slot-details empty-state';
  selectionList.innerHTML = '';
  selectionList.classList.add('hidden');
  bookingSummary.classList.add('hidden');
  bookingSummary.innerHTML = '';
  continueBookingButton.classList.add('hidden');
  cancelBookingButton?.classList.add('hidden');
  formMessage.textContent = '';
  bookingDrawer.dataset.mode = 'empty';
  closeDrawer();

  if (!keepFilter) {
    selectedCourtFilter = 'all';
    courtFilter.value = 'all';
  }
}

function renderHeaderInfo() {
  const visibleDays = getVisibleDays();
  const today = normalizeDate(new Date());
  syncSelectedMobileDate(visibleDays);
  weekRangeEl.textContent = `${formatDate(visibleDays[0])} - ${formatDate(visibleDays[visibleDays.length - 1])}`;
  todayIndicator.textContent = `Comecando em: ${formatDateLong(visibleDays[0])}`;
  prevWeekButton.disabled = currentStartDate.getTime() <= today.getTime();
}

function renderAvailabilitySummary() {
  const visibleDays = getVisibleDays();
  const visibleCourts = getVisibleCourts();

  availabilitySummary.innerHTML = visibleCourts
    .map((court) => {
      const freeSlots = visibleDays.reduce((total, date) => {
        const availableInDay = horarios.filter((hour) => !findBooking(date, hour, court) && !isPastSlot(date, hour)).length;
        return total + availableInDay;
      }, 0);

      return `
        <article class="availability-card">
          <strong>Quadra ${court}</strong>
          <span>${freeSlots} horarios livres</span>
        </article>
      `;
    })
    .join('');
}

function getSlotVisualState({ booking, pending, pastSlot }) {
  if (booking) return 'reserved';
  if (pending) return 'pending';
  if (pastSlot) return 'past';
  return 'available';
}

function getSlotStatusMarkup(state) {
  const labels = {
    reserved: 'Reservado',
    pending: 'Selecionado',
    past: 'Encerrado',
    available: 'Disponivel'
  };

  return `<span class="slot-status slot-status--${state}">${labels[state]}</span>`;
}

function renderDesktopSchedule() {
  const visibleDays = getVisibleDays();
  const visibleCourts = getVisibleCourts();
  const today = normalizeDate(new Date());
  scheduleGrid.innerHTML = '';

  scheduleGrid.insertAdjacentHTML('beforeend', '<div class="grid-cell grid-cell--header">Quadra / Dia</div>');
  visibleDays.forEach((date) => {
    const todayClass = isSameDay(date, today) ? 'grid-cell--today' : '';
    scheduleGrid.insertAdjacentHTML('beforeend', `<div class="grid-cell grid-cell--header ${todayClass}">${formatDateLong(date)}</div>`);
  });

  visibleCourts.forEach((court) => {
    scheduleGrid.insertAdjacentHTML('beforeend', `<div class="grid-cell grid-cell--court">Quadra ${court}</div>`);

    visibleDays.forEach((date) => {
      const slotsMarkup = horarios
        .map((hour) => {
          const booking = findBooking(date, hour, court);
          const id = getBookingId(date, hour, court);
          const pending = isPendingSelection(id);
          const reservedSelected = selectedReservation?.id === id;
          const pastSlot = isPastSlot(date, hour);
          const state = getSlotVisualState({ booking, pending, pastSlot });
          const selectedClass = reservedSelected || pending ? 'slot-card--selected' : '';
          const price = getSlotPrice(hour);
          const customerLine = booking ? 'Reservado' : pending ? 'Pronto para finalizar' : pastSlot ? 'Horario encerrado' : 'Livre para reserva';

          return `
            <button class="slot-card slot-card--${state} ${selectedClass}" type="button" data-slot-id="${id}" data-date="${date.toISOString()}" data-hour="${hour}" data-court="${court}">
              ${getSlotStatusMarkup(state)}
              <strong>${hour}h</strong>
              <span>${customerLine}</span>
              <small>${booking ? formatPrice(booking.price) : formatPrice(price)}</small>
            </button>
          `;
        })
        .join('');

      scheduleGrid.insertAdjacentHTML('beforeend', `<div class="grid-cell grid-cell--slots ${isSameDay(date, today) ? 'grid-cell--today-column' : ''}">${slotsMarkup}</div>`);
    });
  });
}

function renderMobileDayStrip() {
  const visibleDays = getVisibleDays();
  syncSelectedMobileDate(visibleDays);

  mobileDayStrip.innerHTML = visibleDays
    .map((date) => {
      const activeClass = isSameDay(date, selectedMobileDate) ? 'mobile-day-chip--active' : '';
      return `
        <button class="mobile-day-chip ${activeClass}" type="button" data-mobile-day="${date.toISOString()}">
          <strong>${formatDayShort(date)}</strong>
          <span>${formatDate(date)}</span>
        </button>
      `;
    })
    .join('');
}

function renderMobileSchedule() {
  const visibleCourts = getVisibleCourts();
  const activeDate = new Date(selectedMobileDate);

  mobileSchedule.innerHTML = visibleCourts
    .map((court) => {
      const freeSlots = horarios.filter((hour) => !findBooking(activeDate, hour, court) && !isPastSlot(activeDate, hour)).length;
      const slots = horarios
        .map((hour) => {
          const booking = findBooking(activeDate, hour, court);
          const id = getBookingId(activeDate, hour, court);
          const pending = isPendingSelection(id);
          const reservedSelected = selectedReservation?.id === id;
          const pastSlot = isPastSlot(activeDate, hour);
          const state = getSlotVisualState({ booking, pending, pastSlot });
          const selectedClass = reservedSelected || pending ? 'mobile-slot-card--selected' : '';
          const supportText = booking ? 'Reservado' : pending ? 'Pronto para finalizar' : pastSlot ? 'Horario encerrado' : 'Toque para adicionar';

          return `
            <button class="mobile-slot-card mobile-slot-card--${state} ${selectedClass}" type="button" data-slot-id="${id}" data-date="${activeDate.toISOString()}" data-hour="${hour}" data-court="${court}">
              <div class="mobile-slot-card__row">
                <strong>${hour}h as ${hour + 1}h</strong>
                ${getSlotStatusMarkup(state)}
              </div>
              <span>${supportText}</span>
              <small>${booking ? formatPrice(booking.price) : formatPrice(getSlotPrice(hour))}</small>
            </button>
          `;
        })
        .join('');

      return `
        <section class="mobile-group">
          <div class="mobile-group__header">
            <h3>Quadra ${court}</h3>
            <span>${freeSlots} horarios livres</span>
          </div>
          <div class="mobile-slots">${slots}</div>
        </section>
      `;
    })
    .join('');
}

function renderSelectionList() {
  if (!pendingSelections.length) {
    selectionList.innerHTML = '';
    selectionList.classList.add('hidden');
    return;
  }

  const orderedSelections = [...pendingSelections].sort((first, second) => {
    const firstTime = buildSlotDate(first.date, first.hour).getTime();
    const secondTime = buildSlotDate(second.date, second.hour).getTime();
    return firstTime - secondTime;
  });

  selectionList.innerHTML = orderedSelections
    .map((selection) => `
      <article class="selection-item" title="${formatDateLong(selection.date)}">
        <strong>${selection.hour}h</strong>
        <span>${selection.court}</span>
      </article>
    `)
    .join('');

  selectionList.classList.remove('hidden');
}

function renderReservedState() {
  const booking = selectedReservation.booking;

  bookingDrawer.dataset.mode = 'reserved';
  selectedSlotTitle.textContent = `Quadra ${selectedReservation.court} - ${selectedReservation.hour}h`;
  selectedSlotPrice.textContent = formatPrice(booking.price);
  slotDetails.className = 'slot-details';
  slotDetails.innerHTML = `
    <strong>Horario reservado</strong><br>
    Data: ${formatDateLong(new Date(booking.datetime))}<br>
    Status: indisponivel para nova reserva
  `;

  selectionList.classList.add('hidden');
  selectionList.innerHTML = '';
  bookingSummary.classList.remove('hidden');
  bookingSummary.innerHTML = `
    <strong>Status</strong>
    <span>Esse horario ja esta reservado.</span>
    <span>O cliente cancela pelo proprio link e o admin cancela pela area administrativa.</span>
  `;
  continueBookingButton.classList.add('hidden');
  cancelBookingButton?.classList.add('hidden');
  formMessage.textContent = 'Para cancelar, use o link pessoal da reserva ou a area admin.';
  openDrawer();
}

function renderPendingState() {
  selectedSlotTitle.textContent = pendingSelections.length === 1
    ? '1 horario selecionado'
    : `${pendingSelections.length} horarios selecionados`;
  selectedSlotPrice.textContent = formatPrice(getPendingTotal());
  slotDetails.className = 'slot-details';
  slotDetails.textContent = 'Horarios escolhidos:';
  renderSelectionList();
  bookingSummary.classList.remove('hidden');
  bookingSummary.innerHTML = `
    <strong>Resumo rapido</strong>
    <span>${pendingSelections.length} horario(s) selecionado(s)</span>
    <span>Total: ${formatPrice(getPendingTotal())}</span>
  `;
  bookingDrawer.dataset.mode = 'pending';
  continueBookingButton.classList.remove('hidden');
  cancelBookingButton?.classList.add('hidden');
  formMessage.textContent = '';
  openDrawer();
}

function renderEmptyState() {
  bookingDrawer.dataset.mode = 'empty';
  selectedSlotTitle.textContent = 'Selecione um ou mais horarios';
  selectedSlotPrice.textContent = 'R$ 0,00';
  slotDetails.className = 'slot-details empty-state';
  slotDetails.textContent = 'Clique em um horario disponivel para adicionar a reserva. Voce pode combinar varias horas e quadras antes de confirmar.';
  selectionList.classList.add('hidden');
  selectionList.innerHTML = '';
  bookingSummary.classList.add('hidden');
  bookingSummary.innerHTML = '';
  continueBookingButton.classList.add('hidden');
  cancelBookingButton?.classList.add('hidden');
  formMessage.textContent = '';
  bookingDrawer.dataset.mode = 'empty';
  closeDrawer();
}

function renderSelectedState() {
  if (selectedReservation?.booking) {
    renderReservedState();
    return;
  }

  if (pendingSelections.length) {
    renderPendingState();
    return;
  }

  renderEmptyState();
}

function renderAll() {
  renderHeaderInfo();
  renderAvailabilitySummary();
  renderDesktopSchedule();
  renderMobileDayStrip();
  renderMobileSchedule();
  renderSelectedState();
}

function togglePendingSelection(button) {
  const date = new Date(button.dataset.date);
  const hour = Number(button.dataset.hour);
  const court = button.dataset.court;
  const id = button.dataset.slotId;

  if (isPastSlot(date, hour)) {
    return;
  }

  const currentBooking = findBooking(date, hour, court);
  if (currentBooking) {
    selectedReservation = {
      id,
      date,
      hour,
      court,
      booking: currentBooking,
      price: currentBooking.price
    };
    clearPendingSelections();
    renderAll();
    return;
  }

  selectedReservation = null;
  const selectionIndex = getPendingSelectionIndex(id);

  if (selectionIndex >= 0) {
    pendingSelections.splice(selectionIndex, 1);
  } else {
    pendingSelections.push({
      id,
      date,
      hour,
      court,
      price: getSlotPrice(hour)
    });
  }

  renderAll();
}

function handleSlotClick(event) {
  const button = event.target.closest('[data-slot-id]');
  if (!button) return;
  togglePendingSelection(button);
}

async function refreshBookingsAndRender(showError = false) {
  try {
    await fetchBookings();
    renderAll();
  } catch (error) {
    console.error('Erro ao sincronizar reservas com Supabase:', error);
    if (showError) {
      formMessage.textContent = 'Nao foi possivel sincronizar as reservas agora.';
    }
  }
}

function startSyncLoop() {
  if (syncTimer) {
    clearInterval(syncTimer);
  }

  syncTimer = setInterval(() => {
    refreshBookingsAndRender(false);
  }, syncIntervalMs);
}

scheduleGrid.addEventListener('click', handleSlotClick);
mobileSchedule.addEventListener('click', handleSlotClick);

mobileDayStrip.addEventListener('click', (event) => {
  const button = event.target.closest('[data-mobile-day]');
  if (!button) return;
  selectedMobileDate = normalizeDate(new Date(button.dataset.mobileDay));
  renderMobileDayStrip();
  renderMobileSchedule();
});

continueBookingButton.addEventListener('click', () => {
  if (!pendingSelections.length) {
    formMessage.textContent = 'Selecione pelo menos um horario.';
    return;
  }

  savePendingSelections();
  window.location.href = './checkout.html';
});

if (cancelBookingButton) {
  cancelBookingButton.addEventListener('click', () => {
    formMessage.textContent = 'Use o link pessoal da reserva ou a area admin para cancelar.';
  });
}

closeDrawerButton.addEventListener('click', () => {
  resetInteractionState();
  renderAll();
});

prevWeekButton.addEventListener('click', () => {
  const today = normalizeDate(new Date());
  currentStartDate = addDays(currentStartDate, -7);

  if (currentStartDate.getTime() < today.getTime()) {
    currentStartDate = today;
  }

  selectedMobileDate = new Date(currentStartDate);
  resetInteractionState();
  renderAll();
});

nextWeekButton.addEventListener('click', () => {
  currentStartDate = addDays(currentStartDate, 7);
  selectedMobileDate = new Date(currentStartDate);
  resetInteractionState();
  renderAll();
});

courtFilter.addEventListener('change', () => {
  selectedCourtFilter = courtFilter.value;
  resetInteractionState();
  renderAll();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    refreshBookingsAndRender(false);
  }
});

async function initializeApp() {
  await refreshBookingsAndRender(true);
  startSyncLoop();
}

initializeApp();








