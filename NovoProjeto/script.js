const config = {
  alpha: { fHora: 4, fKm: 50, vHora: 80, vKm: 1.7, acion: 420 },
  ativa_armado: { fHora: 4, fKm: 100, vHora: 80, vKm: 1.6, acion: 500 },
  ativa_pr: { fHora: 4, fKm: 100, vHora: 70, vKm: 1.6, acion: 450 },
  lider: { fHora: 4, fKm: 50, vHora: 60, vKm: 1.6, acion: 380 },
  impacto: { fHora: 4, fKm: 50, vHora: 60, vKm: 1.7, acion: 430 },
  mike: { fHora: 4, fKm: 100, vHora: 60, vKm: 1.5, acion: 380 },
  rw: { fHora: 4, fKm: 50, vHora: 60, vKm: 1.4, acion: 400 },
  wm: { fHora: 4, fKm: 100, vHora: 60, vKm: 1.6, acion: 380 },
  wmdes: { fHora: 4, fKm: 100, vHora: 50, vKm: 1.6, acion: 300 },
  vigilante: {} // Será configurado pelo usuário
};

const container = document.getElementById('agentes-container');
let count = 0;

container.addEventListener('click', e => {
  if (e.target.classList.contains('botaoRemover')) {
    e.target.closest('.agente').remove();
    if (container.querySelectorAll('.agente').length === 0) {
      count = 0;
    }
  }
});

document.getElementById('addAgente').addEventListener('click', () => {
  count++;
  container.insertAdjacentHTML('beforeend', `
    <div class="agente" data-id="${count}">
      <button class="botaoRemover">X</button>
      <h3>Agente ${count}</h3>
      <label>Hora Saída:
        <input type="datetime-local" class="inicio">
      </label>
      <label>Hora Término:
        <input type="datetime-local" class="fim">
      </label>
      <label>KM Saída:
        <input type="number" class="kmInicio" min="0">
      </label>
      <label>KM Término:
        <input type="number" class="kmFim" min="0">
      </label>
      <label>Pedágios (qtde):
        <input type="number" class="qtdPed" value="0" min="0">
      </label>
      <label>Pedágio (R$ cada):
        <input type="number" class="valorPed" step="0.01" value="0">
      </label>
    </div>
  `);

  const novoAgente = container.querySelector(`.agente[data-id="${count}"]`);
  ['inicio', 'fim'].forEach(classe => {
    const input = novoAgente.querySelector(`input.${classe}`);
    input.addEventListener('paste', e => {
      e.preventDefault();
      const texto = (e.clipboardData || window.clipboardData).getData('text');
      const convertido = converterParaDatetimeLocal(texto.trim());
      if (convertido) {
        input.value = convertido;
      } else {
        alert('Formato inválido! Use: DD/MM/AAAA HH:mm');
      }
    });
  });
});

document.getElementById('empresa').addEventListener('change', e => {
  const emp = e.target.value;
  const blocoVigilante = document.getElementById('vigilante-config');
  blocoVigilante.style.display = emp === 'vigilante' ? 'block' : 'none';
});

function converterParaDatetimeLocal(valor) {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})$/;
  const match = valor.match(regex);
  if (!match) return null;

  const [, dia, mes, ano, hora, minuto] = match;
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

document.getElementById('calcular').addEventListener('click', () => {
  const emp = document.getElementById('empresa').value;
  let c;

  if (emp === 'vigilante') {
    const fHora = parseFloat(document.getElementById('vig_fHora').value || 0);
    const fKm = parseFloat(document.getElementById('vig_fKm').value || 0);
    const vHora = parseFloat(document.getElementById('vig_vHora').value || 0);
    const vKm = parseFloat(document.getElementById('vig_vKm').value || 0);
    const acion = parseFloat(document.getElementById('vig_acion').value || 0);

    if ([fHora, fKm, vHora, vKm, acion].some(isNaN)) {
      alert('Preencha todos os valores da configuração do Vigilante corretamente.');
      return;
    }

    c = { fHora, fKm, vHora, vKm, acion };
  } else {
    if (!config[emp]) {
      alert('Selecione a empresa!');
      return;
    }
    c = config[emp];
  }

  const agentes = document.querySelectorAll('.agente');

  if (agentes.length === 0) {
    alert('Adicione pelo menos um agente.');
    return;
  }

  let totalGeral = 0;
  let resumo = '';

  agentes.forEach((div, i) => {
    const ini = new Date(div.querySelector('.inicio').value);
    const fim = new Date(div.querySelector('.fim').value);
    const kmI = parseFloat(div.querySelector('.kmInicio').value || 0);
    const kmF = parseFloat(div.querySelector('.kmFim').value || 0);
    const qtdPed = parseInt(div.querySelector('.qtdPed').value || 0);
    const vPed = parseFloat(div.querySelector('.valorPed').value || 0);

    if (isNaN(ini) || isNaN(fim) || fim <= ini) {
      alert(`Dados inválidos no Agente ${i + 1}`);
      return;
    }

    const horasTot = (fim - ini) / 1000 / 60 / 60;
    const horasExc = Math.max(0, horasTot - c.fHora);
    const kmTot = kmF - kmI;
    const kmExc = Math.max(0, kmTot - c.fKm);
    const valorHoras = horasExc * c.vHora;
    const valorKm = kmExc * c.vKm;
    const valAcion = c.acion;
    const valPed = qtdPed * vPed;
    const totalAg = valAcion + valorHoras + valorKm + valPed;
    totalGeral += totalAg;

    const totalMin = Math.floor(horasTot * 60);
    const hTot = Math.floor(totalMin / 60);
    const mTot = totalMin % 60;

    const minExc = Math.floor(horasExc * 60);
    const hExc = Math.floor(minExc / 60);
    const mExc = minExc % 60;

    resumo += `<strong>Resumo SC - Agente ${i + 1}:</strong><br>
    <br>
Hora inicial: ${ini.toLocaleString()}<br>
Hora final: ${fim.toLocaleString()}<br>
Total de horas: ${hTot}h${mTot.toString().padStart(2, '0')}min - franquia de ${c.fHora}h → ${hExc}h${mExc.toString().padStart(2, '0')}min x R$ ${c.vHora.toFixed(2)} = R$ ${valorHoras.toFixed(2)}<br>
<br>
KM inicial: ${kmI}km<br>
KM final: ${kmF}km<br>
Total de KM: ${kmTot}km - franquia de ${c.fKm}km → ${kmExc}km x R$ ${c.vKm.toFixed(2)} = R$ ${valorKm.toFixed(2)}<br>
<br>
Acionamento: R$ ${valAcion.toFixed(2)}<br>
Pedágio R$ ${valPed.toFixed(2)}<br>
<br>
Total acionamento + total hrs extra + total km extra + pedágios = R$ ${totalAg.toFixed(2)}<br><br>`;
  });

  document.getElementById('calcular').addEventListener('click', () => {

  resumo += `<h3>Total Geral: R$ ${totalGeral.toFixed(2)}</h3>`;

  document.getElementById('resumoTotal').innerHTML = resumo;
});
});