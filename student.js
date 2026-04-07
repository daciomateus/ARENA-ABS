const ADMIN_EMAIL = 'mateustrgn@gmail.com';
const studentEmail = document.querySelector('#student-email');
const studentProfileCopy = document.querySelector('#student-profile-copy');
const studentMonthlyStatus = document.querySelector('#student-monthly-status');
const studentMonthlyCopy = document.querySelector('#student-monthly-copy');
const studentMonthlyList = document.querySelector('#student-monthly-list');
const studentReservationStatus = document.querySelector('#student-reservation-status');
const studentReservationCopy = document.querySelector('#student-reservation-copy');
const studentReservationList = document.querySelector('#student-reservation-list');
const studentLogoutButton = document.querySelector('#student-logout');
const studentMessage = document.querySelector('#student-message');
const studentBookingTitle = document.querySelector('#student-booking-title');
const adminTools = document.querySelector('#admin-tools');
const adminReservationList = document.querySelector('#admin-reservation-list');
const adminMonthlyList = document.querySelector('#admin-monthly-list');
const monthlyForm = document.querySelector('#monthly-form');
const monthlyStudent = document.querySelector('#monthly-student');
const monthlyReference = document.querySelector('#monthly-reference');
const monthlyValue = document.querySelector('#monthly-value');
const monthlyDueDate = document.querySelector('#monthly-due-date');
const monthlyStatus = document.querySelector('#monthly-status');

