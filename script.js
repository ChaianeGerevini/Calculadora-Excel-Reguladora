const supabaseUrl = "https://lblnsalijvhzcrhmmmvt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibG5zYWxpanZoemNyaG1tbXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODgxODEsImV4cCI6MjA5NTY2NDE4MX0.gWWWqm9ZAcndxhPMIy2Muf8WJLhxwRDFfoT9WJ7gmo8";

const supabaseClient = supabase.createClient(
  supabaseUrl,
  supabaseKey
);


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

  empresas = data.map(e => ({
    id: e.id,
    nome: e.nome,
    fHora: e.fhora,
    fKm: e.fkm,
    vHora: e.vhora,
    vKm: e.vkm,
    acion: e.acion
  }));

  atualizarSelectEmpresas();
  renderizarEmpresas();
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
        acion: dados.acion
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
        acion: dados.acion
      }
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
  const { error } = await supabaseClient
    .from("empresas")
    .delete()
    .eq("id", id);

  if (error) console.error(error);

  await carregarEmpresas();
}

// ============================
// RENDER
// ============================
function renderizarEmpresas() {
  const lista = document.getElementById("listaEmpresas");
  lista.innerHTML = "";

  empresas.forEach(emp => {
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
      `
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
    <option value="vigia_armado">
      Vigia Armado (Prestador)
    </option>
  `;

  empresas.forEach(emp => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = emp.nome;
    select.appendChild(option);
  });
}

// ============================
// FORMATADORES (NÃO MEXI)
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
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
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

  const numeroAgente =
    document.querySelectorAll(".agente").length + 1;

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
  `
  );
  renumerarAgentes();
});

function renumerarAgentes() {
  document.querySelectorAll(".agente").forEach((agente, index) => {
    agente.querySelector("h3").textContent =
      `Agente ${index + 1}`;
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

  let conf;

if (emp === "vigia_armado") {

  conf = {
    fHora: Number(document.getElementById("va_fHora").value) || 0,
    fKm: Number(document.getElementById("va_fKm").value) || 0,
    vHora: Number(document.getElementById("va_vHora").value) || 0,
    vKm: Number(document.getElementById("va_vKm").value) || 0,
    acion: Number(document.getElementById("va_acion").value) || 0
  };

} else {

  conf = empresas.find(e => String(e.id) === emp);

  if (!conf) {
    return alert("Empresa não encontrada");
  }

}

  const agentesDOM = [...document.querySelectorAll(".agente")];
  if (!agentesDOM.length) return alert("Adicione agentes");

  const agentes = agentesDOM.map((div, idx) => {
    const inicio = new Date(div.querySelector(".inicio").value);
    const fim = new Date(div.querySelector(".fim").value);

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
      rend
    };
  });

  const grupos = [];
  let atual = [agentes[0]];

  for (let i = 1; i < agentes.length; i++) {
    if (agentes[i].rend) atual.push(agentes[i]);
    else {
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

    const franquiaMin = conf.fHora * 60;
    const minutosCobrados = Math.max(0, minutosGrupo - franquiaMin);

    const franquiaKm = conf.fKm;
    const kmCobrados = Math.max(0, kmGrupo - franquiaKm);

    const valorHora = (minutosCobrados / 60) * conf.vHora;
    const valorKm = kmCobrados * conf.vKm;
    const totalGrupo = conf.acion + valorHora + valorKm + pedGrupo;

    totalGeral += totalGrupo;

  out += `
  <div class="resumo-grupo-totais">

    <h3>Resumo do Grupo ${gi + 1}</h3>

    <p><strong>Horas grupo:</strong> ${formatDuration(minutosGrupo)}</p>

    <p><strong>Cobrado:</strong>
      ${formatDuration(minutosGrupo)}
      -
      ${formatDuration(franquiaMin)}
      =
      ${formatDuration(minutosCobrados)}
    </p>

    <p><strong>KM grupo:</strong> ${kmGrupo}</p>

    <p><strong>KM cobrados:</strong>
      ${kmGrupo}
      -
      ${franquiaKm}
      =
      ${kmCobrados}
    </p>

    <p><strong>Acionamento:</strong> ${formatMoney(conf.acion)}</p>
    <p><strong>Hora:</strong> ${formatMoney(valorHora)}</p>
    <p><strong>KM:</strong> ${formatMoney(valorKm)}</p>
    <p><strong>Pedágios:</strong> ${formatMoney(pedGrupo)}</p>

    <h4>Total grupo:</h4>
    <p class="total-grupo-valor">
      ${formatMoney(totalGrupo)}
    </p>

  </div>
</div>
`;
  });

  out += `
  <h1 class="total-geral">
    Total Geral: ${formatMoney(totalGeral)}
  </h1>
`;

  document.getElementById("resultado").innerHTML = out;
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
    acion: Number(empAcion.value)
  };

  await salvarEmpresaSupabase(dados);

  document.getElementById("modalCadastroEmpresa").classList.remove("show");
});

// editar/excluir
document.getElementById("listaEmpresas").addEventListener("click", async (e) => {
  const id = Number(e.target.dataset.id);

  if (e.target.classList.contains("btnEditar")) {
    const emp = empresas.find(e => e.id === id);
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
document.addEventListener("DOMContentLoaded", carregarEmpresas);

// ============================
// MODAIS
// ============================
console.log("CHEGUEI NOS MODAIS");

const btnConfig = document.getElementById("btnConfig");
const modalEmpresas = document.getElementById("modalEmpresas");
const modalCadastroEmpresa = document.getElementById("modalCadastroEmpresa");

const fecharEmpresas = document.getElementById("fecharEmpresas");
const fecharCadastroEmpresa = document.getElementById("fecharCadastroEmpresa");

const novaEmpresa = document.getElementById("novaEmpresa");

// abrir lista de empresas
btnConfig.addEventListener("click", () => {
  console.log("CLICOU");
  modalEmpresas.classList.add("show");

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

// fechar clicando fora
window.addEventListener("click", (e) => {
  if (e.target === modalEmpresas) {
    modalEmpresas.classList.remove("show");
  }

  if (e.target === modalCadastroEmpresa) {
    modalCadastroEmpresa.classList.remove("show");
  }
});