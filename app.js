const quadras = ['A', 'B', 'S', 'E'];
const horarios = [17, 18, 19, 20, 21, 22];
const diasPermitidos = [1, 2, 3, 4, 5, 6];
const storageKey = 'agenda-quadras-bookings';
const adminWhatsappNumber = '5591993500177';

const weekRangeEl = document.querySelector('#week-range');
const scheduleGrid = document.querySelector('#schedule-grid');
const selectedSlotTitle = document.querySelector('#selected-slot-title');
const selectedSlotPrice = document.querySelector('#selected-slot-price');
const slotDetails = document.querySelector('#slot-details');
const bookingForm = document.querySelector('#booking-form');
const bookingSummary = document.querySelector('#booking-summary');
const cancelBookingButton = document.querySelector('#cancel-booking');
const formMessage = document.querySelector('#form-message');
const prevWeekButton = document.querySelector('#prev-week');
const nextWeekButton = document.querySelector('#next-week');
const courtFilter = document.querySelector('#court-filter');
const todayIndicator = document.querySelector('#today-indicator');
const availabilitySummary = document.querySelector('#availability-summary');

let currentWeekStart = getStartOfWeek(new Date());
let selectedSlot = null;
let selectedCourtFilter = 'all';

function loadBookings() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  localStorage.setItem(storageKey, JSON.stringify(bookings));
}