let isAdminUser = false;

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatDateLong(date) {
  return new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function canCancelBooking(bookingDate) {
  return new Date(bookingDate).getTime() - Date.now() >= 60 * 60 * 1000;
}

async function fetchStudents() {
  const { data, error } = await window.supabaseClient
    .from('alunos')
    .select('id, nome, email, telefone, status')
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchMonthlyPayments() {
  const { data, error } = await window.supabaseClient
    .from('mensalidades')
    .select('*, alunos(nome, email)')
    .order('vencimento', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchAllBookings() {
  const { data, error } = await window.supabaseClient
    .from('reservas')
    .select('*')
    .order('datetime', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function upsertMonthlyPayment(payload) {
  const insertPayload = {
    aluno_id: payload.aluno_id,
    referencia: payload.referencia,
    valor: payload.valor,
    vencimento: payload.vencimento,
    status_pagamento: payload.status_pagamento,
    pago_em: payload.status_pagamento === 'pago' ? new Date().toISOString() : null
  };

  const { error } = await window.supabaseClient.from('mensalidades').insert(insertPayload);
  if (error) throw error;
}

async function updateMonthlyStatus(id, status) {
  const { error } = await window.supabaseClient
    .from('mensalidades')
    .update({
      status_pagamento: status,
      pago_em: status === 'pago' ? new Date().toISOString() : null
    })
    .eq('id', id);

  if (error) throw error;
}

function renderStudentReservations(reservas) {
  if (!reservas.length) {
    studentReservationStatus.textContent = 'Sem reservas ativas';
    studentReservationCopy.textContent = 'Quando voce reservar, os horarios aparecerao aqui.';
    studentReservationList.innerHTML = '<div class="checkout-empty">Nenhuma reserva vinculada ao seu login.</div>';
    return;
  }

  studentReservationStatus.textContent = `${reservas.length} reserva(s)`;
  studentReservationCopy.textContent = 'Esses horarios podem ser cancelados apenas pela sua conta ou pelo admin.';
  studentReservationList.innerHTML = reservas
    .map((item) => {
      const canCancel = canCancelBooking(item.datetime);
      return `
        <article class="support-card admin-card">
          <div>
            <strong>Quadra ${item.court} - ${item.hour}h</strong>
            <p class="support-copy">${formatDateLong(item.datetime)}</p>
            <p class="support-copy">Valor: ${formatPrice(item.price)}</p>
          </div>
          <button class="danger-button student-cancel-booking" type="button" data-booking-id="${item.id}" ${canCancel ? '' : 'disabled'}>${canCancel ? 'Cancelar horario' : 'Cancelamento bloqueado'}</button>
        </article>
      `;
    })
    .join('');
}

function renderStudentMonthly(mensalidades) {
  if (!mensalidades.length) {
    studentMonthlyStatus.textContent = 'Sem mensalidades cadastradas';
    studentMonthlyCopy.textContent = 'Assim que a administracao cadastrar, elas aparecerao aqui.';
    studentMonthlyList.innerHTML = '<div class="checkout-empty">Nenhuma mensalidade vinculada ao seu cadastro.</div>';
    return;
  }

  const atual = mensalidades[0];
  studentMonthlyStatus.textContent = atual.status_pagamento === 'pago' ? 'Em dia' : atual.status_pagamento === 'atrasado' ? 'Atrasado' : 'Pendente';
  studentMonthlyCopy.textContent = `Referencia: ${atual.referencia} | Vencimento: ${formatDate(atual.vencimento)} | Valor: ${formatPrice(atual.valor)}`;

  studentMonthlyList.innerHTML = mensalidades
    .map((item) => `
      <article class="checkout-selection-item">
        <strong>${item.referencia}</strong>
        <span>Vencimento: ${formatDate(item.vencimento)}</span>
        <small>${formatPrice(item.valor)} | ${item.status_pagamento}</small>
      </article>
    `)
    .join('');
}

async function renderAdminTools() {
  if (!isAdminUser) {
    adminTools?.classList.add('hidden');
    return;
  }

  adminTools?.classList.remove('hidden');
  studentBookingTitle.textContent = 'Minhas reservas e visao admin';

  const [bookings, students, monthlyPayments] = await Promise.all([
    fetchAllBookings(),
    fetchStudents(),
    fetchMonthlyPayments()
  ]);

  adminReservationList.innerHTML = bookings.length
    ? bookings.map((booking) => `
      <article class="support-card admin-card">
        <div>
          <strong>Quadra ${booking.court} - ${booking.hour}h</strong>
          <p class="support-copy">${formatDateLong(booking.datetime)}</p>
          <p class="support-copy">Aluno: ${booking.customer_name}</p>
          <p class="support-copy">Contato: ${booking.phone}</p>
          <p class="support-copy">Valor: ${formatPrice(booking.price)}</p>
        </div>
        <button class="danger-button admin-cancel-booking" type="button" data-booking-id="${booking.id}">Cancelar horario</button>
      </article>
    `).join('')
    : '<div class="checkout-empty">Nenhuma reserva ativa no momento.</div>';

  monthlyStudent.innerHTML = students.length
    ? students.map((student) => `<option value="${student.id}">${student.nome || student.email} | ${student.telefone || 'sem telefone'}</option>`).join('')
    : '<option value="">Nenhum aluno cadastrado</option>';

  adminMonthlyList.innerHTML = monthlyPayments.length
    ? monthlyPayments.map((item) => `
      <article class="support-card admin-card">
        <div>
          <strong>${item.alunos?.nome || item.alunos?.email || 'Aluno'}</strong>
          <p class="support-copy">Referencia: ${item.referencia}</p>
          <p class="support-copy">Vencimento: ${formatDate(item.vencimento)}</p>
          <p class="support-copy">Valor: ${formatPrice(item.valor)}</p>
          <p class="support-copy">Status: ${item.status_pagamento}</p>
        </div>
        <div class="support-actions">
          <button class="ghost-button admin-monthly-status" type="button" data-monthly-id="${item.id}" data-status="pendente">Pendente</button>
          <button class="ghost-button admin-monthly-status" type="button" data-monthly-id="${item.id}" data-status="pago">Pago</button>
          <button class="ghost-button admin-monthly-status" type="button" data-monthly-id="${item.id}" data-status="atrasado">Atrasado</button>
        </div>
      </article>
    `).join('')
    : '<div class="checkout-empty">Nenhuma mensalidade cadastrada ainda.</div>';
}

async function loadStudentSession() {
  const { data, error } = await window.supabaseClient.auth.getSession();

  if (error) {
    console.error('Erro ao carregar sessao do aluno:', error);
    studentMessage.textContent = 'Nao foi possivel carregar sua sessao.';
    return;
  }

  const session = data.session;

  if (!session) {
    window.location.href = './login.html';
    return;
  }

  isAdminUser = session.user.email === ADMIN_EMAIL;

  const { data: aluno, error: alunoError } = await window.supabaseClient
    .from('alunos')
    .select('nome, telefone, email, status')
    .eq('id', session.user.id)
    .maybeSingle();

  if (alunoError) {
    console.error('Erro ao carregar cadastro do aluno:', alunoError);
  }

  studentEmail.textContent = (aluno?.nome && aluno?.email)
    ? `${aluno.nome} | ${aluno.email}`
    : (session.user.email || 'Aluno conectado');

  studentProfileCopy.textContent = isAdminUser
    ? `Telefone: ${aluno?.telefone || 'nao informado'} | Conta com poderes de admin`
    : `Telefone: ${aluno?.telefone || 'nao informado'} | Status: ${aluno?.status || 'ativo'}`;

  const { data: reservas, error: reservaError } = await window.supabaseClient
    .from('reservas')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('datetime', { ascending: true });

  if (reservaError) {
    console.error('Erro ao carregar reservas do aluno:', reservaError);
    studentReservationStatus.textContent = 'Nao foi possivel carregar';
    studentReservationCopy.textContent = 'Tente atualizar a pagina em instantes.';
  } else {
    renderStudentReservations(reservas || []);
  }

  const { data: mensalidades, error: mensalidadeError } = await window.supabaseClient
    .from('mensalidades')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('vencimento', { ascending: false });

  if (mensalidadeError) {
    console.error('Erro ao carregar mensalidades do aluno:', mensalidadeError);
    studentMonthlyStatus.textContent = 'Nao foi possivel carregar';
    studentMonthlyCopy.textContent = 'Tente atualizar a pagina em instantes.';
  } else {
    renderStudentMonthly(mensalidades || []);
  }

  await renderAdminTools();
}

studentReservationList?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-booking-id]');
  if (!button) return;

  try {
    const { error } = await window.supabaseClient.from('reservas').delete().eq('id', button.dataset.bookingId);
    if (error) throw error;
    studentMessage.textContent = 'Horario cancelado com sucesso.';
    await loadStudentSession();
  } catch (error) {
    console.error('Erro ao cancelar reserva do aluno:', error);
    studentMessage.textContent = 'Nao foi possivel cancelar esse horario agora.';
  }
});

adminReservationList?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-booking-id]');
  if (!button) return;

  try {
    const { error } = await window.supabaseClient.from('reservas').delete().eq('id', button.dataset.bookingId);
    if (error) throw error;
    studentMessage.textContent = 'Horario cancelado com sucesso pela conta admin.';
    await loadStudentSession();
  } catch (error) {
    console.error('Erro ao cancelar reserva no modo admin:', error);
    studentMessage.textContent = 'Nao foi possivel cancelar agora.';
  }
});

monthlyForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  studentMessage.textContent = '';

  try {
    await upsertMonthlyPayment({
      aluno_id: monthlyStudent.value,
      referencia: monthlyReference.value.trim(),
      valor: Number(monthlyValue.value),
      vencimento: monthlyDueDate.value,
      status_pagamento: monthlyStatus.value
    });

    monthlyForm.reset();
    studentMessage.textContent = 'Mensalidade salva com sucesso.';
    await loadStudentSession();
  } catch (error) {
    console.error('Erro ao salvar mensalidade:', error);
    studentMessage.textContent = 'Nao foi possivel salvar a mensalidade.';
  }
});

adminMonthlyList?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-monthly-id]');
  if (!button) return;

  try {
    await updateMonthlyStatus(button.dataset.monthlyId, button.dataset.status);
    studentMessage.textContent = 'Status da mensalidade atualizado.';
    await loadStudentSession();
  } catch (error) {
    console.error('Erro ao atualizar mensalidade:', error);
    studentMessage.textContent = 'Nao foi possivel atualizar a mensalidade.';
  }
});

studentLogoutButton?.addEventListener('click', async () => {
  const { error } = await window.supabaseClient.auth.signOut();

  if (error) {
    console.error('Erro ao sair da area do aluno:', error);
    studentMessage.textContent = 'Nao foi possivel sair agora.';
    return;
  }

  window.location.href = './login.html';
});

loadStudentSession();
