const studentEmail = document.querySelector('#student-email');
const studentProfileCopy = document.querySelector('#student-profile-copy');
const studentMonthlyStatus = document.querySelector('#student-monthly-status');
const studentMonthlyCopy = document.querySelector('#student-monthly-copy');
const studentMonthlyList = document.querySelector('#student-monthly-list');
const studentLogoutButton = document.querySelector('#student-logout');
const studentMessage = document.querySelector('#student-message');

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
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

  const { data: aluno, error: alunoError } = await window.supabaseClient
    .from('alunos')
    .select('nome, telefone, email, status')
    .eq('id', session.user.id)
    .single();

  if (alunoError) {
    console.error('Erro ao carregar cadastro do aluno:', alunoError);
    studentEmail.textContent = session.user.email || 'Aluno conectado';
    studentMessage.textContent = 'Sessao carregada, mas ainda nao consegui ler seu cadastro completo.';
    return;
  }

  studentEmail.textContent = aluno.nome
    ? `${aluno.nome} | ${aluno.email}`
    : (aluno.email || session.user.email || 'Aluno conectado');

  studentProfileCopy.textContent = `Telefone: ${aluno.telefone || 'nao informado'} | Status: ${aluno.status || 'ativo'}`;

  const { data: mensalidades, error: mensalidadeError } = await window.supabaseClient
    .from('mensalidades')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('vencimento', { ascending: false });

  if (mensalidadeError) {
    console.error('Erro ao carregar mensalidades do aluno:', mensalidadeError);
    studentMonthlyStatus.textContent = 'Nao foi possivel carregar';
    studentMonthlyCopy.textContent = 'Tente atualizar a pagina em instantes.';
    return;
  }

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
