const pendingSelectionKey = 'arena-abs-pending-selection';
const bookingsTable = 'reservas';
const adminWhatsappNumber = '5591982926051';

const checkoutSelectionList = document.querySelector('#checkout-selection-list');
const checkoutTotal = document.querySelector('#checkout-total');
const checkoutForm = document.querySelector('#checkout-form');
const checkoutMessage = document.querySelector('#checkout-message');
const customerNameInput = document.querySelector('#checkout-customer-name');
const customerPhoneInput = document.querySelector('#checkout-customer-phone');
const checkoutSuccess = document.querySelector('#checkout-success');
const cancelLinkText = document.querySelector('#cancel-link-text');
const cancelLinkButton = document.querySelector('#cancel-link-button');
const copyCancelLinkButton = document.querySelector('#copy-cancel-link');
const openWhatsappButton = document.querySelector('#open-whatsapp-button');

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

function buildCancelUrl(cancelToken) {
  return new URL(`./cancel.html?token=${encodeURIComponent(cancelToken)}`, window.location.href).href;
}

function createCancelToken() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `cancel-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isAppleMobile() {
  const userAgent = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(userAgent);
}

function buildAdminWhatsappMessage(bookings, customerName, phone, cancelUrl) {
  const lines = bookings
    .sort((first, second) => new Date(first.datetime).getTime() - new Date(second.datetime).getTime())
    .map((booking) => `- Quadra ${booking.court} | ${formatDateLong(new Date(booking.datetime))} | ${booking.hour}h | ${formatPrice(booking.price)}`)
    .join('\n');

  return encodeURIComponent(
    `Nova reserva - Arena ABS\n\n` +
    `Cliente: ${customerName}\n` +
    `Contato: ${phone}\n\n` +
    `Horarios reservados:\n${lines}\n\n` +
    `Total: ${formatPrice(bookings.reduce((total, booking) => total + booking.price, 0))}\n\n` +
    `Link do cliente para cancelamento:\n${cancelUrl}`
  );
}

function getWhatsappUrl(bookings, customerName, phone, cancelUrl) {
  return `https://wa.me/${adminWhatsappNumber}?text=${buildAdminWhatsappMessage(bookings, customerName, phone, cancelUrl)}`;
}

function openReservedWindow() {
  const popup = window.open('', '_blank');

  if (popup && popup.document) {
    popup.document.write('<!doctype html><html><head><title>Abrindo WhatsApp...</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Arial,sans-serif;padding:24px;background:#fff7ef;color:#3a2a1e;">Encaminhando para o WhatsApp...</body></html>');
    popup.document.close();
  }

  return popup;
}

function closeReservedWindow(popup) {
  if (!popup) {
    return;
  }

  try {
    popup.close();
  } catch {}
}

function openWhatsappAfterSave(whatsappUrl, reservedWindow) {
  if (reservedWindow && !reservedWindow.closed) {
    reservedWindow.location.href = whatsappUrl;
    return;
  }

  if (isAppleMobile()) {
    window.location.assign(whatsappUrl);
    return;
  }

  const popup = window.open(whatsappUrl, '_blank', 'noopener');

  if (!popup) {
    window.location.assign(whatsappUrl);
  }
}

function serializeBooking(booking) {
  return {
    id: booking.id,
    customer_name: booking.customerName,
    phone: booking.phone,
    court: booking.court,
    hour: booking.hour,
    price: booking.price,
    datetime: booking.datetime,
    cancel_token: booking.cancelToken
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

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  return false;
}

function showSuccessState(cancelUrl, whatsappUrl) {
  checkoutForm.classList.add('hidden');
  checkoutSuccess.classList.remove('hidden');
  cancelLinkText.textContent = cancelUrl;
  cancelLinkButton.href = cancelUrl;
  openWhatsappButton.href = whatsappUrl;
  checkoutMessage.textContent = 'Reserva salva. Se o WhatsApp nao abrir sozinho, toque no botao abaixo.';
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

copyCancelLinkButton?.addEventListener('click', async () => {
  const text = cancelLinkText.textContent.trim();
  if (!text) {
    return;
  }

  const copied = await copyText(text);
  checkoutMessage.textContent = copied
    ? 'Link copiado. Guarde esse endereco para cancelar a sua reserva depois.'
    : 'Nao foi possivel copiar automaticamente. Segure o link e copie manualmente.';
});

checkoutForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  checkoutMessage.textContent = '';

  const reservedWindow = openReservedWindow();

  if (!pendingSelections.length) {
    closeReservedWindow(reservedWindow);
    checkoutMessage.textContent = 'Volte para a agenda e escolha pelo menos um horario.';
    return;
  }

  const customerName = customerNameInput.value.trim();
  const customerPhone = customerPhoneInput.value.trim();

  if (!customerName || !customerPhone) {
    closeReservedWindow(reservedWindow);
    checkoutMessage.textContent = 'Preencha nome e contato.';
    return;
  }

  const cancelToken = createCancelToken();
  const cancelUrl = buildCancelUrl(cancelToken);
  const newBookings = pendingSelections.map((selection) => ({
    id: selection.id,
    customerName,
    phone: customerPhone,
    court: selection.court,
    hour: selection.hour,
    price: selection.price,
    datetime: buildSlotDate(new Date(selection.date), selection.hour).toISOString(),
    cancelToken
  }));

  try {
    const existingReservations = await findExistingReservations(newBookings.map((booking) => booking.id));
    if (existingReservations.length) {
      closeReservedWindow(reservedWindow);
      checkoutMessage.textContent = 'Um dos horarios acabou de ser reservado. Volte para a agenda e escolha novamente.';
      return;
    }

    const whatsappUrl = getWhatsappUrl(newBookings, customerName, customerPhone, cancelUrl);
    await insertReservations(newBookings);
    clearPendingSelections();
    showSuccessState(cancelUrl, whatsappUrl);
    openWhatsappAfterSave(whatsappUrl, reservedWindow);
  } catch (error) {
    closeReservedWindow(reservedWindow);
    console.error('Erro ao salvar reserva no Supabase:', error);
    checkoutMessage.textContent = 'Nao foi possivel salvar a reserva agora. Tente novamente.';
  }
});
