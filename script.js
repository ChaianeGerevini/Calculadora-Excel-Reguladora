const config = {
  alpha: { fHora: 4, fKm: 50, vHora: 80, vKm: 1.7, acion: 420 },
  ativa_armado: { fHora: 4, fKm: 100, vHora: 80, vKm: 1.6, acion: 500 },
  ativa_pr: { fHora: 4, fKm: 100, vHora: 70, vKm: 1.6, acion: 450 },
  lider: { fHora: 4, fKm: 50, vHora: 60, vKm: 1.6, acion: 380 },
  impacto: { fHora: 4, fKm: 50, vHora: 60, vKm: 1.7, acion: 430 },
  mike: { fHora: 4, fKm: 100, vHora: 60, vKm: 1.5, acion: 380 },
  rw: { fHora: 4, fKm: 50, vHora: 60, vKm: 1.4, acion: 400 },
  wm: { fHora: 4, fKm: 50, vHora: 80, vKm: 1.7, acion: 420 },
};

const container = document.getElementById("agentes-container");
let count = 0;

// ============================
// Funções auxiliares
// ============================
function formatDateTimeLocal(value) {
  const d = new Date(value);
  if (isNaN(d)) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()} - ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatMoney(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ============================
// Eventos
// ============================
document.getElementById("empresa").addEventListener("change", (e) => {
  document.getElementById("vigilante-config").style.display =
    e.target.value === "vigilante" ? "block" : "none";
});

document.getElementById("addAgente").addEventListener("click", () => {
  count++;

  // Checkbox "Rendição" – ao lado, em negrito
  let rendHTML = "";
  if (count > 1) {
    rendHTML = `
      <label class="rendicao-label">
        <span><strong>Rendição</strong></span>
        <input type="checkbox" class="rendicaoDoAnterior">
      </label>
    `;
  }

  container.insertAdjacentHTML(
    "beforeend",
    `
    <div class="agente">
      <button class="botaoRemover">X</button>
      <h3>Agente ${count}</h3>

      <label>Hora Saída <input type="datetime-local" class="inicio"></label>
      <label>Hora Término <input type="datetime-local" class="fim"></label>

      <label>KM Saída <input type="number" class="kmInicio" value="0"></label>
      <label>KM Término <input type="number" class="kmFim" value="0"></label>

      <label>Pedágios (qtde) <input type="number" class="qtdPed" value="0"></label>
      <label>Valor Pedágio <input type="number" class="valorPed" value="0" step="0.01"></label>

      ${rendHTML}
    </div>
  `
  );
});

container.addEventListener("click", (e) => {
  if (e.target.classList.contains("botaoRemover")) {
    e.target.closest(".agente").remove();
  }
});

// ============================
// Cálculo (com grupos e rendição)
// ============================
document.getElementById("calcular").addEventListener("click", () => {
  const emp = document.getElementById("empresa").value;
  if (!emp) return alert("Selecione a empresa");

  const conf =
    emp === "vigilante"
      ? {
          fHora: +vig_fHora.value || 0,
          fKm: +vig_fKm.value || 0,
          vHora: +vig_vHora.value || 0,
          vKm: +vig_vKm.value || 0,
          acion: +vig_acion.value || 0,
        }
      : config[emp];

  const agentesDOM = [...document.querySelectorAll(".agente")];
  if (!agentesDOM.length) return alert("Adicione agentes");

  // Ler dados dos agentes
  const agentes = agentesDOM.map((div, idx) => {
    const inicio = new Date(div.querySelector(".inicio").value);
    const fim = new Date(div.querySelector(".fim").value);

    if (isNaN(inicio) || isNaN(fim)) {
      alert(`Preencha corretamente as datas do agente ${idx + 1}`);
      throw new Error("Datas inválidas");
    }

    const totalMinutos = Math.max(0, Math.round((fim - inicio) / 60000));

    const kmI = +div.querySelector(".kmInicio").value || 0;
    const kmF = +div.querySelector(".kmFim").value || 0;
    const kmTotal = Math.max(0, kmF - kmI);

    const qtdPed = +div.querySelector(".qtdPed").value || 0;
    const valPed = +div.querySelector(".valorPed").value || 0;
    const valorPedagios = qtdPed * valPed;

    const rend =
      idx > 0 ? !!div.querySelector(".rendicaoDoAnterior")?.checked : false;

    return {
      index: idx + 1,
      inicio,
      fim,
      totalMinutos,
      kmI,
      kmF,
      kmTotal,
      qtdPed,
      valPed,
      valorPedagios,
      rend,
    };
  });

  // Agrupar por rendição (cada grupo = 1 acionamento + 1 franquia)
  const grupos = [];
  let atual = [agentes[0]];

  for (let i = 1; i < agentes.length; i++) {
    if (agentes[i].rend) {
      atual.push(agentes[i]);
    } else {
      grupos.push(atual);
      atual = [agentes[i]];
    }
  }
  grupos.push(atual);

  let totalGeral = 0;
  let out = "";

  grupos.forEach((grupo, gi) => {
    let minutosGrupo = 0;
    let kmGrupo = 0;
    let pedGrupo = 0;

    out += `<div class="resumo-grupo-bloco"><h2>Grupo ${gi + 1}</h2>`;

    grupo.forEach((ag, idxG) => {
      minutosGrupo += ag.totalMinutos;
      kmGrupo += ag.kmTotal;
      pedGrupo += ag.valorPedagios;

      out += `
        <div class="resumo-agente">
          <h3>Agente ${ag.index} ${
        idxG === 0 ? "(Principal)" : "(Rendição)"
      }</h3>
          <p><strong>Hora inicial:</strong> ${formatDateTimeLocal(ag.inicio)}</p>
          <p><strong>Hora final:</strong> ${formatDateTimeLocal(ag.fim)}</p>
          <p><strong>Total horas:</strong> ${formatDuration(ag.totalMinutos)}</p>

          <p><strong>KM inicial:</strong> ${ag.kmI}</p>
          <p><strong>KM final:</strong> ${ag.kmF}</p>
          <p><strong>Total KM:</strong> ${ag.kmTotal}</p>
        </div>
      `;
    });

    // Franquias
    const franquiaMin = conf.fHora * 60;
    const minutosCobrados = Math.max(0, minutosGrupo - franquiaMin);

    const franquiaKm = conf.fKm;
    const kmCobrados = Math.max(0, kmGrupo - franquiaKm);

    // Valores
    const valorHora = (minutosCobrados / 60) * conf.vHora;
    const valorKm = kmCobrados * conf.vKm;
    const valorAcionamento = conf.acion; // 1 vez por grupo
    const totalGrupo = valorAcionamento + valorHora + valorKm + pedGrupo;

    totalGeral += totalGrupo;

    out += `
      <div class="resumo-grupo-totais">
        <h3>Resumo do Grupo ${gi + 1}</h3>

        <p><strong>Horas grupo:</strong> ${formatDuration(minutosGrupo)}</p>
        <p><strong>Cobrado:</strong> ${formatDuration(
          minutosGrupo
        )} - ${formatDuration(franquiaMin)} = ${formatDuration(
      minutosCobrados
    )}</p>

        <p><strong>KM grupo:</strong> ${kmGrupo}</p>
        <p><strong>KM cobrados:</strong> ${kmGrupo} - ${franquiaKm} = ${kmCobrados}</p>

        <p><strong>Acionamento:</strong> ${formatMoney(valorAcionamento)}</p>
        <p><strong>Hora:</strong> ${formatMoney(valorHora)}</p>
        <p><strong>KM:</strong> ${formatMoney(valorKm)}</p>
        <p><strong>Pedágios:</strong> ${formatMoney(pedGrupo)}</p>

        <h4>Total grupo:</h4>
        <p class="total-grupo-valor">${formatMoney(totalGrupo)}</p>
      </div></div>
    `;
  });

  out += `<h1 class="total-geral">Total Geral: ${formatMoney(totalGeral)}</h1>`;

  document.getElementById("resultado").innerHTML = out;
});