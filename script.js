const supabaseUrl = "https://lblnsalijvhzcrhmmmvt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibG5zYWxpanZoemNyaG1tbXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODgxODEsImV4cCI6MjA5NTY2NDE4MX0.gWWWqm9ZAcndxhPMIy2Muf8WJLhxwRDFfoT9WJ7gmo8";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ============================
// EMPRESAS (GLOBAL)
// ============================
let empresas = [];
let empresaEditando = null;

// ============================
// CARREGAR EMPRESAS (SUPABASE)
// ============================
async function carregarEmpresas() {
  const { data, error } = await supabaseClient
    .from("empresas")
    .select("*")
    .order("id");

  if (error) {
    console.error(error);
    return;
  }

  empresas = data.map((e) => ({
    id: e.id,
    nome: e.nome,
    fHora: e.fhora,
    fKm: e.fkm,
    vHora: e.vhora,
    vKm: e.vkm,
    acion: e.acion,
  }));

  atualizarSelectEmpresas();
  renderizarEmpresas();
}
async function registrarAcesso(pagina) {
  const { error } = await supabaseClient.from("acessos").insert([
    {
      pagina,
      navegador: navigator.userAgent,
    },
  ]);

  if (error) {
    console.error("Erro ao registrar acesso:", error);
  }
}
// ============================
// SALVAR (CREATE/UPDATE)
// ============================
async function salvarEmpresaSupabase(dados) {
  if (empresaEditando) {
    const { error } = await supabaseClient
      .from("empresas")
      .update({
        nome: dados.nome,
        fhora: dados.fHora,
        fkm: dados.fKm,
        vhora: dados.vHora,
        vkm: dados.vKm,
        acion: dados.acion,
      })
      .eq("id", empresaEditando);

    if (error) console.error(error);
  } else {
    const { error } = await supabaseClient.from("empresas").insert([
      {
        nome: dados.nome,
        fhora: dados.fHora,
        fkm: dados.fKm,
        vhora: dados.vHora,
        vkm: dados.vKm,
        acion: dados.acion,
      },
    ]);

    if (error) console.error(error);
  }

  empresaEditando = null;
  await carregarEmpresas();
}

// ============================
// EXCLUIR
// ============================
async function excluirEmpresaSupabase(id) {
  const { error } = await supabaseClient.from("empresas").delete().eq("id", id);

  if (error) console.error(error);

  await carregarEmpresas();
}

