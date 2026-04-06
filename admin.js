const bookingsTable = 'reservas';
const adminSessionKey = 'arena-abs-admin-session';
const adminPassword = 'arenaabs123';

const adminAuthCard = document.querySelector('#admin-auth-card');
const adminPanel = document.querySelector('#admin-panel');
const adminLoginForm = document.querySelector('#admin-login-form');
const adminPasswordInput = document.querySelector('#admin-password');
const adminMessage = document.querySelector('#admin-message');
const adminReservationList = document.querySelector('#admin-reservation-list');
const adminLogoutButton = document.querySelector('#admin-logout');

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateLong(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function isAuthenticated() {
  return sessionStorage.getItem(adminSessionKey) === 'ok';
}

function setAuthenticated(value) {
  if (value) {
    sessionStorage.setItem(adminSessionKey, 'ok');
    return;
  }

  sessionStorage.removeItem(adminSessionKey);
}

async function fetchBookings() {
  const { data, error } = await window.supabaseClient
    .from(bookingsTable)
    .select('*')
    .order('datetime', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function deleteBooking(id) {
  const { error } = await window.supabaseClient
    .from(bookingsTable)
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

async function renderBookings() {
  try {
    const bookings = await fetchBookings();

    if (!bookings.length) {
      adminReservationList.innerHTML = '<div class="checkout-empty">Nenhuma reserva ativa no momento.</div>';
      return;
    }

    adminReservationList.innerHTML = bookings
      .map((booking) => `
        <article class="support-card admin-card">
          <div>
            <strong>Quadra ${booking.court} - ${booking.hour}h</strong>
            <p class="support-copy">${formatDateLong(new Date(booking.datetime))}</p>
            <p class="support-copy">Cliente: ${booking.customer_name}</p>
            <p class="support-copy">Contato: ${booking.phone}</p>
            <p class="support-copy">Valor: ${formatPrice(booking.price)}</p>
          </div>
          <button class="danger-button admin-cancel" type="button" data-booking-id="${booking.id}">Cancelar horario</button>
        </article>
      `)
      .join('');
  } catch (error) {
    console.error('Erro ao listar reservas no admin:', error);
    adminMessage.textContent = 'Nao foi possivel carregar as reservas.';
  }
}

function updateView() {
  const authenticated = isAuthenticated();
  adminAuthCard.classList.toggle('hidden', authenticated);
  adminPanel.classList.toggle('hidden', !authenticated);

  if (authenticated) {
    renderBookings();
  }
}

adminLoginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  adminMessage.textContent = '';

  if (adminPasswordInput.value !== adminPassword) {
    adminMessage.textContent = 'Senha incorreta.';
    return;
  }

  setAuthenticated(true);
  adminPasswordInput.value = '';
  updateView();
});

adminReservationList?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-booking-id]');
  if (!button) {
    return;
  }

  try {
    await deleteBooking(button.dataset.bookingId);
    adminMessage.textContent = 'Horario cancelado com sucesso.';
    renderBookings();
  } catch (error) {
    console.error('Erro ao cancelar reserva no admin:', error);
    adminMessage.textContent = 'Nao foi possivel cancelar agora.';
  }
});

adminLogoutButton?.addEventListener('click', () => {
  setAuthenticated(false);
  adminMessage.textContent = '';
  updateView();
});

updateView();
