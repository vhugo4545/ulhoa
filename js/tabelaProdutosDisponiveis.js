let products = [];

/**
 * Carrega os produtos da API e armazena no array global `products`.
 */
async function carregarProdutos() {
  try {
    const res = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/produtos/visualizar");
    if (!res.ok) throw new Error("Erro ao buscar produtos");

    const dados = await res.json();
    if (!Array.isArray(dados)) throw new Error("Resposta inválida da API");

    products = dados.map(prod => ({
      name: prod.descricao || "Sem nome",
      price: parseFloat(prod.valor_unitario) || 0,
      cost: parseFloat(prod.valor_unitario) || 0,
      class: prod.descricao_familia || "Sem Classe",
      codigo_produto: prod.codigo_produto || ""
    }));

    window.products = products; // 🔒 Expor no escopo global

    console.log(`✅ ${products.length} produtos carregados com sucesso.`);
    console.table(products);
  } catch (err) {
    console.error("❌ Erro ao carregar produtos:", err);
    alert("Erro ao carregar produtos disponíveis.");
  }
}

/**
 * Filtra os produtos com base no termo de busca.
 */
function filterProducts() {
  const termo = document.getElementById("product-search")?.value?.toLowerCase() || "";
  const tabela = document.querySelector("#search-results tbody");

  if (!tabela) {
    console.warn("⚠️ Tabela de resultados não encontrada.");
    return;
  }

  tabela.innerHTML = "";

  if (termo.length < 3) {
    const row = tabela.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 5;
    cell.textContent = "Digite ao menos 3 letras para buscar produtos.";
    return;
  }

  const filtrados = products
    .map((produto, index) => ({ ...produto, index }))
    .filter(p => p.name.toLowerCase().includes(termo));


  if (filtrados.length === 0) {
    const row = tabela.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 5;
    cell.textContent = "Nenhum produto encontrado.";
    return;
  }

  filtrados.forEach(produto => {
    const row = tabela.insertRow();
    row.innerHTML = `
      <td>${produto.name}</td>
      <td>R$ ${produto.cost.toFixed(2).replace(".", ",")}</td>
      <td>R$ ${produto.price.toFixed(2).replace(".", ",")}</td>
      <td>${produto.codigo_produto}</td>
      <td><button class="btn btn-primary btn-sm" data-index="${produto.index}">Incluir</button></td>
    `;

    const btn = row.querySelector("button");
    if (btn) {
      btn.addEventListener("click", () => {
        console.log(`🟦 Clique no botão incluir do produto "${produto.name}" (index: ${produto.index})`);
        adicionarProdutoDisponivel(produto.index);
      });
    } else {
      console.warn("⚠️ Botão incluir não encontrado na linha:", row);
    }
  });
}

/**
 * Adiciona o produto selecionado à tabela principal.
 */
function adicionarProdutoDisponivel(index) {
  const produto = products[index];
  console.log("📦 Produto selecionado:", produto);

  if (!produto) {
    console.warn(`⚠️ Produto com índice inválido: ${index}`);
    return;
  }

  const grupoSelecionado = document
    .getElementById("dropdownClassesBtn")?.textContent?.trim();

  if (!grupoSelecionado || grupoSelecionado === "Escolher Grupo") {
    alert("⚠️ Selecione uma tabela no dropdown antes de incluir o produto.");
    return;
  }

  /* 🔍 Localiza (ou cria via render) a tabela */
  const tabelaAlvo = localizarOuCriarTabela(grupoSelecionado);
  if (!tabelaAlvo) {
    console.warn(`⚠️ Não foi possível preparar a tabela “${grupoSelecionado}”.`);
    return;
  }

  const tbody = tabelaAlvo.querySelector("tbody");
  if (!tbody) {
    console.warn("⚠️ Corpo da tabela não encontrado.");
    return;
  }

  /* ── Insere a nova linha ─────────────────────────────── */
  const novaLinha = document.createElement("tr");
  novaLinha.setAttribute("draggable", "true");
  novaLinha.classList.add("draggable-row");

  novaLinha.innerHTML = `
    <td class="d-none"><div class="ordem-cell">-</div></td>
    <td contenteditable="true" class="editable-utilizacao"></td>
    <td contenteditable="true" class="editable-descricao">${produto.name}</td>
    <td><div>R$ 0,00</div></td>
    <td><div>R$ ${(produto.cost || 0).toFixed(2).replace(".", ",")}</div></td>
    <td><div>${produto.codigo_produto}</div></td>
    <td contenteditable="true" class="quantidade-fixa">1</td>
    <td>
      <div class="formula-input" contenteditable="true" style="display:none;"></div>
      <div class="formula-result" style="cursor:pointer;">0</div>
    </td>
    <td><button class="remove-product btn btn-sm btn-danger">Remover</button></td>
  `;

  const linhaResumo = tbody.querySelector(".extra-summary-row");
  tbody.insertBefore(novaLinha, linhaResumo ?? null);

  console.log(`✅ Produto “${produto.name}” inserido na tabela “${grupoSelecionado}”.`);

  ativarCamposFormulaEditaveis();
  configurarDragAndDropLinhas();
}
function localizarOuCriarTabela(nomeGrupo) {
  /* 2.1 – Procura tabela já existente ---------------------------- */
  const sel = `#included-products-container .grupo-tabela[data-group="${nomeGrupo}"] table`;
  const encontrada = document.querySelector(sel);
  if (encontrada) return encontrada;

  /* 2.2 – Nomes bloqueados (“Produto”, “Produtos”...) ------------- */
  const bloqueados = [/^produto$/i, /^produtos?$/i];
  if (bloqueados.some(rx => rx.test(nomeGrupo))) {
    alert("⚠️ Este nome é reservado. Escolha outro grupo antes de incluir produtos.");
    return null;
  }

  /* 2.3 – Cria entrada vazia em includedProducts (caso não exista) */
  if (!includedProducts.some(p => p.class === nomeGrupo)) {
    includedProducts.push({
      class: nomeGrupo,
      descricao: "",
      cost: 0,
      codigo_omie: "-",
      ordem: "-",
      index: Date.now(),               // id único simples
      adjustedQuantityFormula: "0",
      quantidade: ""
    });
  }

  /* 2.4 – Renderiza apenas esse grupo (vai gerar a tabela) -------- */
  renderIncludedProducts({ grupoId: nomeGrupo });

  /* 2.5 – Retorna a referência recém-criada ----------------------- */
  return document.querySelector(sel);
}



// ⏳ Inicializa carregamento e eventos
document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();

  const inputBusca = document.getElementById("product-search");
  if (inputBusca) {
    inputBusca.addEventListener("input", filterProducts);
  } else {
    console.warn("⚠️ Campo de busca #product-search não encontrado.");
  }

  // Expõe funções no escopo global para debug
  window.adicionarProdutoDisponivel = adicionarProdutoDisponivel;
  window.filterProducts = filterProducts;
});
