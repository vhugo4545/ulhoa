// ✅ Controle de Produtos
let includedProducts = [];
let draggedIndex = null;

// ✅ Adicionar Produto
function adicionarProduto(produtos) {
  if (!produto || !produto.name) return;
  const grupoSelecionado = document.getElementById("dropdownClassesBtn")?.textContent?.trim();
  if (!grupoSelecionado || grupoSelecionado === "Escolher Classe") {
    alert("⚠️ Por favor, selecione uma classe antes de adicionar o produto.");
    return;
  }
  const grupo = grupoSelecionado;
  const index = includedProducts.length;
  includedProducts.push({
    ...produto,
    class: grupo,
    index,
    quantity: 0,
    ordem: `${grupo}.${index + 1}`,
    custoFormula: produto.cost?.toString() || "",
    vendaFormula: produto.price?.toString() || "",
    descricao: produto.name || "",
    codigoOmie: produto.codigo_produto || "",
    adjustedQuantityFormula: ""
  });
  console.log(produtos)
  renderIncludedProducts(produto);
 
}

// ✅ Agrupar por classe
function agruparPorClasse(lista) {
  return lista.reduce((acc, produto) => {
    const grupo = produto.class;
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(produto);
    return acc;
  }, {});
}

// ✅ Função para limpar nome para exibição
function formatarNomeGrupo(nome) {
  const manterParenteses = nome.match(/\(\d+\)$/)?.[0] || "";
  const nomeBase = nome
    .replace(/[-_]+/g, ' ')                 // substitui hífens e underscores por espaço
    .replace(/\s*\(\d+\)$/, '')            // remove temporariamente o (2)
    .replace(/(?<=\D)(\d{6,})$/, '')       // remove sufixo numérico longo
    .trim();
  const capitalizado = nomeBase.replace(/\b\w/g, l => l.toUpperCase());
  return capitalizado + manterParenteses;
}




// ✅ Reordenar Linhas
function handleDragStart(event, index) {
  draggedIndex = index;
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(event, targetIndex) {
  if (draggedIndex === null || draggedIndex === targetIndex) return;

  const draggedItem = includedProducts.find(p => p.index === draggedIndex);
  const targetItem = includedProducts.find(p => p.index === targetIndex);
  if (!draggedItem || !targetItem || draggedItem.class !== targetItem.class) return;

  const grupo = draggedItem.class;

  // 🧠 Atualiza includedProducts
  const grupoProdutos = includedProducts.filter(p => p.class === grupo);
  const outros = includedProducts.filter(p => p.class !== grupo);

  const novaOrdem = [...grupoProdutos];
  const fromIdx = novaOrdem.findIndex(p => p.index === draggedIndex);
  const toIdx = novaOrdem.findIndex(p => p.index === targetIndex);

  const [moved] = novaOrdem.splice(fromIdx, 1);
  novaOrdem.splice(toIdx, 0, moved);

  novaOrdem.forEach((prod, i) => {
    prod.ordem = `${grupo}.${i + 1}`;
  });

  includedProducts = [...outros, ...novaOrdem];

  // 🧾 Reorganiza DOM manualmente (antes das linhas de observações e totais)
  const tabela = document.querySelector(`.grupo-tabela[data-group="${grupo}"] .included-group-table tbody`);

  const todasLinhas = Array.from(tabela.querySelectorAll("tr"));
  const linhasFixas = todasLinhas.filter(tr => tr.classList.contains("extra-summary-row") || tr.classList.contains("editable-observacoes"));
  const linhaReferencia = linhasFixas[0]; // primeiro fixa (total)

  const linhasProdutos = todasLinhas.filter(tr =>
    !tr.classList.contains("extra-summary-row") &&
    !tr.classList.contains("editable-observacoes")
  );

  const novasLinhas = novaOrdem.map(prod => {
    return linhasProdutos.find(tr => Number(tr.dataset.index) === prod.index);
  });

  // 🧹 Reinsere as linhas na nova ordem antes da primeira linha fixa
  novasLinhas.forEach(linha => {
    if (linha && linhaReferencia) {
      tabela.insertBefore(linha, linhaReferencia);
    }
  });

  // (opcional) Atualiza ordem visível nas colunas, se desejar:
  novasLinhas.forEach((linha, i) => {
    const ordemDiv = linha.querySelector(".ordem-cell");
    if (ordemDiv) ordemDiv.textContent = `${grupo}.${i + 1}`;
  });

  draggedIndex = null;
}


function removeProduct(index) {
  const linha = document.querySelector(`tr[data-index='${index}']`);
  if (!linha) {
    console.warn(`⚠️ Linha com index ${index} não encontrada no DOM.`);
    return;
  }

  // 🗑️ Remove a linha do DOM
  const tabela = linha.closest("table");
  const grupoWrapper = linha.closest(".grupo-tabela");
  linha.remove();
  console.log(`🗑️ Linha do produto (index ${index}) removida do DOM.`);

  // 🔍 Verifica se ainda há outras linhas de produto na tabela
  const aindaTemProdutos = tabela.querySelectorAll("tbody tr:not(.extra-summary-row):not(.extra-summary-row ~ tr)").length > 0;

  if (!aindaTemProdutos && grupoWrapper) {
    grupoWrapper.remove();
    console.log("🧺 Tabela do grupo removida do DOM (sem mais produtos).");
  }
}


// ✅ Duplicar Grupo
function duplicarGrupo(grupoNome) {
  console.log("📄 Duplicando grupo:", grupoNome);
  if (!grupoNome) return;

  const produtosOriginais = includedProducts.filter(p => p.class === grupoNome);
  if (!produtosOriginais.length) {
    return alert(`⚠️ Nenhum produto encontrado no grupo "${grupoNome}".`);
  }

  // 🔁 Gera novo nome visual único
  const nomesVisuaisExistentes = includedProducts.map(p => p.class);
  let contador = 2;
  let nomeVisual = `${grupoNome} (${contador})`;
  while (nomesVisuaisExistentes.includes(nomeVisual)) {
    contador++;
    nomeVisual = `${grupoNome} (${contador})`;
  }

  // 📦 Clona os produtos do grupo original
  const novoGrupoProdutos = produtosOriginais.map((p, i) => {
    const novoIndex = Date.now() + i; // 🔐 Garante index único e estável
    return {
      ...structuredClone(p),
      class: nomeVisual,
      grupoInterno: p.grupoInterno || grupoNome,
      index: novoIndex,
      ordem: `${nomeVisual}.${i + 1}`
    };
  });

  // ➕ Adiciona ao array principal
  includedProducts = [...includedProducts, ...novoGrupoProdutos];

  // 🔁 Re-renderiza tudo
  renderIncludedProducts();
  listarProdutosEmDropdown?.();
  atualizarDatalistAmbientes?.();

  console.log(`📑 Grupo duplicado: "${grupoNome}" → "${nomeVisual}"`);
}

// ✅ Dropdown de Classe
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#dropdownClassesList a").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("dropdownClassesBtn").textContent = e.target.textContent;
    });
  });
});
