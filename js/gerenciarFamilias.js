// ✅ Exibir lista de tabelas com campo "Ambiente" e suporte a reorganização
let draggedTable = null;
const ambientesPorGrupo = {}; // ⬅️ Armazena os ambientes manualmente definidos

function formatarNomeGrupo(nome) {
  const manterParenteses = nome.match(/\(\d+\)$/)?.[0] || "";
  const nomeBase = nome
    .replace(/\d+(?!\))/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s*\(\d+\)$/, '')
    .trim();
  const capitalizado = nomeBase.replace(/\b\w/g, l => l.toUpperCase());
  return capitalizado + manterParenteses;
}

function listarTabelasExistentes() {
  const lista = document.getElementById("lista-grupos-renderizados");
  if (!lista) return;

  const gruposUnicos = [...new Set(includedProducts.map(p => p.class))];

  lista.innerHTML = "";

  gruposUnicos.forEach(grupo => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex flex-column gap-2 border rounded p-2 mb-2 bg-white";
    li.draggable = true;
    li.dataset.grupo = grupo;

    li.ondragstart = () => draggedTable = grupo;
    li.ondragover = e => e.preventDefault();
    li.ondrop = () => reorderTabelas(grupo);

    const nomeVisivel = formatarNomeGrupo(grupo);

    const header = document.createElement("div");
    header.className = "d-flex justify-content-between align-items-center";
    header.innerHTML = `
      <strong>${nomeVisivel}</strong>
      <span class="badge bg-secondary">
        ${includedProducts.filter(p => p.class === grupo).length} itens
      </span>
    `;

    const campo = document.createElement("input");
    campo.className = "form-control form-control-sm";
    campo.placeholder = "Ambiente (exibido na tabela)";
    campo.value = ambientesPorGrupo[grupo] || obterValorAmbienteAtual(grupo);
    campo.oninput = () => {
      ambientesPorGrupo[grupo] = campo.value;
      preencherCampoAmbienteVisual(grupo, campo.value);
    };

    const btnDuplicar = document.createElement("button");
    btnDuplicar.className = "btn btn-sm btn-outline-dark";
    btnDuplicar.innerHTML = `<i class='fas fa-clone'></i>`;
    btnDuplicar.title = "Duplicar Grupo";
    btnDuplicar.onclick = () => duplicarGrupo(grupo);

    const btnAbrir = document.createElement("button");
    btnAbrir.className = "btn btn-sm btn-outline-dark";
    btnAbrir.innerHTML = `<i class='fas fa-folder-open'></i>`;
    btnAbrir.title = "Abrir Grupo";
    btnAbrir.onclick = () => abrirPopupInfo(grupo);

    li.appendChild(header);
    const acoesWrapper = document.createElement("div");
    acoesWrapper.className = "d-flex gap-2 align-items-center";
    acoesWrapper.appendChild(campo);
    acoesWrapper.appendChild(btnDuplicar);
    acoesWrapper.appendChild(btnAbrir);
    li.appendChild(acoesWrapper);
    lista.appendChild(li);

    // Aguarda meio segundo, preenche o ambiente e reorganiza as tabelas
    setTimeout(() => {
      const valor = ambientesPorGrupo[grupo] || campo.value;
      preencherCampoAmbienteVisual(grupo, valor);
      reorganizarTabelasPelaLista();
    }, 500);
  });
}

function preencherCampoAmbienteVisual(grupo, valor) {
  const wrapper = document.querySelector(`#included-products-container [data-group="${grupo}"]`);
  const campo = wrapper?.querySelector(".d-flex.align-items-center.gap-2.mb-2 input");
  if (campo) campo.value = valor;
}

function obterValorAmbienteAtual(grupo) {
  const wrapper = document.querySelector(`#included-products-container [data-group="${grupo}"]`);
  const campo = wrapper?.querySelector(".d-flex.align-items-center.gap-2.mb-2 input");
  return campo?.value || "";
}

function reorderTabelas(grupoDestino) {
  if (!draggedTable || draggedTable === grupoDestino) return;

  const lista = document.getElementById("lista-grupos-renderizados");
  const items = Array.from(lista.querySelectorAll("li"));
  const ordem = items.map(el => el.dataset.grupo);

  const fromIdx = ordem.indexOf(draggedTable);
  const toIdx = ordem.indexOf(grupoDestino);
  ordem.splice(toIdx, 0, ordem.splice(fromIdx, 1)[0]);

  const novaHTML = ordem.map(grupo => {
    const el = items.find(i => i.dataset.grupo === grupo);
    return el;
  });

  lista.innerHTML = "";
  novaHTML.forEach(el => lista.appendChild(el));
  draggedTable = null;
  reorganizarTabelasPelaLista();
}

function reorganizarTabelasPelaLista() {
  const lista = document.getElementById("lista-grupos-renderizados");
  const container = document.getElementById("included-products-container");
  if (!lista || !container) return;

  const novaOrdemGrupos = Array.from(lista.querySelectorAll("li")).map(li => li.dataset.grupo);

  const elementosOrdenados = novaOrdemGrupos.map(grupo => {
    return container.querySelector(`[data-group="${grupo}"]`);
  }).filter(Boolean);

  elementosOrdenados.forEach(el => container.appendChild(el));

  // Atualiza os campos "Ambiente" na tabela
  novaOrdemGrupos.forEach(grupo => {
    const valor = ambientesPorGrupo[grupo];
    if (valor) preencherCampoAmbienteVisual(grupo, valor);
  });

  console.log("🔃 Tabelas reorganizadas conforme a ordem da lista lateral.");
}