// ============================
// RENDER
// ============================
function renderizarEmpresas() {
  const lista = document.getElementById("listaEmpresas");
  lista.innerHTML = "";

  empresas.forEach((emp) => {
    lista.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card-empresa">
        <strong>${emp.nome}</strong>

        <div>
          <button class="btnEditar" data-id="${emp.id}">✏️</button>
          <button class="btnExcluir" data-id="${emp.id}">🗑️</button>
        </div>
      </div>
      `,
    );
  });
}

// ============================
// SELECT
// ============================
function atualizarSelectEmpresas() {
  const select = document.getElementById("empresa");

  select.innerHTML = `
    <option value="">- Escolha -</option>
    <option value="vigilante">
      Vigia Armado (Prestador)
    </option>
  `;

  empresas.forEach((emp) => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = emp.nome;
    select.appendChild(option);
  });
}

// ============================
// FORMATADORES (NÃO MEXI)
// ============================
function parseDataFlexivel(texto) {
  if (!texto) return "";

  texto = texto.trim();

  // formato BR: 25/06/2026 15:12
  const br = texto.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})[^\d]*(\d{1,2}):(\d{2})/,
  );

  if (br) {
    let [, dia, mes, ano, hora, min] = br;

    if (ano.length === 2) ano = "20" + ano;

    const d = new Date(
      `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}T${hora.padStart(
        2,
        "0",
      )}:${min}`,
    );

    if (!isNaN(d)) {
      return d.toISOString().slice(0, 16);
    }
  }

  // fallback
  const d2 = new Date(texto);
  if (!isNaN(d2)) {
    return d2.toISOString().slice(0, 16);
  }

  return "";
}

function formatDateTimeLocal(value) {
  const d = new Date(value);
  if (isNaN(d)) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()} - ${String(d.getHours()).padStart(
    2,
    "0",
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatMoney(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ============================
// VARIÁVEIS
// ============================
const container = document.getElementById("agentes-container");

// ============================
// SELECT CHANGE
// ============================
document.getElementById("empresa").addEventListener("change", (e) => {
  document.getElementById("vigilante-config").style.display = "none";
  document.getElementById("vigia-armado-config").style.display = "none";

  if (e.target.value === "vigilante") {
    document.getElementById("vigilante-config").style.display = "block";
  }

  if (e.target.value === "vigia_armado") {
    document.getElementById("vigia-armado-config").style.display = "block";
  }
});

// ============================
// ADD AGENTE (SEM ALTERAR)
// ============================
document.getElementById("addAgente").addEventListener("click", () => {
  const numeroAgente = document.querySelectorAll(".agente").length + 1;

  let rendHTML = "";

  if (numeroAgente > 1) {
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
      <h3>Agente ${numeroAgente}</h3>

      <label>Hora Saída <input type="datetime-local" class="inicio"></label>
      <label>Hora Término <input type="datetime-local" class="fim"></label>

      <label>KM Saída <input type="number" class="kmInicio" value="0"></label>
      <label>KM Término <input type="number" class="kmFim" value="0"></label>

      <label>Pedágios <input type="number" class="qtdPed" value="0"></label>
      <label>Valor Pedágio <input type="number" class="valorPed" value="0"></label>

      ${rendHTML}
    </div>
  `,
  );
  renumerarAgentes();
});

function renumerarAgentes() {
  document.querySelectorAll(".agente").forEach((agente, index) => {
    agente.querySelector("h3").textContent = `Agente ${index + 1}`;
  });
}

