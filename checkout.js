const storageKey = 'agenda-quadras-bookings';
const pendingSelectionKey = 'arena-abs-pending-selection';
const adminWhatsappNumber = '5591993500177';

const checkoutSelectionList = document.querySelector('#checkout-selection-list');
const checkoutTotal = document.querySelector('#checkout-total');
const checkoutForm = document.querySelector('#checkout-form');
const checkoutMessage = document.querySelector('#checkout-message');
const customerNameInput = document.querySelector('#checkout-customer-name');
const customerPhoneInput = document.querySelector('#checkout-customer-phone');

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

function loadPendingSelections() {
  try {
    return JSON.parse(localStorage.getItem(pendingSelectionKey)) || [];
  } catch {
    return [];
  }
}

function clearPendingSelections() {
  localStorage.removeItem(pendingSelectionKey);
}

function formatPrice(price) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateLong(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function buildSlotDate(date, hour) {
  const slotDate = new Date(date);
  slotDate.setHours(hour, 0, 0, 0);
  return slotDate;
}

function normalizeWhatsappNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

function buildAdminWhatsappMessage(bookings, customerName, phone) {
  const lines = bookings
    .sort((first, second) => new Date(first.datetime).getTime() - new Date(second.datetime).getTime())
    .map((booking) => `- Quadra ${booking.court} | ${formatDateLong(new Date(booking.datetime))} | ${booking.hour}h | ${formatPrice(booking.price)}`)
    .join('\n');

  return encodeURIComponent(
    `Nova reserva - Arena ABS\n\n` +
    `Cliente: ${customerName}\n` +
    `Contato: ${phone}\n\n` +
    `Horarios reservados:\n${lines}\n\n` +
    `Total: ${formatPrice(bookings.reduce((total, booking) => total + booking.price, 0))}`
  );
}

function buildCustomerWhatsappMessage(bookings, customerName) {
  const lines = bookings
    .sort((first, second) => new Date(first.datetime).getTime() - new Date(second.datetime).getTime())
    .map((booking) => `- Quadra ${booking.court} | ${formatDateLong(new Date(booking.datetime))} | ${booking.hour}h | ${formatPrice(booking.price)}`)
    .join('\n');

  return encodeURIComponent(
    `Reserva confirmada - Arena ABS\n\n` +
    `Cliente: ${customerName}\n\n` +
    `Horarios:\n${lines}\n\n` +
    `Total: ${formatPrice(bookings.reduce((total, booking) => total + booking.price, 0))}\n\n` +
    `Aguardamos voce na Arena ABS.`
  );
}

function openWhatsappConfirmation(bookings, customerName, phone) {
  const customerWhatsappNumber = normalizeWhatsappNumber(phone);
  const adminUrl = `https://wa.me/${adminWhatsappNumber}?text=${buildAdminWhatsappMessage(bookings, customerName, phone)}`;
  window.open(adminUrl, '_blank');

  if (customerWhatsappNumber) {
    const customerUrl = `https://wa.me/${customerWhatsappNumber}?text=${buildCustomerWhatsappMessage(bookings, customerName)}`;
    setTimeout(() => window.open(customerUrl, '_blank'), 250);
  }
}

const pendingSelections = loadPendingSelections();

if (!pendingSelections.length) {
  checkoutSelectionList.innerHTML = '<div class="checkout-empty">Nenhum horario foi selecionado ainda.</div>';
  checkoutTotal.textContent = '';
  checkoutForm.classList.add('hidden');
} else {
  checkoutSelectionList.innerHTML = pendingSelections
    .sort((first, second) => buildSlotDate(first.date, first.hour).getTime() - buildSlotDate(second.date, second.hour).getTime())
    .map((selection) => `
      <article class="checkout-selection-item">
        <strong>Quadra ${selection.court} - ${selection.hour}h</strong>
        <span>${formatDateLong(new Date(selection.date))}</span>
        <small>${formatPrice(selection.price)}</small>
      </article>
    `)
    .join('');

  checkoutTotal.textContent = `Total: ${formatPrice(pendingSelections.reduce((total, selection) => total + selection.price, 0))}`;
}

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  checkoutMessage.textContent = '';

  if (!pendingSelections.length) {
    checkoutMessage.textContent = 'Volte para a agenda e escolha pelo menos um horario.';
    return;
  }

  const customerName = customerNameInput.value.trim();
  const customerPhone = customerPhoneInput.value.trim();

  if (!customerName || !customerPhone) {
    checkoutMessage.textContent = 'Preencha nome e contato.';
    return;
  }

  const bookings = loadBookings();
  const newBookings = [];

  for (const selection of pendingSelections) {
    const alreadyBooked = bookings.find((booking) => booking.id === selection.id);
    if (alreadyBooked) {
      checkoutMessage.textContent = 'Um dos horarios acabou de ser reservado. Volte para a agenda e escolha novamente.';
      return;
    }

    newBookings.push({
      id: selection.id,
      customerName,
      phone: customerPhone,
      court: selection.court,
      hour: selection.hour,
      price: selection.price,
      datetime: buildSlotDate(new Date(selection.date), selection.hour).toISOString()
    });
  }

  saveBookings([...bookings, ...newBookings]);
  clearPendingSelections();
  openWhatsappConfirmation(newBookings, customerName, customerPhone);
  window.location.href = './index.html';
});
