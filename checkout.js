const pendingSelectionKey = 'arena-abs-pending-selection';
const bookingsTable = 'reservas';
const adminWhatsappNumber = '5591982926051';

const checkoutSelectionList = document.querySelector('#checkout-selection-list');
const checkoutTotal = document.querySelector('#checkout-total');
const checkoutForm = document.querySelector('#checkout-form');
const checkoutMessage = document.querySelector('#checkout-message');
const customerNameInput = document.querySelector('#checkout-customer-name');
const customerPhoneInput = document.querySelector('#checkout-customer-phone');

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

function isAppleMobile() {
  const userAgent = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(userAgent);
}

function openWhatsappConfirmation(bookings, customerName, phone) {
  const adminUrl = `https://wa.me/${adminWhatsappNumber}?text=${buildAdminWhatsappMessage(bookings, customerName, phone)}`;

  if (isAppleMobile()) {
    window.location.assign(adminUrl);
    return;
  }

  const popup = window.open(adminUrl, '_blank', 'noopener');

  if (!popup) {
    window.location.assign(adminUrl);
    return;
  }

  window.location.href = './index.html';
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

async function findExistingReservations(ids) {
  const { data, error } = await window.supabaseClient
    .from(bookingsTable)
    .select('id')
    .in('id', ids);

  if (error) {
    throw error;
  }

  return data || [];
}

async function insertReservations(bookings) {
  const { error } = await window.supabaseClient
    .from(bookingsTable)
    .insert(bookings.map(serializeBooking));

  if (error) {
    throw error;
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

checkoutForm.addEventListener('submit', async (event) => {
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

  const newBookings = pendingSelections.map((selection) => ({
    id: selection.id,
    customerName,
    phone: customerPhone,
    court: selection.court,
    hour: selection.hour,
    price: selection.price,
    datetime: buildSlotDate(new Date(selection.date), selection.hour).toISOString()
  }));

  try {
    const existingReservations = await findExistingReservations(newBookings.map((booking) => booking.id));
    if (existingReservations.length) {
      checkoutMessage.textContent = 'Um dos horarios acabou de ser reservado. Volte para a agenda e escolha novamente.';
      return;
    }

    await insertReservations(newBookings);
    clearPendingSelections();
    openWhatsappConfirmation(newBookings, customerName, customerPhone);
  } catch (error) {
    console.error('Erro ao salvar reserva no Supabase:', error);
    checkoutMessage.textContent = 'Nao foi possivel salvar a reserva agora. Tente novamente.';
  }
});