container.addEventListener("click", (e) => {
  if (e.target.classList.contains("botaoRemover")) {
    e.target.closest(".agente").remove();

    renumerarAgentes();
  }
});
// ============================
// CALCULO (INTACTO - SEU ORIGINAL)
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
      : empresas.find((e) => String(e.id) === emp);

  const agentesDOM = [...document.querySelectorAll(".agente")];
  if (!agentesDOM.length) return alert("Adicione agentes");

  let grupos = [];
  let grupoAtual = null;

  agentesDOM.forEach((div, i) => {
    const ini = new Date(div.querySelector(".inicio").value);
    const fim = new Date(div.querySelector(".fim").value);

    if (isNaN(ini) || isNaN(fim)) {
      alert(`Preencha data e hora do Agente ${i + 1}`);
      throw new Error("Datas inválidas");
    }

    const dados = {
      id: i + 1,
      ini,
      fim,
      kmI: +div.querySelector(".kmInicio").value || 0,
      kmF: +div.querySelector(".kmFim").value || 0,
      qtdPed: +div.querySelector(".qtdPed").value || 0,
      vPed: +div.querySelector(".valorPed").value || 0,
      isRendicao: div.querySelector(".rendicaoDoAnterior")?.checked || false,
    };

    if (!dados.isRendicao || !grupoAtual) {
      grupoAtual = { pai: dados, rendicoes: [] };
      grupos.push(grupoAtual);
    } else {
      grupoAtual.rendicoes.push(dados);
    }
  });

  let totalGeral = 0;
  let resumoHTML = "";

  grupos.forEach((grupo, idxGrupo) => {
    const agentes = [grupo.pai, ...grupo.rendicoes];
    const temRendicao = grupo.rendicoes.length > 0;
    const horaInicialGrupo = agentes[0].ini;
    const horaFinalGrupo = agentes[agentes.length - 1].fim;

    const kmInicialGrupo = agentes[0].kmI;
    const kmFinalGrupo = agentes[agentes.length - 1].kmF;

    const minutosTotal = agentes.reduce((s, a) => {
      return s + Math.round((a.fim - a.ini) / 60000);
    }, 0);

    const horasTotal = minutosTotal / 60;

    const minutosFranquia = conf.fHora * 60;
    const minutosAbatidos = Math.min(minutosTotal, minutosFranquia);
    const minutosExtra = Math.max(0, minutosTotal - minutosFranquia);

    const kmTotal = agentes.reduce((s, a) => s + (a.kmF - a.kmI), 0);

    const kmExtra = Math.max(0, kmTotal - conf.fKm);

    const valorHoras = (minutosExtra / 60) * conf.vHora;
    const valorKM = kmExtra * conf.vKm;
    let totalPedagiosGrupo = 0;
    let totalAcionamentosGrupo = 0;

    agentes.forEach((ag, idx) => {
      const minutosAg = Math.round((ag.fim - ag.ini) / 60000);
      const horasAg = minutosAg / 60;
      const kmAg = ag.kmF - ag.kmI;
      const pedagio = ag.qtdPed * ag.vPed;
      const acion = ag.isRendicao ? 0 : conf.acion;

      const franquiaHoras = formatDuration(minutosFranquia);
      const horasTotal = formatDuration(minutosAg);
      const horasCobradas = formatDuration(minutosExtra);

      const franquiaKm = conf.fKm.toFixed(2);
      const kmTotalAg = kmAg.toFixed(2);
      const kmCobrados = kmExtra.toFixed(2);

      const custoHora = horasAg * conf.vHora;
      const custoKM = kmAg * conf.vKm;

      let totalAg;

      if (temRendicao) {
        totalAg = custoHora + custoKM + acion + pedagio;
      } else {
        totalAg = acion + pedagio + valorHoras + valorKM;
      }

      totalPedagiosGrupo += pedagio;
      totalAcionamentosGrupo += acion;

      if (temRendicao) {
        resumoHTML += `
<strong>Agente ${ag.id}${ag.isRendicao ? " (RENDIÇÃO)" : ""}</strong><br><br>

Hora Inicial: ${formatDateTimeLocal(ag.ini)}<br>
Hora Final: ${formatDateTimeLocal(ag.fim)}<br>
Total Horas: ${formatDuration(minutosAg)}<br><br>

KM Inicial: ${ag.kmI.toFixed(2)}<br>
KM Final: ${ag.kmF.toFixed(2)}<br>
Total KM: ${kmAg.toFixed(2)} km<br><br>

Horas: ${formatMoney(custoHora)}<br>
KM: ${formatMoney(custoKM)}<br>
Acionamento: ${formatMoney(acion)}<br>
Pedágios: ${formatMoney(pedagio)}<br><br>

<strong>Subtotal Agente:</strong>
${formatMoney(totalAg)}

<hr>
`;
      } else {
        resumoHTML += `
    <strong>Agente ${ag.id}</strong><br><br>

    <strong>HORAS</strong><br><br>

    Hora Inicial: ${formatDateTimeLocal(ag.ini)}<br>
    Hora Final: ${formatDateTimeLocal(ag.fim)}<br><br>

    Total Horas: ${formatDuration(minutosAg)}<br>
    (-) Franquia: ${formatDuration(minutosFranquia)}<br>
    Horas Cobradas: ${formatDuration(minutosExtra)}<br><br>

    ${formatDuration(minutosExtra)} × ${formatMoney(conf.vHora)} =
    <strong>${formatMoney(valorHoras)}</strong>

    <hr>

    <strong>KM</strong><br><br>

    KM Inicial: ${ag.kmI.toFixed(2)}<br>
    KM Final: ${ag.kmF.toFixed(2)}<br><br>

    Total KM: ${kmAg.toFixed(2)} km<br>
    (-) Franquia: ${conf.fKm.toFixed(2)} km<br>
    KM Cobrados: ${kmExtra.toFixed(2)} km<br><br>

    ${kmExtra.toFixed(2)} × ${formatMoney(conf.vKm)} =
    <strong>${formatMoney(valorKM)}</strong>

    <hr>

    Acionamento: ${formatMoney(acion)}<br>
    Pedágios: ${formatMoney(pedagio)}<br><br>

    <strong>Subtotal Agente:</strong> ${formatMoney(totalAg)}

    <hr>
    `;
      }
    });
    if (temRendicao) {
      resumoHTML += `
<h3>Grupo ${idxGrupo + 1}</h3>

<strong>HORAS</strong><br><br>

${agentes
  .map(
    (ag) =>
      `Agente ${ag.id}: ${formatDuration(
        Math.round((ag.fim - ag.ini) / 60000),
      )}`,
  )
  .join("<br>")}

<br><br>

Total Horas: ${formatDuration(minutosTotal)}<br>
(-) Franquia: ${formatDuration(minutosFranquia)}<br>
Horas Cobradas: ${formatDuration(minutosExtra)}<br><br>

${formatDuration(minutosExtra)} × ${formatMoney(conf.vHora)}
=
<strong>${formatMoney(valorHoras)}</strong>

<hr>

<strong>KM</strong><br><br>

${agentes
  .map((ag) => `Agente ${ag.id}: ${(ag.kmF - ag.kmI).toFixed(2)} km`)
  .join("<br>")}

<br><br>

Total KM: ${kmTotal.toFixed(2)} km<br>
(-) Franquia: ${conf.fKm.toFixed(2)} km<br>
KM Cobrados: ${kmExtra.toFixed(2)} km<br><br>

${kmExtra.toFixed(2)} × ${formatMoney(conf.vKm)}
=
<strong>${formatMoney(valorKM)}</strong>

<hr>

<strong>Pedágios:</strong> ${formatMoney(totalPedagiosGrupo)}<br>

<strong>Acionamentos:</strong> ${formatMoney(totalAcionamentosGrupo)}<br><br>

<strong>Total Grupo:</strong>
${formatMoney(
  valorHoras + valorKM + totalPedagiosGrupo + totalAcionamentosGrupo,
)}

<hr><hr>
`;
    }

    totalGeral +=
      valorHoras + valorKM + totalPedagiosGrupo + totalAcionamentosGrupo;
  });

  resumoHTML += `<h2>Total Geral da Operação: R$ ${totalGeral.toFixed(2)}</h2>`;
  document.getElementById("resumoTotal").innerHTML = resumoHTML;
});