function getStartOfWeek(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + diff);
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

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatDateLong(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
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

function getWeekDays() {
  return diasPermitidos.map((_, index) => addDays(currentWeekStart, index));
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
  const slotDate = buildSlotDate(date, hour);
  return slotDate.getTime() < new Date().getTime();
}

function findBooking(date, hour, court) {
  const id = getBookingId(date, hour, court);
  return loadBookings().find((booking) => booking.id === id);
}

function normalizeWhatsappNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

function renderWeekHeader() {
  const weekDays = getWeekDays();
  weekRangeEl.textContent = `${formatDate(weekDays[0])} - ${formatDate(weekDays[weekDays.length - 1])}`;

  const today = new Date();
  const isCurrentWeek = weekDays.some((date) => isSameDay(date, today));
  todayIndicator.textContent = isCurrentWeek
    ? `Hoje: ${formatDateLong(today)}`
    : 'Visualizando outra semana';
}

function renderAvailabilitySummary() {
  const weekDays = getWeekDays();
  const visibleCourts = getVisibleCourts();

  availabilitySummary.innerHTML = visibleCourts
    .map((court) => {
      const freeSlots = weekDays.reduce((total, date) => {
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

function renderSchedule() {
  const weekDays = getWeekDays();
  const visibleCourts = getVisibleCourts();
  const today = new Date();
  scheduleGrid.innerHTML = '';

  scheduleGrid.insertAdjacentHTML('beforeend', '<div class="grid-cell grid-cell--header">Quadra / Horario</div>');
  weekDays.forEach((date) => {
    const todayClass = isSameDay(date, today) ? 'grid-cell--today' : '';
    scheduleGrid.insertAdjacentHTML('beforeend', `<div class="grid-cell grid-cell--header ${todayClass}">${formatDateLong(date)}</div>`);
  });

  visibleCourts.forEach((court) => {
    scheduleGrid.insertAdjacentHTML('beforeend', `<div class="grid-cell">Quadra ${court}</div>`);

    weekDays.forEach((date) => {
      const slotsMarkup = horarios
        .map((hour) => {
          const booking = findBooking(date, hour, court);
          const id = getBookingId(date, hour, court);
          const isSelected = selectedSlot?.id === id;
          const pastSlot = isPastSlot(date, hour);
          const stateClass = booking
            ? 'slot-card--reserved'
            : pastSlot
              ? 'slot-card--past'
              : 'slot-card--available';
          const selectedClass = isSelected ? 'slot-card--selected' : '';
          const price = getSlotPrice(hour);
          const statusLabel = booking
            ? '<span class="slot-status slot-status--reserved">Reservado</span>'
            : pastSlot
              ? '<span class="slot-status slot-status--past">Encerrado</span>'
              : '<span class="slot-status slot-status--available">Disponivel</span>';
          const customerLine = booking ? booking.customerName : pastSlot ? 'Horario encerrado' : 'Livre para reserva';

          return `
            <button class="slot-card ${stateClass} ${selectedClass}" type="button" data-slot-id="${id}" data-date="${date.toISOString()}" data-hour="${hour}" data-court="${court}">
              ${statusLabel}
              <strong>${hour}h</strong>
              <span>${customerLine}</span>
              <small>${booking ? formatPrice(booking.price) : formatPrice(price)}</small>
            </button>
          `;
        })
        .join('');

      scheduleGrid.insertAdjacentHTML('beforeend', `<div class="grid-cell ${isSameDay(date, today) ? 'grid-cell--today-column' : ''}">${slotsMarkup}</div>`);
    });
  });

  renderAvailabilitySummary();
}

function resetPanel(message) {
  selectedSlot = null;
  selectedSlotTitle.textContent = 'Selecione um horario';
  selectedSlotPrice.textContent = 'R$ 0,00';
  slotDetails.textContent = message || 'Clique em um horario disponivel para reservar ou em uma reserva existente para ver os dados e cancelar.';
  slotDetails.className = 'slot-details empty-state';
  bookingForm.classList.add('hidden');
  bookingSummary.classList.add('hidden');
  cancelBookingButton.classList.add('hidden');
  formMessage.textContent = '';
  bookingForm.reset();
}

function renderSelectedSlot() {
  if (!selectedSlot) {
    resetPanel();
    return;
  }

  selectedSlotTitle.textContent = `${selectedSlot.court} • ${formatDateLong(selectedSlot.date)} • ${selectedSlot.hour}h`;
  selectedSlotPrice.textContent = formatPrice(selectedSlot.price);

  if (selectedSlot.isPast && !selectedSlot.booking) {
    slotDetails.className = 'slot-details';
    slotDetails.textContent = 'Este horario ja passou e nao pode mais ser reservado.';
    bookingForm.classList.add('hidden');
    bookingSummary.classList.add('hidden');
    cancelBookingButton.classList.add('hidden');
    formMessage.textContent = '';
    return;
  }

  if (selectedSlot.booking) {
    const canCancel = canCancelBooking(selectedSlot.booking);
    slotDetails.className = 'slot-details';
    slotDetails.innerHTML = `
      <strong>Horario reservado</strong><br>
      Cliente: ${selectedSlot.booking.customerName}<br>
      Telefone: ${selectedSlot.booking.phone}<br>
      Observacoes: ${selectedSlot.booking.notes || 'Nenhuma'}
    `;

    bookingSummary.classList.remove('hidden');
    bookingSummary.innerHTML = `
      <strong>Status</strong>
      <span>Reserva confirmada para ${selectedSlot.hour}h.</span>
      <span>${canCancel ? 'Cancelamento liberado.' : 'Cancelamento bloqueado: falta menos de 1 hora.'}</span>
    `;
    bookingForm.classList.add('hidden');
    cancelBookingButton.classList.toggle('hidden', !canCancel);
    formMessage.textContent = canCancel ? '' : 'Nao e mais possivel cancelar este horario.';
    return;
  }

  slotDetails.className = 'slot-details';
  slotDetails.textContent = 'Horario disponivel. Preencha os dados para confirmar a reserva.';
  bookingSummary.classList.add('hidden');
  bookingForm.classList.remove('hidden');
  cancelBookingButton.classList.add('hidden');
  formMessage.textContent = '';
}

function selectSlot(button) {
  const date = new Date(button.dataset.date);
  const hour = Number(button.dataset.hour);
  const court = button.dataset.court;
  const booking = findBooking(date, hour, court);

  selectedSlot = {
    id: button.dataset.slotId,
    date,
    hour,
    court,
    price: getSlotPrice(hour),
    booking,
    isPast: isPastSlot(date, hour)
  };

  renderSchedule();
  renderSelectedSlot();
}

function buildAdminWhatsappMessage(booking) {
  return encodeURIComponent(
    `Nova reserva de quadra\n\n` +
    `Cliente: ${booking.customerName}\n` +
    `Telefone: ${booking.phone}\n` +
    `Quadra: ${booking.court}\n` +
    `Data: ${formatDateLong(new Date(booking.datetime))}\n` +
    `Horario: ${booking.hour}h\n` +
    `Valor: ${formatPrice(booking.price)}\n` +
    `Observacoes: ${booking.notes || 'Nenhuma'}`
  );
}

function buildCustomerWhatsappMessage(booking) {
  return encodeURIComponent(
    `Sua reserva foi confirmada\n\n` +
    `Quadra: ${booking.court}\n` +
    `Data: ${formatDateLong(new Date(booking.datetime))}\n` +
    `Horario: ${booking.hour}h\n` +
    `Valor: ${formatPrice(booking.price)}\n` +
    `Observacoes: ${booking.notes || 'Nenhuma'}\n\n` +
    `Aguardamos voce.`
  );
}

function openWhatsappConfirmation(booking) {
  const customerWhatsappNumber = normalizeWhatsappNumber(booking.phone);
  const adminUrl = `https://wa.me/${adminWhatsappNumber}?text=${buildAdminWhatsappMessage(booking)}`;
  window.open(adminUrl, '_blank');

  if (customerWhatsappNumber) {
    const customerUrl = `https://wa.me/${customerWhatsappNumber}?text=${buildCustomerWhatsappMessage(booking)}`;
    setTimeout(() => window.open(customerUrl, '_blank'), 250);
  }
}

scheduleGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-slot-id]');
  if (!button) return;
  selectSlot(button);
});

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formMessage.textContent = '';

  if (!selectedSlot || selectedSlot.booking || selectedSlot.isPast) {
    formMessage.textContent = 'Selecione um horario disponivel.';
    return;
  }

  const bookings = loadBookings();
  const customerName = document.querySelector('#customer-name').value.trim();
  const phone = document.querySelector('#customer-phone').value.trim();
  const notes = document.querySelector('#customer-notes').value.trim();

  if (!customerName || !phone) {
    formMessage.textContent = 'Preencha nome e telefone.';
    return;
  }

  const booking = {
    id: selectedSlot.id,
    customerName,
    phone,
    notes,
    court: selectedSlot.court,
    hour: selectedSlot.hour,
    price: selectedSlot.price,
    datetime: buildSlotDate(selectedSlot.date, selectedSlot.hour).toISOString()
  };

  bookings.push(booking);
  saveBookings(bookings);
  selectedSlot.booking = booking;
  renderSchedule();
  renderSelectedSlot();
  formMessage.textContent = 'Reserva confirmada com sucesso.';
  openWhatsappConfirmation(booking);
});

cancelBookingButton.addEventListener('click', () => {
  if (!selectedSlot?.booking) return;

  if (!canCancelBooking(selectedSlot.booking)) {
    formMessage.textContent = 'Nao e mais possivel cancelar este horario.';
    renderSelectedSlot();
    return;
  }

  const bookings = loadBookings().filter((booking) => booking.id !== selectedSlot.booking.id);
  saveBookings(bookings);
  selectedSlot.booking = null;
  renderSchedule();
  renderSelectedSlot();
  formMessage.textContent = 'Reserva cancelada com sucesso.';
});

prevWeekButton.addEventListener('click', () => {
  currentWeekStart = addDays(currentWeekStart, -7);
  resetPanel();
  renderWeekHeader();
  renderSchedule();
});

nextWeekButton.addEventListener('click', () => {
  currentWeekStart = addDays(currentWeekStart, 7);
  resetPanel();
  renderWeekHeader();
  renderSchedule();
});

courtFilter.addEventListener('change', () => {
  selectedCourtFilter = courtFilter.value;
  resetPanel();
  renderSchedule();
});

renderWeekHeader();
renderSchedule();
resetPanel();