// ============================
// CRUD EVENTS SUPABASE
// ============================
document.getElementById("salvarEmpresa").addEventListener("click", async () => {
  const nome = document.getElementById("empNome").value.trim();
  if (!nome) return alert("Informe o nome");

  const dados = {
    nome,
    fHora: Number(empFrHora.value),
    fKm: Number(empFrKm.value),
    vHora: Number(empValorHora.value),
    vKm: Number(empValorKm.value),
    acion: Number(empAcion.value),
  };

  await salvarEmpresaSupabase(dados);

  document.getElementById("modalCadastroEmpresa").classList.remove("show");
});

// editar/excluir
document
  .getElementById("listaEmpresas")
  .addEventListener("click", async (e) => {
    const id = Number(e.target.dataset.id);

    if (e.target.classList.contains("btnEditar")) {
      const emp = empresas.find((e) => e.id === id);
      empresaEditando = id;

      empNome.value = emp.nome;
      empFrHora.value = emp.fHora;
      empFrKm.value = emp.fKm;
      empValorHora.value = emp.vHora;
      empValorKm.value = emp.vKm;
      empAcion.value = emp.acion;

      document.getElementById("modalCadastroEmpresa").classList.add("show");
    }

    if (e.target.classList.contains("btnExcluir")) {
      if (confirm("Excluir empresa?")) {
        await excluirEmpresaSupabase(id);
      }
    }
  });

// ============================
// INIT
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  await carregarEmpresas();

  if (!sessionStorage.getItem("calculadoraVisitada")) {
    await registrarAcesso("calculadora");
    sessionStorage.setItem("calculadoraVisitada", "true");
  }
});
container.addEventListener("paste", (e) => {
  const el = e.target;

  if (
    !el ||
    (!el.classList.contains("inicio") && !el.classList.contains("fim"))
  )
    return;

  const texto = (e.clipboardData || window.clipboardData).getData("text");

  const convertido = parseDataFlexivel(texto);

  if (!convertido) return;

  e.preventDefault();
  el.value = convertido;
});
// ============================
// MODAIS
// ============================

const btnConfig = document.getElementById("btnConfig");
const modalEmpresas = document.getElementById("modalEmpresas");
const modalCadastroEmpresa = document.getElementById("modalCadastroEmpresa");
const btnSuporte = document.getElementById("btnSuporte");
const modalSuporte = document.getElementById("modalSuporte");
const fecharSuporte = document.getElementById("fecharSuporte");

const fecharEmpresas = document.getElementById("fecharEmpresas");
const fecharCadastroEmpresa = document.getElementById("fecharCadastroEmpresa");

const novaEmpresa = document.getElementById("novaEmpresa");

// abrir lista de empresas
btnConfig.addEventListener("click", () => {
  modalEmpresas.classList.add("show");
});
btnSuporte.addEventListener("click", () => {
  modalSuporte.classList.add("show");
});

// fechar lista de empresas
fecharEmpresas.addEventListener("click", () => {
  modalEmpresas.classList.remove("show");
});

// abrir cadastro de empresa
novaEmpresa.addEventListener("click", () => {
  empresaEditando = null;

  empNome.value = "";
  empFrHora.value = 0;
  empFrKm.value = 0;
  empValorHora.value = 0;
  empValorKm.value = 0;
  empAcion.value = 0;

  modalCadastroEmpresa.classList.add("show");
});

// fechar cadastro
fecharCadastroEmpresa.addEventListener("click", () => {
  modalCadastroEmpresa.classList.remove("show");
});
fecharSuporte.addEventListener("click", () => {
  modalSuporte.classList.remove("show");
});
// fechar clicando fora
window.addEventListener("click", (e) => {
  if (e.target === modalEmpresas) {
    modalEmpresas.classList.remove("show");
  }

  if (e.target === modalCadastroEmpresa) {
    modalCadastroEmpresa.classList.remove("show");
  }

  if (e.target === modalSuporte) {
    modalSuporte.classList.remove("show");
  }
});
container.addEventListener("paste", (e) => {
  const el = e.target;

  if (!el.classList.contains("inicio") && !el.classList.contains("fim")) return;

  const texto = (e.clipboardData || window.clipboardData).getData("text");

  const convertido = parseDataFlexivel(texto);

  if (!convertido) return;

  e.preventDefault();
  el.value = convertido;
});

document.getElementById("enviarSuporte").addEventListener("click", async () => {
  const tipo = document.getElementById("tipoSuporte").value;
  const nome = document.getElementById("inputSup").value.trim();
  const descricao = document.getElementById("descricaoSuporte").value.trim();

  if (!descricao) {
    alert("Descreva o problema ou a melhoria.");
    return;
  }

  const { error } = await supabaseClient.from("chamados").insert([
    {
      tipo,
      nome,
      descricao,
      status: "Aberto",
    },
  ]);

  if (error) {
    console.error(error);
    alert("Erro ao enviar o chamado.");
    return;
  }

  alert("Chamado enviado com sucesso!");

  document.getElementById("tipoSuporte").value = "Bug";
  document.getElementById("inputSup").value = "";
  document.getElementById("descricaoSuporte").value = "";

  modalSuporte.classList.remove("show");
});
