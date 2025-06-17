



const grupoValoresMinimos = {};



// 📎 Classes
async function carregarClasses() {
  const dropdownList = document.getElementById("dropdownClassesList");
  const botaoDropdown = document.getElementById("dropdownClassesBtn");
  if (!dropdownList || !botaoDropdown) return;

  try {
    const res = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/classes");
const classes = await res.json();
    dropdownList.innerHTML = "";
    if (classes.length === 0) {
      dropdownList.innerHTML = `<li><span class="dropdown-item disabled">Nenhuma classe cadastrada</span></li>`;
    } else {
      classes.forEach(classe => {
        if (!classe.nome) return;
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "dropdown-item";
        a.href = "#";
        a.textContent = classe.nome;
        a.addEventListener("click", e => selecionarClasse(e, classe.nome));
        li.appendChild(a);
        dropdownList.appendChild(li);
      });
    }
  } catch (err) {
    console.error("❌ Erro ao carregar classes:", err);
  }
}

function selecionarClasse(event, nomeClasse) {
  event.preventDefault();
  const botao = document.getElementById("dropdownClassesBtn");
  if (botao) botao.textContent = nomeClasse;
  console.log("✅ Classe selecionada:", nomeClasse);
}



const products = [];

async function carregarProdutosDoServidor() {
  try {
    const response = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/produtos/visualizar");
    const dados = await response.json();

    if (!Array.isArray(dados)) throw new Error("Resposta inesperada da API.");

    // Limpa e preenche o array global products
    products.length = 0;
    dados.forEach(produto => {
      products.push({
        name: produto.descricao || "Sem nome",
        price: parseFloat(produto.valor_unitario) || 0,
        cost: parseFloat(produto.valor_unitario) || 0,
        class: produto.descricao_familia || "Sem Classe",
        description: produto.descr_detalhada || produto.descricao || "",
        codigo_produto: produto.codigo_produto || "" // <-- IMPORTANTE!
      });
    });

    console.log("✅ Produtos carregados:", products);

    if (typeof filterProducts === "function") {
      filterProducts();
    }

  } catch (err) {
    console.error("❌ Erro ao carregar produtos:", err);
    alert("Erro ao carregar produtos.");
  }
}
carregarProdutosDoServidor() 





document.addEventListener("DOMContentLoaded", () => {
  setupAutoComplete({
    inputId: "nome",
    listaId: "sugestoes",
    endpoint: "https://ulhoa-0a02024d350a.herokuapp.com/clientes/visualizar"
  });

  setupAutoComplete({
    inputId: "arquiteto",
    listaId: "sugestoes-arquiteto",
    endpoint: "https://ulhoa-0a02024d350a.herokuapp.com/clientes/visualizar"
  });
});
/*
function setupAutoComplete({ inputId, listaId, endpoint }) {
  const input = document.getElementById(inputId);
  const sugestoes = document.getElementById(listaId);

  input.addEventListener("input", async () => {
    const valor = input.value.trim();

    if (valor.length < 3) {
      sugestoes.innerHTML = "";
      sugestoes.style.display = "none";
      return;
    }

    try {
      const res = await fetch(endpoint);
      const clientes = await res.json();

      const resultados = clientes.filter(cli =>
        cli.nome_fantasia?.toLowerCase().includes(valor.toLowerCase())
      );

      sugestoes.innerHTML = "";
      resultados.forEach(cliente => {
        const li = document.createElement("li");
        li.classList.add("list-group-item", "list-group-item-action");
        li.textContent = cliente.nome_fantasia;

        li.addEventListener("click", () => {
          input.value = cliente.nome_fantasia;
          sugestoes.innerHTML = "";
          sugestoes.style.display = "none";

          if (inputId === "nome") {
            document.getElementById("cpfCnpj").value = cliente.cnpj_cpf || "";
            document.getElementById("endereco").value = cliente.endereco || "";
            document.getElementById("numeroComplemento").value = cliente.endereco_numero || "";
            document.getElementById("idClienteOmie").value = cliente.codigo_cliente_omie || "";
          }

          if (inputId === "arquiteto") {
            document.getElementById("codigo_arqeuiteto").value = cliente.codigo_cliente_omie || "";
          }
        });

        sugestoes.appendChild(li);
      });

      sugestoes.style.display = resultados.length ? "block" : "none";
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
    }
  });

  document.addEventListener("click", (e) => {
    if (!sugestoes.contains(e.target) && e.target !== input) {
      sugestoes.style.display = "none";
    }
  });
}
*/


window.addEventListener("DOMContentLoaded", () => {
  
  carregarClasses();
});

// Armazena os dados de cada grupo

window.grupoParametros = window.grupoParametros || {};
const groupPopupsData = {};

// ✅ 1. Abre o popup e mostra fórmulas (se existirem) avaliadas
// ✅ 1. Abre o popup e mostra fórmulas (se existirem) avaliadas — Sem arredondamento e sem R$
function abrirPopup(grupoId, nomeGrupo) {
  const popup = document.getElementById("popup-info");
  const popupContent = popup?.querySelector(".popup-content");
  const popupTitle = document.getElementById("popup-title");

  if (!popup || !popupContent || !popupTitle) {
    console.error("❌ Elementos do popup não encontrados.");
    return;
  }

  // Mostra o popup
  popup.style.display = "block";
  popup.classList.remove("hidden");
  popup.dataset.groupId = grupoId;
  popupTitle.innerText = `Informações Adicionais: ${nomeGrupo}`;

  if (!window.groupPopupsData) window.groupPopupsData = {};
  if (!groupPopupsData[grupoId]) groupPopupsData[grupoId] = {};
  const grupo = groupPopupsData[grupoId];

  const campos = popupContent.querySelectorAll("[data-tag]");
  campos.forEach(campo => {
    const tag = campo.dataset.tag;
    let formula = grupo[tag] ?? "";
    campo.dataset.formula = formula;

    // Avalia a fórmula e exibe o valor calculado
    let resultado;
    try {
      resultado = evaluateFormula(formula, grupo);
      campo.value = isNaN(resultado) ? "Erro" : resultado;
    } catch {
      campo.value = "Erro";
    }

    campo.addEventListener("focus", () => {
      campo.value = campo.dataset.formula || "";
      renderIncludedProducts();
    });

    campo.addEventListener("blur", () => {
      const novaFormula = campo.value.trim();
      campo.dataset.formula = novaFormula;
      grupo[tag] = novaFormula;

      try {
        const novoResultado = evaluateFormula(novaFormula, grupo);
        campo.value = isNaN(novoResultado) ? "Erro" : novoResultado;
        renderIncludedProducts();
        atualizarResumoPopupValores(); // Atualiza os valores à direita
      } catch {
        campo.value = "Erro";
      }
    });

    campo.addEventListener("keydown", e => {
      if (e.key === "Enter" && campo.tagName !== "TEXTAREA") {
        e.preventDefault();
        campo.blur();
      }
    });
  });

  // 🔢 Criação da coluna de valores calculados no popup
  const colunaResumo = document.createElement("div");
  colunaResumo.style.marginTop = "20px";
  colunaResumo.style.borderTop = "1px solid #ccc";
  colunaResumo.style.paddingTop = "12px";

  const grupoIdLocal = grupoId; // evita escopo

  [
  
  ].forEach(({ label, tag, pct }) => {
    const linha = document.createElement("div");
    linha.style.display = "flex";
    linha.style.justifyContent = "space-between";
    linha.style.alignItems = "center";
    linha.style.marginBottom = "6px";

    const labelEl = document.createElement("strong");
    labelEl.textContent = `${label}:`;

    const valorSpan = document.createElement("span");
    valorSpan.id = `popup_${tag}`;
    valorSpan.style.fontWeight = "normal";
    valorSpan.style.minWidth = "100px";
    valorSpan.style.textAlign = "right";

    const pctSpan = document.createElement("span");
    pctSpan.id = `popup_${pct}`;
    pctSpan.style.fontSize = "0.9em";
    pctSpan.style.color = "#555";
    pctSpan.style.minWidth = "70px";
    pctSpan.style.textAlign = "right";

    linha.appendChild(labelEl);
    linha.appendChild(valorSpan);
    linha.appendChild(pctSpan);
    colunaResumo.appendChild(linha);
  });

  popupContent.appendChild(colunaResumo);

  function atualizarResumoPopupValores() {
    ["precoMinimo", "precoMinimoPct", "precoSugerido", "precoSugeridoPct", "lucroReal", "lucroRealPct"].forEach(tag => {
      const el = document.getElementById(`popup_${tag}`);
      if (el) {
        try {
          const val = evaluateFormula(`#${tag}`, { groupId: grupoIdLocal });
          el.textContent = isNaN(val)
            ? "Erro"
            : (tag.includes("Pct") ? `${val.toFixed(2)}%` : `R$ ${val.toFixed(2)}`);
        } catch {
          el.textContent = "Erro";
        }
      }
    });
  }

  // Atualiza logo após abrir
  atualizarResumoPopupValores();
}

  
// ✅ 2. Fecha o popup e salva fórmulas ou valores simples
function fecharPopup() {
    const popup = document.getElementById("popup-info");
    const grupoId = popup.dataset.groupId;
    if (!grupoId) return;
  
    if (!groupPopupsData[grupoId]) groupPopupsData[grupoId] = {};
  
    popup.querySelectorAll("[data-tag]").forEach(campo => {
      const tag = campo.dataset.tag;
      if (!tag) return;
  
      // Tenta obter a fórmula salva no dataset ou o valor atual
      const formula = campo.dataset.formula?.trim() ?? campo.value.trim();
  
      // Se começar com "#", é fórmula, senão é valor direto
      groupPopupsData[grupoId][tag] = formula.startsWith("#") ? formula : campo.value.trim();
    });
  
    popup.classList.add("hidden");
    popup.style.display = "none";
  }
  
  
  

// ✅ 3. Listener para permitir editar fórmulas diretamente nos campos do popup
function ativarReatividadePopup(grupoId) {
    const popup = document.querySelector("#popup-info .popup-content");
    if (!popup) return;
  
    const campos = popup.querySelectorAll("[data-tag]");
    campos.forEach(campo => {
      const tag = campo.dataset.tag;
  
      if (!groupPopupsData[grupoId]) groupPopupsData[grupoId] = {};
      const grupo = groupPopupsData[grupoId];
  
      // ✅ Se ainda não tiver fórmula salva, armazena valor atual como fórmula inicial
      if (campo.dataset.formula === undefined) {
        const formulaOriginal = grupo[tag]?.trim() || campo.value?.trim() || "0";
        campo.dataset.formula = formulaOriginal;
        grupo[tag] = formulaOriginal;
      }
  
      // ✅ Ao abrir, avalia e exibe o valor da fórmula (sem mostrar fórmula bruta)
      try {
        const resultado = evaluateFormula(campo.dataset.formula, { ...grupo, groupId: grupoId });
        campo.value = isNaN(resultado) ? "Erro" : `R$ ${parseFloat(resultado).toFixed(2)}`;
      } catch {
        campo.value = "Erro";
      }
  
      // ✅ Foco → mostra fórmula bruta
      campo.addEventListener("focus", () => {
        campo.value = campo.dataset.formula || "0";
      });
  
      // ✅ Blur → salva fórmula nova e exibe valor calculado
      campo.addEventListener("blur", () => {
        const novaFormula = campo.value.trim();
        campo.dataset.formula = novaFormula;
        grupo[tag] = novaFormula;
  
        try {
          const resultado = evaluateFormula(novaFormula, { ...grupo, groupId: grupoId });
          campo.value = isNaN(resultado) ? "Erro" : `R$ ${parseFloat(resultado).toFixed(2)}`;
        } catch {
          campo.value = "Erro";
        }
      });
  
      // ✅ Enter = blur (se não for textarea)
      campo.addEventListener("keydown", e => {
        if (e.key === "Enter" && campo.tagName !== "TEXTAREA") {
          e.preventDefault();
          campo.blur();
        }
      });
    });
  }
  
  
  
  
  
  
  

// ✅ Chamar isso ao carregar a página ou ao abrir popup
// window.addEventListener("DOMContentLoaded", ativarReatividadePopup);
// ou chamar dentro de abrirPopup()

// 💡 Dica: se quiser ativar sempre que abrir, basta colocar no final da abrirPopup:
// ativarReatividadePopup();






function selecionarClasse(event, classe) {
    event.preventDefault(); // impede que o clique vá para o topo da página

    // Atualiza o texto do botão
    document.getElementById("dropdownClassesBtn").textContent = classe;



    // Aciona a filtragem
    if (typeof filterProducts === "function") {
      filterProducts();
    }
  }
  


window.includedProducts = [];






    
    const productSearch = document.getElementById("product-search");
    const classFilter = document.getElementById("class-filter");
    const searchResultsTable = document.getElementById("search-results").querySelector("tbody");
    const includedProductsTable = document.getElementById("included-products").querySelector("tbody");

   

    
 function filterProducts() {
  const queryBruta = productSearch.value || "";
  const queryPartes = queryBruta
    .split(";")
    .map(p => normalizarTexto(p.trim()))
    .filter(p => p.length > 0);

  searchResultsTable.innerHTML = "";

  if (queryPartes.length === 0) return;

  const filteredProducts = products.filter(product => {
    const nome = normalizarTexto(product.name || "");
    const codigo = normalizarTexto(product.codigo_produto?.toString() || "");
    const descricao = normalizarTexto(product.description || "");
    const caracteristicas = normalizarTexto(product.characteristics || product.caracteristicas || "");

    const textoCompleto = `${nome} ${codigo} ${descricao} ${caracteristicas}`;

    return queryPartes.every(parte => textoCompleto.includes(parte));
  });

  filteredProducts.forEach(product => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.name}</td>
      <td>R$ ${product.price.toFixed(2)}</td>
      <td>R$ ${product.cost.toFixed(2)}</td>
      <td>${product.codigo_produto || "-"}</td>
      <td>
        <span class="detail-icon material-icons-outlined" title="Ver detalhes" style="cursor:pointer;">help_outline</span>
      </td>
      <td>
        <button class="add-product btn btn-sm btn-success">Adicionar</button>
      </td>
    `;
    searchResultsTable.appendChild(row);

    row.querySelector(".add-product").addEventListener("click", () => {
      addProduct(product);
    });

    row.querySelector(".detail-icon").addEventListener("click", () => {
      alert(`📝 Descrição:\n\n${product.description || "Sem descrição disponível."}`);
    });
  });
}

    
    function normalizarTexto(texto) {
      return (texto || "")
        .toLowerCase()
        .normalize("NFD") // separa acentos
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/["“”]/g, "") // remove aspas normais e tipográficas
        .replace(/[^a-z0-9\s\/'\-.,]/gi, ""); // mantém letras, números, espaço, barra, apóstrofo, hífen, ponto, vírgula
    }
    
    

function filtrarPorClasse(classe) {
    document.getElementById("product-search").value = classe;
    filterProducts(); // usa sua função já existente
  }

  function evaluateFormula(formula, context = {}) {
    const parse = val => {
      if (typeof val === "string") {
        val = val.replace("R$", "").trim().replace(",", ".");
        if (/^\d+(\.\d+)?$/.test(val)) {
          return parseFloat(val);
        }
      }
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };
  
    const vars = {
      altura: parse(document.getElementById("altura")?.value),
      comprimento: parse(document.getElementById("comprimento")?.value),
      largura: parse(document.getElementById("largura")?.value),
      quantidade: parse(context.quantidade || context.quantity),
      quantidade_desejada: parse(context.quantidade_desejada || context.adjustedQuantity),
      custo_unitario: parse(context.custo_unitario || context.cost),
      preco_unitario: parse(context.preco_unitario || context.price),
      nome_produto: context.name || context.nome_produto || ""
    };
  
    Object.entries(context).forEach(([key, val]) => {
      if (!vars.hasOwnProperty(key)) {
        vars[key] = parse(val);
      }
    });
  
    document.querySelectorAll("input, textarea").forEach(input => {
      const id = input.id;
      if (id && !vars.hasOwnProperty(id)) {
        vars[id] = parse(input.value);
      }
    });
  
    const popup = document.getElementById("popup-info");
    if (popup && popup.dataset.groupId) {
      popup.querySelectorAll("input, textarea").forEach(input => {
        const id = input.id?.replace("popup_", "");
        if (id) {
          vars[id] = parse(input.value);
        }
      });
    }
  
    if (context.groupId && typeof groupPopupsData === "object") {
      const grupoData = groupPopupsData[context.groupId];
      if (grupoData && typeof grupoData === "object") {
        Object.entries(grupoData).forEach(([key, value]) => {
          if (!vars.hasOwnProperty(key)) {
            vars[key] = parse(value);
          }
        });
      }
    }
  
    try {
      if (!formula || typeof formula !== "string" || formula.trim() === "") return 0;
  
      const trimmed = formula.trim();
  
      // ✅ Se não houver "#" e for número simples, retorna direto
      if (!trimmed.includes("#")) {
        return parse(trimmed);
      }
  
      let parsedFormula = trimmed
        .replace(/#arredondarCima\(([^)]+)\)/g, 'Math.ceil($1)')
        .replace(/#arredondarBaixo\(([^)]+)\)/g, 'Math.floor($1)')
        .replace(/#arredondarMais\(([^)]+)\)/g, '(Math.round($1 + 0.4999))')
        .replace(/#arredondarMenos\(([^)]+)\)/g, '(Math.round($1 - 0.4999))');
  
      parsedFormula = parsedFormula.replace(/#([a-zA-Z0-9_]+)(\[(.*?)\])?/g, (_, varName, _bracket, grupoNome) => {
        if (grupoNome) {
          const groupId = `grupo-${grupoNome.toLowerCase().normalize("NFD").replace(/[^a-zA-Z0-9]/g, '-')}`;
          const valor = groupPopupsData?.[groupId]?.[varName];
          return parse(valor);
        } else {
          return parse(vars[varName]);
        }
      });
  
      return new Function(`return ${parsedFormula}`)();
      atualizarValorFinalFooter()
    } catch (e) {
      console.warn("Erro ao avaliar fórmula:", formula, e);
      return 0;
    }
  }
  
  
  
  
  
  
function addProduct(product) {
    const selectedClass = document.getElementById('dropdownClassesBtn').textContent.trim();
  
    if (!selectedClass || selectedClass === 'Escolher Classe') {
      alert("⚠️ Favor selecionar a classificação (classe) do produto.");
      return;
    }
  
    // Garante quantidade padrão
    const quantity = product.quantity || 1;
  
    const novoProduto = {
      ...product,
      class: selectedClass,
      quantity: quantity,
      adjustedQuantity: quantity,
      index: includedProducts.length,
    };
  
    includedProducts.push(novoProduto);
    console.log("✅ Produto adicionado:", novoProduto);
  
    renderIncludedProducts();         // Atualiza tabela
    calcularSomaTotal();              // Atualiza totais e descrição
    ordenarCheckboxesStaticamente(); // Atualiza lista de grupos
  }
  

  function removeProduct(index) {
    index = parseInt(index);
  
    // Remove do array principal
    includedProducts = includedProducts.filter(p => p.index !== index);
  
    // Reindexa para manter consistência
    includedProducts.forEach((p, i) => p.index = i);
  
    // Re-renderiza tabela e atualiza tudo
    renderIncludedProducts();
    calcularSomaTotal();
    ordenarCheckboxesStaticamente();
  }
  
function abrirPopupValores(grupoId) {
  const tabela = document.querySelector(`[data-grupo-id="${grupoId}"] table`);
  if (!tabela) {
    console.warn(`⚠️ Tabela não encontrada para grupo: ${grupoId}`);
    return;
  }

  const linhas = tabela.querySelectorAll("tbody tr");
  let custoTotal = 0;

  linhas.forEach(linha => {
    const td = linha.querySelector("td:nth-child(2)");
    if (td) {
      const texto = td.textContent.replace(/[^0-9,.-]/g, '').replace(',', '.');
      const valor = parseFloat(texto);
      if (!isNaN(valor)) custoTotal += valor;
    }
  });

  const precoMinimo = custoTotal * 1.1;
  const precoSugerido = custoTotal * 1.3;
  const lucroReal = precoSugerido - custoTotal;

  const formatMoney = val => !isNaN(val) ? `R$ ${parseFloat(val).toFixed(2)}` : "-";
  const formatPercent = val => !isNaN(val) ? `${parseFloat(val).toFixed(2)}%` : "-";

  const popup = document.createElement("div");
  popup.id = "popup-valores";
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 1px solid #ccc;
    padding: 20px;
    z-index: 10000;
    width: 600px;
    font-family: Arial, sans-serif;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
  `;

  popup.innerHTML = `
    <h4 style="margin-bottom: 20px;">Valores Calculados</h4>
    <div style="display: flex; gap: 30px; justify-content: space-between;">
      <div style="flex: 1;">
        <div><strong>Custo Unitário:</strong> ${formatMoney(custoTotal)}</div>
        <div><strong>Preço Mínimo:</strong> ${formatMoney(precoMinimo)}</div>
        <div><strong>Preço Sugerido:</strong> ${formatMoney(precoSugerido)}</div>
        <div><strong>Lucro Real:</strong> ${formatMoney(lucroReal)}</div>
      </div>
      <div style="flex: 1;">
        <div><strong>Custo Total (%):</strong> ${formatPercent((custoTotal / precoSugerido) * 100)}</div>
        <div><strong>Preço Mínimo (%):</strong> ${formatPercent((precoMinimo / precoSugerido) * 100)}</div>
        <div><strong>Preço Sugerido (%):</strong> 100%</div>
        <div><strong>Lucro Real (%):</strong> ${formatPercent((lucroReal / precoMinimo) * 100)}</div>
      </div>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="document.getElementById('popup-valores').remove()" class="btn btn-secondary">Fechar</button>
    </div>
  `;

  document.body.appendChild(popup);
}

  
  function calcularEPreencherPrecoMinimo(groupId) {
    try {
      const valorCalculado = evaluateFormula("#precoMinimo", groupId);
      const valorMinimo = parseFloat(valorCalculado);
  
      if (isNaN(valorMinimo) || valorMinimo <= 0) {
        console.warn(`⚠️ precoMinimo inválido para grupo "${groupId}"`);
        return;
      }
  
      // 1. Salva no objeto global
      grupoValoresMinimos[groupId] = valorMinimo;
      console.log(`💾 grupoValoresMinimos["${groupId}"] = ${valorMinimo}`);
  
      // 2. Atualiza o campo visual do grupo
      const container = document.querySelector(`#included-products-container [data-group="${groupId}"]`);
      if (!container) {
        console.warn(`❌ Container de grupo "${groupId}" não encontrado`);
        return;
      }
  
      const td = container.querySelector('td[colspan="2"]');
      if (!td) {
        console.warn(`❌ <td colspan="2"> não encontrado para grupo "${groupId}"`);
        return;
      }
  
      const formulaInput = td.querySelector('.formula-input');
      const formulaResult = td.querySelector('.formula-result');
  
      if (formulaInput) formulaInput.textContent = "#precoMinimo";
      if (formulaResult) formulaResult.textContent = `R$ ${valorMinimo.toFixed(2)}`;
  
    } catch (e) {
      console.error(`❌ Erro ao calcular #precoMinimo do grupo "${groupId}"`, e);
    }
  }
  
  
  function gerarBloco(label, id, valor) {
    return `
      <div style="margin-bottom: 10px;">
        <strong>
          ${label}
          <span 
            class="material-symbols-outlined copy-icon" 
            title="Copiar variável #${id}" 
            style="cursor: pointer; font-size: 18px; vertical-align: middle;" 
            onclick="copiarTag('${id}')"
          >content_copy</span>
        </strong><br>
        <span id="${id}">${valor}</span>
      </div>
    `;
  }
  
  function copiarTag(id) {
    const tag = `#${id}`;
    navigator.clipboard.writeText(tag).then(() => {
      alert(`📋 Variável ${tag} copiada para a área de transferência!`);
    });
  }
  
  
  
  
function tratarPercentual(valor) {
    let numero = parseFloat(valor);
    if (isNaN(numero)) return 0;
    return numero > 1 ? numero / 100 : numero;
  }
  
function calcularValoresGrupo(grupoId, custoMaterialBase) {
  const data = groupPopupsData[grupoId] || {};

  const miudezas = tratarPercentual(data.miudezas);
  const gastoOperacional = tratarPercentual(data.gasto_operacional);
  const impostos = tratarPercentual(data.impostos);
  const margemLucro = tratarPercentual(data.margem_lucro);
  const margemSeguranca = tratarPercentual(data.margem_seguranca);
  const comissaoArquiteta = tratarPercentual(data.comissao_arquiteta);
  const margemNegociacao = tratarPercentual(data.margem_negociacao);

  const custoTotalMaterial = custoMaterialBase * (1 + miudezas);

  const divisor = 1 - (gastoOperacional + impostos + margemLucro);
  const multiplicador = 1 + (margemSeguranca + comissaoArquiteta);
  const precoMinimo = divisor !== 0 ? (custoTotalMaterial / divisor) * multiplicador : 0;

  const precoSugerido = precoMinimo * (1 + margemNegociacao);

  const lucroReal = precoMinimo !== 0 ? (margemLucro / precoMinimo) : 0;

  return {
    custoTotalMaterial: `R$ ${custoTotalMaterial.toFixed(2)}`,
    precoMinimo: `R$ ${precoMinimo.toFixed(2)}`,
    precoSugerido: `R$ ${precoSugerido.toFixed(2)}`,
    lucroReal: `${(lucroReal * 100).toFixed(2)}%`
  };
}

  function isCriarProposta() {
  return window.location.pathname.includes("criarProposta.html");
}

// 🔄 Função renderIncludedProducts atualizada para preservar ordem original dos produtos
function renderIncludedProducts() {
  console.log("render iniciado");

  const container = document.getElementById("included-products-container");
  if (!container) return;
  container.innerHTML = "";

  const groupedProducts = {};
  includedProducts.forEach((product) => {
    if (!product.class) return;
    if (!groupedProducts[product.class]) groupedProducts[product.class] = [];
    groupedProducts[product.class].push(product);
  });

  const formatarReal = v => `R$ ${parseFloat(v || 0).toFixed(2)}`;

  Object.keys(groupedProducts).forEach(className => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("grupo-tabela");
    const grupoId = `grupo-${className.replace(/\s+/g, '-').toLowerCase()}`;
    wrapper.setAttribute("data-group", grupoId);

    // 🔘 Título e botões do grupo
    const label = document.createElement("h3");
    const titulo = document.createElement("strong");
    titulo.textContent = className;
    label.appendChild(titulo);

    const botao = (texto, classe, title, evento) => {
      const btn = document.createElement("button");
      btn.className = classe;
      btn.textContent = texto;
      btn.style.marginLeft = "4px";
      if (title) btn.title = title;
      btn.dataset.group = grupoId;
      btn.addEventListener("click", evento);
      return btn;
    };

    label.appendChild(botao("?", "info-button", null, () => abrirPopup(grupoId, className)));
    label.appendChild(botao("$", "money-button", null, () => {
      const custoTotal = groupPopupsData[grupoId]?.custo_total || 0;
      const custos = calcularValoresGrupo(grupoId, custoTotal);
      abrirPopupValores(custos);
    }));
    label.appendChild(botao("⧉", "duplicate-button", "Duplicar grupo", () => duplicarGrupo(className)));

    wrapper.appendChild(label);

    // 🧾 Tabela do grupo
    const table = document.createElement("table");
    table.classList.add("included-group-table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Ordem</th>
          <th>Utilização</th>
          <th>Descrição</th>
          <th>Valor de Custo Final</th>
          <th>Custo de Material Base</th>
          <th>Quantidade</th>
          <th>Fórmula Preço</th>
          <th>Código Omie</th>
          <th>Quantidade Desejada</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    let totalCost = 0, totalPrice = 0, totalQtd = 0, totalVendaFormula = 0, totalCustoFormula = 0;

    const ordemBaseInput = document.querySelector(`#grupo-checkboxes input[data-class="${className}"]`);
    const ordemBase = ordemBaseInput ? parseInt(ordemBaseInput.value) : 1;

    groupedProducts[className].forEach((product, i) => {
      const context = { ...product, groupId: grupoId };

      let quantidadeDesejada = product.adjustedQuantity || 1;
      if (product.adjustedQuantityFormula) {
        try {
          quantidadeDesejada = evaluateFormula(product.adjustedQuantityFormula, context);
        } catch {}
      }

      const cost = parseFloat(product.cost || 0);
      const price = parseFloat(product.price || 0);
      const valorVenda = evaluateFormula(product.priceFormula || "0", context) * quantidadeDesejada;
      const valorCusto = evaluateFormula(product.costFormula || "0", context) * quantidadeDesejada;

      totalVendaFormula += valorVenda;
      totalCustoFormula += valorCusto;
      totalCost += cost * quantidadeDesejada;
      totalPrice += price * quantidadeDesejada;
      totalQtd += quantidadeDesejada;

      const parteY = product.ordem?.split(".")[1] || (i + 1);
      const ordemCompleta = `${ordemBase}.${parteY}`;
      product.ordem = ordemCompleta; // preserva no objeto

      const row = document.createElement("tr");
      row.setAttribute("draggable", "true");
      row.classList.add("draggable");
      row.dataset.index = product.index;
      row.dataset.class = product.class;

      row.innerHTML = `
        <td><div contenteditable="true" class="ordem-cell">${ordemCompleta}</div></td>
        <td contenteditable="true" class="editable-utilizacao">${product.utilizacao || ""}</td>
        <td contenteditable="true" class="editable-descricao">${product.name || ""}</td>
        <td><div>${formatarReal(cost * quantidadeDesejada)}</div></td>
        <td><div>${formatarReal(price)}</div></td>
        <td><div class="quantity-cell" contenteditable="true" data-index="${product.index}">${quantidadeDesejada}</div></td>
        <td>
          <div class="formula-input" contenteditable="true" data-index="${product.index}" data-type="priceFormula" data-raw-formula="${product.priceFormula || ''}" style="display:none;">${product.priceFormula || ''}</div>
          <div class="formula-result" data-index="${product.index}" data-type="priceFormula" style="cursor:pointer;"></div>
        </td>
        <td><div>${product.codigo_produto || "-"}</div></td>
        <td>
          <div class="formula-input" contenteditable="true" data-index="${product.index}" data-type="adjustedQuantityFormula" data-raw-formula="${product.adjustedQuantityFormula || ''}" style="display:none;">${product.adjustedQuantityFormula || ''}</div>
          <div class="formula-result" data-index="${product.index}" data-type="adjustedQuantityFormula" style="cursor:pointer;"></div>
        </td>
        <td><button class="remove-product" data-index="${product.index}" onclick="removeProduct(${product.index})">Remover</button></td>
      `;

      // Eventos para campos editáveis
      row.querySelector(".editable-utilizacao")?.addEventListener("blur", e => {
        product.utilizacao = e.target.innerText.trim();
      });
      row.querySelector(".editable-descricao")?.addEventListener("blur", e => {
        product.name = e.target.innerText.trim();
      });
      const qtdCell = row.querySelector(".quantity-cell");
      if (qtdCell) {
        qtdCell.addEventListener("blur", () => {
          const newQtd = parseFloat(qtdCell.innerText.trim().replace(",", "."));
          const finalQtd = !isNaN(newQtd) && newQtd >= 0 ? newQtd : 1;
          product.quantity = finalQtd;
          product.adjustedQuantity = finalQtd;
          renderIncludedProducts();
        });
        qtdCell.addEventListener("keydown", e => {
          if (e.key === "Enter") {
            e.preventDefault();
            qtdCell.blur();
          }
        });
      }

      ["priceFormula", "adjustedQuantityFormula"].forEach(type => {
        const input = row.querySelector(`.formula-input[data-type='${type}']`);
        const display = row.querySelector(`.formula-result[data-type='${type}']`);
        if (input && display) {
          try {
            display.innerText = evaluateFormula(product[type] || "0", context);
          } catch {
            display.innerText = "Erro";
          }

          display.addEventListener("click", () => {
            input.innerText = product[type] || "";
            display.style.display = "none";
            input.style.display = "block";
            input.focus();
          });

          input.addEventListener("blur", () => {
            const newFormula = input.innerText.trim();
            product[type] = newFormula;
            input.dataset.rawFormula = newFormula;
            input.style.display = "none";

            let result;
            try {
              result = evaluateFormula(newFormula || "0", context);
            } catch {
              result = "Erro";
            }

            display.innerText = result;
            display.style.display = "block";

            if (type === "adjustedQuantityFormula") {
              const parsed = parseFloat(result);
              if (!isNaN(parsed)) {
                product.adjustedQuantity = parsed;
                product.quantity = parsed;
                renderIncludedProducts();
              }
            }
          });

          input.addEventListener("keydown", e => {
            if (e.key === "Enter") {
              e.preventDefault();
              input.blur();
            }
          });
        }
      });

      addDragAndDrop(row, className);
      tbody.appendChild(row);
    });

    groupPopupsData[grupoId] = groupPopupsData[grupoId] || {};
    groupPopupsData[grupoId].custo_total = totalCost;
    groupPopupsData[grupoId].preco_total = totalPrice;
    groupPopupsData[grupoId].qtd_total = totalQtd;

    const custosCalculados = calcularValoresGrupo(grupoId, totalCost);
    const precoSugeridoTexto = custosCalculados.precoSugerido || "R$ 0.00";

    const totalRow = document.createElement("tr");
    totalRow.classList.add("extra-summary-row");
    totalRow.innerHTML = `
      <td colspan="2"><strong>Total:</strong></td>
      <td colspan="8"><div class="formula-result" style="font-weight: bold;">${precoSugeridoTexto}</div></td>
    `;
    tbody.appendChild(totalRow);

    const linhas = tbody.querySelectorAll("tr.draggable");
    const nomeProduto1 = linhas[0]?.children[2]?.textContent.trim() || "Produto 1";
    const nomeProduto2 = linhas[1]?.children[2]?.textContent.trim() || "Produto 2";

    const textoObservacao = ` ${nomeProduto1}; em nome ${nomeProduto2}\nAltura final:\nAltura do Montante:`;
    groupPopupsData[grupoId].observacoes = textoObservacao;

    const observacoesRow = document.createElement("tr");
    observacoesRow.innerHTML = `
      <td colspan="2"><strong>Observações:</strong></td>
      <td colspan="8" contenteditable="true" class="editable-observacoes">${textoObservacao.replace(/\n/g, "<br>")}</td>
    `;
    tbody.appendChild(observacoesRow);

    observacoesRow.querySelector(".editable-observacoes")?.addEventListener("blur", e => {
      groupPopupsData[grupoId].observacoes = e.target.innerText.trim();
    });

    wrapper.appendChild(table);
    container.appendChild(wrapper);
  });

  atualizarListaDeGrupos();
  atualizarValorFinalFooter();
  aplicarOrdemGrupos();
}

  
//Engenheiro(a)
//Arquiteto(a)
//Unidade de medida da Unidade
//Prazos Previsto por Área:
//Utilização para quantidade e unidade de medida da unidade
//Editar o nome da area
//Numero da pagina

  
    
    
    
    
window.renderIncludedProducts = renderIncludedProducts;





    
    // Função para salvar edição do custo ou quantidade
    function saveEdit(cell, newValue) {
        let field = cell.dataset.field;
        let index = cell.dataset.index;
        let parsedValue = parseFloat(newValue.replace(",", "."));
    
        if (isNaN(parsedValue) || parsedValue <= 0) {
            parsedValue = 0.01; // Valor mínimo permitido
        }
    
        if (field === "cost") {
            includedProducts[index].cost = parsedValue;
            cell.innerHTML = `R$ ${parsedValue.toFixed(2)}`;
        } else if (field === "quantity") {
            includedProducts[index].quantityPerMeter = parsedValue;
            cell.innerHTML = parsedValue;
        }
    
        renderIncludedProducts();
    }
    
    
    
function addDragAndDrop(row, className) {
  row.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("index", row.dataset.index);
    event.dataTransfer.setData("class", className);
  });

  row.addEventListener("dragover", (event) => {
    event.preventDefault();
    const draggedClass = event.dataTransfer.getData("class");
    if (draggedClass !== className) return;
  });

  row.addEventListener("drop", (event) => {
    event.preventDefault();

    const fromIndex = parseInt(event.dataTransfer.getData("index"));
    const toRow = event.target.closest("tr");
    const toIndex = parseInt(toRow?.dataset.index);

    if (isNaN(fromIndex) || isNaN(toIndex)) return;

    const posOriginal = includedProducts.findIndex(p => p.index === fromIndex);
    const posDestino = includedProducts.findIndex(p => p.index === toIndex);

    if (posOriginal === -1 || posDestino === -1 || posOriginal === posDestino) return;

    const produtoMovido = includedProducts.splice(posOriginal, 1)[0];
    includedProducts.splice(posDestino, 0, produtoMovido);

    renderIncludedProducts();
  });
}


    productSearch.addEventListener("input", filterProducts);
   // classFilter.addEventListener("change", filterProducts);




function formatarNumero(valor) {
    // Remove "R$" e espaços extras
    valor = valor.replace("R$", "").trim();

    // Substitui vírgula por ponto
    valor = valor.replace(",", ".");

    // Remove todos os pontos, exceto o último (para garantir as casas decimais corretas)
    let partes = valor.split(".");
    if (partes.length > 2) {
        let parteInteira = partes.slice(0, -1).join(""); // Junta tudo antes do último ponto
        let parteDecimal = partes[partes.length - 1]; // Mantém apenas o último grupo decimal
        valor = parteInteira + "." + parteDecimal;
    }

    return parseFloat(valor) || 0; // Retorna como número ou 0 se for inválido
}

function calcularSomaTotal(produtoRemovido = null) {
    const totalRows = document.querySelectorAll(".total-row");
  
    let somaPreco = 0;
    let somaCusto = 0;
  
    totalRows.forEach(row => {
      const colunas = row.querySelectorAll("td, th");
      const preco = formatarNumero(colunas[4]?.textContent || "0");
      const custo = formatarNumero(colunas[5]?.textContent || "0");
      somaPreco += preco;
      somaCusto += custo;
    });
  
    // 🔁 Atualiza descrição com base em todos os produtos ainda exibidos
    const campoDescricao = document.getElementById("descricao");
    const novasDescricoes = [];
  
    includedProducts.forEach(p => {
      if (p.name && p.description) {
        const linha = `${p.name}: ${p.description}`;
        if (!novasDescricoes.includes(linha)) {
          novasDescricoes.push(linha);
        }
      }
    });
  
    campoDescricao.value = novasDescricoes.join("\n");
  
    somarTotaisGerais();
  }
  
  

// Evento para recalcular ao mudar a opção do select
/* document.getElementById("field1").addEventListener("change", function () {
    if (this.value === "sim") {
        calcularSomaTotal(); // Chama a função para somar os valores
    } else {
        // Se não for soma, zera valores mas mantém a descrição preenchida
        document.getElementById("field4").value = "0.00";
        document.getElementById("field3").value = "0.00";
    }
});


//Salvar Produto Base

document.getElementById('save-proposal').addEventListener('click', salvarProdutoBase);
*/
async function salvarProdutoBase1() {
  console.log("📝 Iniciando salvamento da proposta...");

  try {
    const grupos = [];

    document.querySelectorAll(".grupo-tabela").forEach((grupoEl, ordemGrupo) => {
      const grupoId = grupoEl.dataset.group || "grupo-sem-nome";
      const nomeGrupo = grupoId.replace("grupo-", "") || "Sem nome";

      const itens = [];
      grupoEl.querySelectorAll("tbody tr.draggable").forEach((row, ordemProduto) => {
        const nomeProduto = row.children[0]?.textContent.trim();
        if (!nomeProduto) return; // Ignora produtos sem nome

        const valorCustoRaw = row.children[1]?.innerText.trim() || "0";
        const valorVendaRaw = row.children[2]?.innerText.trim() || "0";
        const quantidadeRaw = row.children[3]?.innerText.trim() || "1";
        const codigo_omie = row.children[6]?.innerText.trim() || "";

        const valorCusto = parseFloat(valorCustoRaw.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
        const valorVenda = parseFloat(valorVendaRaw.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
        const quantidade = parseFloat(quantidadeRaw.replace(/[^\d,.-]/g, "").replace(",", ".")) || 1;

        const formulaPreco = row.querySelector(`.formula-input[data-type="priceFormula"]`)?.dataset.rawFormula || "";
        const formulaQtd = row.querySelector(`.formula-input[data-type="adjustedQuantityFormula"]`)?.dataset.rawFormula || "";

        itens.push({
          nome_produto: nomeProduto,
          preco: valorVenda,
          custo: valorCusto,
          quantidade,
          valor_venda: valorVenda,
          valor_custo: valorCusto,
          formula_preco: formulaPreco,
          formula_quantidade: formulaQtd,
          codigo_omie,
          grupo: nomeGrupo,
          ordemGrupo,
          ordemProduto
        });
      });

      // Ignora grupos vazios
      if (!itens.length) return;

      const parametros = groupPopupsData?.[grupoId] || {};
      const formulaFinalGroup = grupoEl.querySelector(".formula-input[data-type='groupSaleFormula']")?.innerText.trim() || "";
      parametros.groupSaleFormula = formulaFinalGroup;

      grupos.push({
        nome: nomeGrupo,
        ordem: ordemGrupo,
        parametros,
        itens
      });
    });

    // FORMULÁRIO
    const camposFormulario = {
      numeroOrcamento: document.getElementById("numeroOrcamento")?.value || "",
      dataOrcamento: document.getElementById("dataOrcamento")?.value || "",
      origemCliente: document.getElementById("origemCliente")?.value || "",
      nomeOrigem: document.getElementById("nomeOrigem")?.value || "",
      codigoOrigem: document.getElementById("codigoOrigem")?.value || "",
      telefoneOrigem: document.getElementById("telefoneOrigem")?.value || "",
      emailOrigem: document.getElementById("emailOrigem")?.value || "",
      comissaoArquiteto: parseFloat(document.getElementById("comissaoArquiteto")?.value || "0"),
      nomeCliente: document.getElementById("nome")?.value || "",
      cpfCnpj: document.getElementById("cpfCnpj")?.value || "",
      endereco: document.getElementById("endereco")?.value || "",
      numeroComplemento: document.getElementById("numeroComplemento")?.value || "",
      enderecoEntrega: document.getElementById("enderecoEntrega")?.value || "",
      telefone: document.getElementById("telefone")?.value || "",
      arquiteto: document.getElementById("arquiteto")?.value || "",
      codigoArquiteto: document.getElementById("codigoArquiteto")?.value || "",
      idClienteOmie: document.getElementById("idClienteOmie")?.value || "",
      dataEntrega: document.getElementById("dataEntrega")?.value || "",
      vendedor: document.getElementById("selectVendedor")?.value || "",
      tipoPagamento: document.getElementById("tipoPagamento")?.value || "",
      desconto: parseFloat(document.getElementById("desconto")?.value || "0"),
      descricao: document.getElementById("descricao")?.value || "",
      cep: document.getElementById("cep")?.value || "",
      rua: document.getElementById("rua")?.value || "",
      numero: document.getElementById("numero")?.value || "",
      complemento: document.getElementById("complemento")?.value || "",
      bairro: document.getElementById("bairro")?.value || "",
      cidade: document.getElementById("cidade")?.value || "",
      estado: document.getElementById("estado")?.value || "",
      vendedorResponsavel: document.getElementById("vendedorResponsavel")?.value || "",
      operadorInterno: document.getElementById("operadorInterno")?.value || "",
      produtosValores: document.getElementById("produtosValores")?.value || "",
      prazosArea: document.getElementById("prazosArea")?.value || "",
      condicaoPagamento: document.getElementById("condicaoPagamento")?.value || "",
      condicoesGerais: document.getElementById("condicoesGerais")?.value || ""
    };

    const nomeProposta = grupos[0]?.itens?.[0]?.nome_produto || "Sem nome";

    const proposta = {
      nome: nomeProposta,
      tipoProposta: "editavel",
      camposFormulario,
      grupos
    };

    console.log("📦 Proposta montada:", proposta);
    alert("📤 Proposta montada com sucesso! Verifique o console.");

    // Envio desativado por enquanto
    // const resposta = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/propostas", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(proposta)
    // });

    // const resultado = await resposta.json();
    // if (!resposta.ok) throw new Error("Erro: " + JSON.stringify(resultado));

    return proposta;
  } catch (err) {
    console.error("❌ Erro ao salvar proposta:", err);
    alert("Erro ao salvar proposta: " + err.message);
    return null;
  }
}





async function salvarProdutoModelo() {
  console.log("Criar Proposta");

  try {
    const grupos = [];

    document.querySelectorAll(".grupo-tabela").forEach(grupoEl => {
      const grupoId = grupoEl.dataset.group || "grupo-sem-nome";
     const nomeGrupo = grupoId.replace("grupo-", "") || "Sem nome";

      const itens = [];
      grupoEl.querySelectorAll("tbody tr.draggable").forEach(row => {
        const nomeProduto = row.children[0]?.textContent.trim() || "";
        const valorCusto = row.children[1]?.innerText.trim().replace("R$", "").replace(",", ".") || "0";
        const valorVenda = row.children[2]?.innerText.trim().replace("R$", "").replace(",", ".") || "0";
        const quantidade = row.children[3]?.innerText.trim().replace(",", ".") || "1";
        const codigo_omie = row.children[5]?.innerText.trim().replace(",", ".") || "1";
        const formulaPreco = row.querySelector(`.formula-input[data-type="priceFormula"]`)?.dataset.rawFormula || "";
        const formulaQtd = row.querySelector(`.formula-input[data-type="adjustedQuantityFormula"]`)?.dataset.rawFormula || "";

         itens.push({
          nome_produto: nomeProduto,
          preco: valorVenda,
          custo: valorCusto,
          quantidade,
          valor_venda: valorVenda,
          valor_custo: valorCusto,
          formula_preco: formulaPreco,
          formula_quantidade: formulaQtd,
          codigo_omie: codigo_omie // ✅ Salvo corretamente
        });
      });

      const parametros = groupPopupsData?.[grupoId] || {};
      const formulaFinalGroup = grupoEl.querySelector(".formula-input[data-type='groupSaleFormula']")?.innerText.trim() || "";
      parametros.groupSaleFormula = formulaFinalGroup;

      grupos.push({
        nome: nomeGrupo,
        parametros,
        itens
      });
    });

    const camposFormulario = {
      nomeCliente: document.getElementById("nome")?.value || "",
      cpfCnpj: document.getElementById("cpfCnpj")?.value || "",
      endereco: document.getElementById("endereco")?.value || "",
      idClienteOmie: document.getElementById("idClienteOmie")?.value || "",
      descricao: document.getElementById("descricao")?.value || "",
      numeroComplemento: document.getElementById("numeroComplemento")?.value || "",
      enderecoEntrega: document.getElementById("enderecoEntrega")?.value || "",
      telefone: document.getElementById("telefone")?.value || "",
      arquiteto: document.getElementById("arquiteto")?.value || "",
      codigoArquiteto: document.getElementById("codigo_arqeuiteto")?.value || "",
      dataEntrega: document.getElementById("dataEntrega")?.value || "",
      vendedor: document.getElementById("selectVendedor")?.value || "",
      tipoPagamento: document.getElementById("tipoPagamento")?.value || "",
      desconto: parseFloat(document.getElementById("desconto")?.value || "0")
    };

    const nomeProposta = grupos[0]?.itens?.[0]?.nome_produto || "Sem nome";

    const proposta = {
      nome: nomeProposta,
      tipoProposta: "modelo",
      camposFormulario,
      grupos
    };

    const resposta = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/propostas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposta)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) throw new Error("Erro: " + JSON.stringify(resultado));

    alert("✅ Proposta salva com sucesso!");
    console.log("📦 Dados enviados:", proposta);
    console.log("🆔 ID da proposta:", resultado._id);

    return resultado;
  } catch (err) {
    console.error("❌ Erro ao salvar proposta:", err);
    alert("Erro ao salvar proposta: " + err.message);
    return null;
  }
}

function preencherProdutoBase(dados) {
    if (!dados) {
        console.warn("Nenhum dado fornecido.");
        return;
    }

    // Preenche os campos do formulário
    document.getElementById('nome_produto').value = dados.nome_produto || '';
    document.getElementById('codigo_produto_integracao').value = dados.codigo_produto_integracao || '';
    document.getElementById('codigo').value = dados.codigo || '';
    document.getElementById('unidade').value = dados.unidade || '';
    document.getElementById('gastos_totais').value = dados.gastos_totais || '';
    document.getElementById('margem_lucro').value = dados.margem_lucro || '';
    document.getElementById('impostos').value = dados.impostos || '';
    document.getElementById('margem_seguranca').value = dados.margem_seguranca || '';
    document.getElementById('miudezas').value = dados.miudezas || '';
    document.getElementById('margem_negociacao').value = dados.margem_negociacao || '';
    document.getElementById('descricao').value = dados.descricao || '';

    // Limpa a lista de produtos incluídos
    window.includedProducts = [];

    if (Array.isArray(dados.produtos_selecionados)) {
        dados.produtos_selecionados.forEach((item, index) => {
            const preco = parseFloat((item.preco || "").replace("R$", "").replace(",", ".").trim()) || 0;
            const custo = parseFloat((item.custo || "").replace("R$", "").replace(",", ".").trim()) || 0;
            const quantidade = parseFloat(item.quantidade) || 1;

            window.includedProducts.push({
                name: item.produto || `Produto ${index + 1}`,
                price: preco,
                cost: custo,
                quantity: quantidade,
                priceFormula: item.formula_preco || '',
                costFormula: item.formula_custo || '',
                class: 'Ficha Técnica'
            });
        });
    }

    // Atualiza a tabela na tela
    if (typeof window.renderIncludedProducts === "function") {
        window.renderIncludedProducts();
    }

    console.log("Produto base preenchido com sucesso!");
    console.log(dados);
}

// 🔁 Inicializa variável global apenas em memória
window.grupoConfiguracoes = window.grupoConfiguracoes || [];

/**
 * 🔍 Captura os valores numéricos (ordemBase) da interface
 */
function obterConfiguracoesDeGrupos() {
  const configuracoes = [];

  const grupoElements = document.querySelectorAll("#grupo-checkboxes .grupo-item");

  grupoElements.forEach(el => {
    const className = el.getAttribute("data-class");
    const inputOrdem = el.querySelector(`input[type="number"][data-class="${className}"]`);

    if (inputOrdem) {
      configuracoes.push({
        nome: className,
        ordemBase: parseInt(inputOrdem.value) || 1
      });
    }
  });

  window.grupoConfiguracoes = configuracoes;
  return configuracoes;
}

/**
 * ♻️ Restaura apenas os valores numéricos (ordemBase) na interface
 */
function restaurarConfiguracoesDeGrupos() {
  const configuracoes = window.grupoConfiguracoes || [];

  configuracoes.forEach(({ nome, ordemBase }) => {
    const inputOrdem = document.querySelector(`#grupo-checkboxes input[type="number"][data-class="${nome}"]`);
    if (inputOrdem) inputOrdem.value = ordemBase;
  });
}

/**
 * 🔢 Atualiza a coluna .ordem-cell com base nas configurações salvas
 */
function atualizarOrdemDasTabelas(configuracoes) {
  configuracoes.forEach(({ nome, ordemBase }) => {
    const tabelaGrupo = document.querySelector(`.grupo-tabela[data-group="grupo-${nome}"]`);
    if (!tabelaGrupo) return;

    const linhas = tabelaGrupo.querySelectorAll("tbody tr.draggable");
    linhas.forEach((linha, i) => {
      const cellOrdem = linha.querySelector(".ordem-cell");
      if (cellOrdem) {
        cellOrdem.innerText = `${ordemBase}.${i + 1}`;
      }
    });
  });
}

/**
 * 🔘 Captura + aplica configurações (apenas ordemBase)
 */
function aplicarOrdemGrupos() {
  const configuracoes = obterConfiguracoesDeGrupos();
  atualizarOrdemDasTabelas(configuracoes);
}

function atualizarListaDeGrupos() {
  const container = document.getElementById("grupo-checkboxes");
  if (!container) return;

  container.innerHTML = "";
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(4, 1fr)";
  container.style.gap = "12px";
  container.style.alignItems = "start";

  const gruposVisiveis = new Set(
    Array.from(document.querySelectorAll(".grupo-tabela"))
      .map(t => t.dataset.group?.replace("grupo-", ""))
      .filter(Boolean)
  );

  const gruposUnicos = [...new Set(includedProducts.map(p => p.class))]
    .filter(grupo => gruposVisiveis.has(grupo));

  const configuracoes = window.grupoConfiguracoes || [];
  const haCheckboxMarcado = configuracoes.length > 0 ? configuracoes.some(c => c.checkboxMarcado) : true;

  // 🔍 Barra de pesquisa
  const searchWrapper = document.createElement("div");
  searchWrapper.style.gridColumn = "span 4";
  searchWrapper.style.display = "flex";
  searchWrapper.style.justifyContent = "space-between";
  searchWrapper.style.alignItems = "center";
  searchWrapper.style.gap = "12px";
  searchWrapper.style.marginBottom = "8px";

  const inputPesquisa = document.createElement("input");
  inputPesquisa.type = "text";
  inputPesquisa.placeholder = "Pesquisar grupo...";
  inputPesquisa.style.flex = "1";
  inputPesquisa.style.padding = "6px 10px";
  inputPesquisa.style.border = "1px solid #ccc";
  inputPesquisa.style.borderRadius = "6px";

  const filtroSelect = document.createElement("select");
  filtroSelect.innerHTML = `
    <option value="todos">Todos</option>
    <option value="marcados">Marcados</option>
    <option value="desmarcados">Desmarcados</option>
  `;
  filtroSelect.style.padding = "6px 10px";
  filtroSelect.style.border = "1px solid #ccc";
  filtroSelect.style.borderRadius = "6px";

  const botoesWrapper = document.createElement("div");
  botoesWrapper.style.gridColumn = "span 4";
  botoesWrapper.style.display = "flex";
  botoesWrapper.style.justifyContent = "space-between";
  botoesWrapper.style.gap = "8px";
  botoesWrapper.style.marginBottom = "8px";

  const btnMarcar = document.createElement("button");
  btnMarcar.textContent = "Marcar todos";
  btnMarcar.className = "botao-marcar";
  btnMarcar.style.flex = "1";
  btnMarcar.addEventListener("click", () => {
    document.querySelectorAll("#grupo-checkboxes input[type='checkbox']").forEach(cb => {
      cb.checked = true;
      const className = cb.getAttribute("data-class");
      const grupoTabela = document.querySelector(`.grupo-tabela[data-group="grupo-${className}"]`);
      if (grupoTabela) grupoTabela.style.display = "block";
    });
  });

  const btnDesmarcar = document.createElement("button");
  btnDesmarcar.textContent = "Desmarcar todos";
  btnDesmarcar.className = "botao-desmarcar";
  btnDesmarcar.style.flex = "1";
  btnDesmarcar.addEventListener("click", () => {
    document.querySelectorAll("#grupo-checkboxes input[type='checkbox']").forEach(cb => {
      cb.checked = false;
      const className = cb.getAttribute("data-class");
      const grupoTabela = document.querySelector(`.grupo-tabela[data-group="grupo-${className}"]`);
      if (grupoTabela) grupoTabela.style.display = "none";
    });
  });

  botoesWrapper.appendChild(btnMarcar);
  botoesWrapper.appendChild(btnDesmarcar);

  searchWrapper.appendChild(inputPesquisa);
  searchWrapper.appendChild(filtroSelect);
  container.appendChild(searchWrapper);
  container.appendChild(botoesWrapper);

  const dropTop = document.createElement("div");
  dropTop.style.gridColumn = "span 4";
  dropTop.style.height = "20px";
  dropTop.style.border = "2px dashed #ccc";
  dropTop.style.borderRadius = "6px";
  dropTop.style.marginBottom = "10px";
  dropTop.style.textAlign = "center";
  dropTop.style.color = "#888";
  dropTop.innerText = "Solte aqui para mover para o topo";

  dropTop.addEventListener("dragover", e => e.preventDefault());
  dropTop.addEventListener("drop", e => {
    e.preventDefault();
    const draggedClass = e.dataTransfer.getData("text/plain");
    const draggedElement = container.querySelector(`[data-class="${draggedClass}"]`);
    if (draggedElement) {
      container.insertBefore(draggedElement, dropTop.nextSibling);
      reordenarTabelasPorGrupoVisual();
    }
  });
  container.appendChild(dropTop);

  gruposUnicos.forEach(className => {
    const linha = document.createElement("div");
    linha.classList.add("grupo-item");
    linha.setAttribute("draggable", "true");
    linha.setAttribute("data-class", className);
    linha.style.display = "flex";
    linha.style.alignItems = "center";
    linha.style.gap = "8px";
    linha.style.padding = "10px 12px";
    linha.style.border = "1px solid #ddd";
    linha.style.borderRadius = "8px";
    linha.style.background = "#fff";
    linha.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)";
    linha.style.cursor = "grab";
    linha.dataset.originalText = className.toLowerCase();

    linha.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", className);
      e.dataTransfer.effectAllowed = "move";
      linha.style.opacity = "0.5";
    });

    linha.addEventListener("dragend", () => {
      linha.style.opacity = "1";
    });

    linha.addEventListener("dragover", (e) => {
      e.preventDefault();
      linha.style.background = "#eef";
    });

    linha.addEventListener("dragleave", () => {
      linha.style.background = "#fff";
    });

    linha.addEventListener("drop", (e) => {
      e.preventDefault();
      linha.style.background = "#fff";
      const draggedClass = e.dataTransfer.getData("text/plain");
      const draggedElement = container.querySelector(`[data-class="${draggedClass}"]`);
      if (draggedElement && draggedElement !== linha) {
        container.insertBefore(draggedElement, linha.nextSibling);
        reordenarTabelasPorGrupoVisual();
      }
    });

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("data-class", className);
    const grupoTabela = document.querySelector(`.grupo-tabela[data-group="grupo-${className}"]`);
    const config = configuracoes.find(c => c.nome === className);
    checkbox.checked = config ? config.checkboxMarcado !== false : true;
    checkbox.style.width = "18px";
    checkbox.style.height = "18px";
    checkbox.style.accentColor = "#4a90e2";
    checkbox.addEventListener("change", () => {
      if (grupoTabela) {
        grupoTabela.style.display = checkbox.checked ? "block" : "none";
      }
    });

    const inputOrdem = document.createElement("input");
    inputOrdem.type = "number";
    inputOrdem.min = 1;
    inputOrdem.value = config?.ordemBase || 1;
    inputOrdem.title = "Número base do grupo";
    inputOrdem.setAttribute("data-class", className);
    inputOrdem.style.width = "60px";
    inputOrdem.style.padding = "4px 6px";
    inputOrdem.style.border = "1px solid #ccc";
    inputOrdem.style.borderRadius = "4px";
    inputOrdem.style.fontSize = "14px";
    inputOrdem.addEventListener("input", () => {
      aplicarOrdemGrupos();
      reordenarTabelasPorGrupoVisual();
    });

    const label = document.createElement("label");
    label.innerText = className;
    label.style.whiteSpace = "nowrap";
    label.style.flex = "1";
    label.style.fontSize = "15px";

    const botaoDuplicar = document.createElement("button");
    botaoDuplicar.textContent = "🌀";
    botaoDuplicar.title = "Duplicar grupo";
    botaoDuplicar.style.border = "none";
    botaoDuplicar.style.background = "none";
    botaoDuplicar.style.cursor = "pointer";
    botaoDuplicar.style.fontSize = "18px";
    botaoDuplicar.style.marginLeft = "4px";
    botaoDuplicar.addEventListener("click", () => {
      duplicarGrupo(className);
    });

    linha.appendChild(checkbox);
    linha.appendChild(inputOrdem);
    linha.appendChild(label);
    linha.appendChild(botaoDuplicar);
    container.appendChild(linha);
  });

  inputPesquisa.addEventListener("input", () => {
    const termo = inputPesquisa.value.trim().toLowerCase();
    document.querySelectorAll("#grupo-checkboxes .grupo-item").forEach(item => {
      const texto = item.dataset.originalText || "";
      item.style.display = texto.includes(termo) ? "flex" : "none";
    });
  });

  filtroSelect.addEventListener("change", () => {
    const filtro = filtroSelect.value;
    document.querySelectorAll("#grupo-checkboxes .grupo-item").forEach(item => {
      const checkbox = item.querySelector("input[type='checkbox']");
      if (filtro === "marcados") {
        item.style.display = checkbox.checked ? "flex" : "none";
      } else if (filtro === "desmarcados") {
        item.style.display = !checkbox.checked ? "flex" : "none";
      } else {
        item.style.display = "flex";
      }
    });
  });

  restaurarConfiguracoesDeGrupos();
  atualizarOrdemDasTabelas(window.grupoConfiguracoes || []);
}




function reordenarTabelasPorGrupoVisual() {
  const containerPai = document.querySelector("#included-products-container");
  if (!containerPai) return;

  const ordemVisual = Array.from(document.querySelectorAll("#grupo-checkboxes .grupo-item"))
    .map(div => div.getAttribute("data-class"));

  const tabelas = Array.from(document.querySelectorAll(".grupo-tabela"));

  ordemVisual.forEach(nomeGrupo => {
    const tabela = tabelas.find(tb => tb.dataset.group === `grupo-${nomeGrupo}`);
    if (tabela) {
      containerPai.appendChild(tabela);
    }
  });
}






function reordenarTabelasPorGrupoVisual() {
  const containerPai = document.querySelector("#included-products-container");
  if (!containerPai) return;

  const ordemVisual = Array.from(document.querySelectorAll("#grupo-checkboxes .grupo-item"))
    .map(div => div.getAttribute("data-class"));

  const tabelas = Array.from(document.querySelectorAll(".grupo-tabela"));

  ordemVisual.forEach(nomeGrupo => {
    const tabela = tabelas.find(tb => tb.dataset.group === `grupo-${nomeGrupo}`);
    if (tabela) {
      containerPai.appendChild(tabela); // move para o final
    }
  });
}





function preencherTudo(dados) {
    if (!dados) {
        console.warn("⚠️ Nenhum dado fornecido.");
        return;
    }

    // 🧾 1. Preenche campos do formulário principal
    if (dados.camposFormulario) {
        Object.entries(dados.camposFormulario).forEach(([id, valor]) => {
            const el = document.getElementById(id);
            if (el) el.value = valor;
        });
    }

    // 💾 2. Restaura os dados dos grupos (popup)
    if (dados.grupos) {
        window.groupPopupsData = JSON.parse(JSON.stringify(dados.grupos));

        const popup = document.getElementById("popup-info");
        const grupoIdAtual = popup?.dataset.groupId;

        if (grupoIdAtual && groupPopupsData[grupoIdAtual]) {
            const data = groupPopupsData[grupoIdAtual];
            document.getElementById("popup_gastos_totais").value = data.gastos_totais || '';
            document.getElementById("popup_margem_lucro").value = data.margem_lucro || '';
            document.getElementById("popup_impostos").value = data.impostos || '';
            document.getElementById("popup_margem_seguranca").value = data.margem_seguranca || '';
            document.getElementById("popup_miudezas").value = data.miudezas || '';
            document.getElementById("popup_margem_negociacao").value = data.margem_negociacao || '';
            document.getElementById("popup_descricao").value = data.descricao || '';
        }
    }

    // 🛒 3. Preenche produtos (temporariamente armazena fórmulas)
    const formulasPendentes = []; // ← Armazena fórmulas para aplicar depois

    if (Array.isArray(dados.produtosSelecionados)) {
        window.includedProducts = [];

        dados.produtosSelecionados.forEach((item, index) => {
            const preco = parseFloat((item.preco || "").replace("R$", "").replace(",", ".").trim()) || 0;
            const custo = parseFloat((item.custo || "").replace("R$", "").replace(",", ".").trim()) || 0;
            const quantidade = parseFloat(item.quantidade) || 1;

            window.includedProducts.push({
                index: index,
                class: item.grupo || "Sem Grupo",
                name: item.nome || `Produto ${index + 1}`,
                price: preco,
                cost: custo,
                quantity: quantidade,
                adjustedQuantity: quantidade,
            });

            formulasPendentes.push({
                index,
                formula_preco: item.formula_preco || "",
                formula_custo: item.formula_custo || "",
                formula_quantidade: item.formula_quantidade || ""
            });
        });
    }

    // ✅ Renderiza produtos primeiro
    if (typeof renderIncludedProducts === "function") {
        renderIncludedProducts();
    }

    // 🔁 Depois que a tabela estiver montada, aplica as fórmulas
    formulasPendentes.forEach(item => {
        const row = document.querySelector(`tr[data-index="${item.index}"]`);
        if (!row) return;

        if (item.formula_preco) {
            const el = row.querySelector(`.formula-input[data-type="price"]`);
            if (el) {
                el.dataset.rawFormula = item.formula_preco;
                el.innerText = item.formula_preco;
            }
        }

        if (item.formula_custo) {
            const el = row.querySelector(`.formula-input[data-type="cost"]`);
            if (el) {
                el.dataset.rawFormula = item.formula_custo;
                el.innerText = item.formula_custo;
            }
        }

        if (item.formula_quantidade) {
            const el = row.querySelector(`.formula-input[data-type="adjustedQuantity"]`);
            if (el) {
                el.dataset.rawFormula = item.formula_quantidade;
                el.innerText = item.formula_quantidade;
            }
        }
    });

    // Re-renderiza para aplicar os resultados das fórmulas
    if (typeof renderIncludedProducts === "function") {
        renderIncludedProducts();
    }

    console.log("✅ Dados restaurados com sucesso (com fórmulas aplicadas por último)!");
}


async function carregarGruposCheckboxes() {
    const container = document.getElementById("grupo-checkboxes");
  
    try {
      const response = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/classes");
      if (!response.ok) throw new Error("Erro ao buscar classes");
  
      const classes = await response.json();
  
      // 🧠 Ordena alfabeticamente
      classes.sort((a, b) => a.nome.localeCompare(b.nome));
  
      container.innerHTML = ""; // limpa antes de adicionar
  
      classes.forEach(classe => {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "6px";
  
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `grupo-${classe.nome}`;
        checkbox.name = `grupo-${classe.nome}`;
  
        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = classe.nome;
  
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
      });
  
    } catch (err) {
      console.error("❌ Erro ao carregar grupos:", err.message);
    }
  }
  
  function ordenarCheckboxesStaticamente() {
    const container = document.getElementById("grupo-checkboxes");
  
    const items = Array.from(container.children);
  
    // Ordenar os <div> pelo texto do label
    items.sort((a, b) => {
      const labelA = a.querySelector("label").textContent.trim().toLowerCase();
      const labelB = b.querySelector("label").textContent.trim().toLowerCase();
      return labelA.localeCompare(labelB);
    });
  
    // Re-anexar na ordem correta
    container.innerHTML = "";
    items.forEach(item => container.appendChild(item));
  }
  
  window.addEventListener("DOMContentLoaded", ordenarCheckboxesStaticamente);
  
  window.addEventListener("DOMContentLoaded", carregarGruposCheckboxes);
 
  function somarTotaisGerais() {
    const tabelas = document.querySelectorAll('.included-group-table');
  
    let totalVendaGeral = 0;
    let totalCustoGeral = 0;
  
    tabelas.forEach(tabela => {
      const totalRow = tabela.querySelector('tr.total-row');
      if (!totalRow) return;
  
      const colunas = totalRow.querySelectorAll('td, th');
  
      const vendaStr = colunas[4]?.textContent.replace('R$', '').trim() || '0.00';
      const custoStr = colunas[5]?.textContent.replace('R$', '').trim() || '0.00';
  
      const venda = parseFloat(vendaStr) || 0;
      const custo = parseFloat(custoStr) || 0;
  
      totalVendaGeral += venda;
      totalCustoGeral += custo;
    });
  
   
    somarFormulaResults()
    atualizarValorFinalFooter()
  }
  
  function somarFormulaResults() {
    const resultados = document.querySelectorAll(".extra-summary-row .formula-result");
  
    let total = 0;
    resultados.forEach(el => {
      const texto = el.textContent.replace("R$", "").trim();
      const valor = parseFloat(texto);
      if (!isNaN(valor)) {
        total += valor;
      }
    });
  
    return total;
  }
  
  function atualizarValorFinalFooter() {
    const total = somarFormulaResults();
  
    const formatado = total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  
    const footerSpan = document.getElementById("valor-total-proposta");
    if (footerSpan) {
      footerSpan.textContent = formatado;
    }
  }
  
function duplicarGrupoSemRender(classNameOriginal) {
  const grupoOriginal = includedProducts.filter(p => p.class === classNameOriginal);
  if (grupoOriginal.length === 0) return;

  const base = classNameOriginal.replace(/\s*\(\d+\)$/, '');
  const existentes = includedProducts.filter(p => p.class.startsWith(base));
  const numeroNovo = existentes.reduce((max, p) => {
    const match = p.class.match(/\((\d+)\)$/);
    return match ? Math.max(max, parseInt(match[1])) : max;
  }, 0) + 1;

  const novoNome = `${base} (${numeroNovo})`;
  console.log(`🌀 Duplicando grupo: "${classNameOriginal}" → "${novoNome}"`);

  const novosProdutos = grupoOriginal.map((produto, i) => {
    const copia = {
      ...structuredClone(produto),
      class: novoNome,
      index: includedProducts.length + i,
    };

    const index = produto.index;

    const priceFormulaEl = document.querySelector(`.formula-input[data-type="priceFormula"][data-index="${index}"]`);
    const quantityFormulaEl = document.querySelector(`.formula-input[data-type="adjustedQuantityFormula"][data-index="${index}"]`);

    const formulaVenda = (priceFormulaEl?.dataset.rawFormula || priceFormulaEl?.textContent || '').trim();
    const formulaQtd = (quantityFormulaEl?.dataset.rawFormula || quantityFormulaEl?.textContent || '').trim();

    copia.formula_venda = formulaVenda;
    copia.formula_quantidade_desejada = formulaQtd;

    return copia;
  });

  const groupFormulaInput = document.querySelector(
    `#included-products-container [data-class="${classNameOriginal}"] .extra-summary-row .formula-input[data-type="groupSaleFormula"]`
  );
  const formulaVendaFinal = groupFormulaInput?.textContent.trim() || "";

  if (!window.groupPopupsData) window.groupPopupsData = {};
  groupPopupsData[novoNome] = {
    ...(groupPopupsData[classNameOriginal] || {}),
    formula_venda_final: formulaVendaFinal
  };

  includedProducts.push(...novosProdutos);

  // Cria nova tabela para o grupo duplicado sem re-renderizar tudo
  const container = document.getElementById("included-products-container");
  if (!container) return;

  const novaTabelaHTML = gerarTabelaHTMLParaGrupo(novoNome, novosProdutos);
  container.insertAdjacentHTML("beforeend", novaTabelaHTML);

  if (typeof ativarEventosTabela === "function") {
    ativarEventosTabela(novoNome);
  }

  adicionarGrupoAoPainelCheckboxes(novoNome);

  const checkbox = document.querySelector(`#grupo-checkboxes [data-class="${novoNome}"]`);
  if (checkbox) checkbox.checked = true;

  const novaTabela = document.querySelector(`.grupo-tabela[data-group="grupo-${novoNome}"]`);
  if (novaTabela) novaTabela.style.display = "block";

  const input = document.querySelector(`.grupo-tabela[data-group="grupo-${novoNome}"] .formula-input[data-type="groupSaleFormula"]`);
  if (input) {
    input.textContent = formulaVendaFinal;
    input.setAttribute("data-raw-formula", formulaVendaFinal);
    if (typeof evaluateFormula === "function") {
      input.dispatchEvent(new Event('blur'));
    }
  }
}



function adicionarGrupoAoPainelCheckboxes(className) {
  const container = document.getElementById("grupo-checkboxes");
  if (!container || document.querySelector(`[data-class="${className}"]`)) return;

  const configuracoes = window.grupoConfiguracoes || [];
  const config = configuracoes.find(c => c.nome === className);
  const grupoTabela = document.querySelector(`.grupo-tabela[data-group="grupo-${className}"]`);

  const linha = document.createElement("div");
  linha.classList.add("grupo-item");
  linha.setAttribute("draggable", "true");
  linha.setAttribute("data-class", className);
  linha.dataset.originalText = className.toLowerCase();
  linha.style.display = "flex";
  linha.style.alignItems = "center";
  linha.style.gap = "8px";
  linha.style.padding = "10px 12px";
  linha.style.border = "1px solid #ddd";
  linha.style.borderRadius = "8px";
  linha.style.background = "#fff";
  linha.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)";
  linha.style.cursor = "grab";

  linha.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", className);
    e.dataTransfer.effectAllowed = "move";
    linha.style.opacity = "0.5";
  });

  linha.addEventListener("dragend", () => {
    linha.style.opacity = "1";
  });

  linha.addEventListener("dragover", (e) => {
    e.preventDefault();
    linha.style.background = "#eef";
  });

  linha.addEventListener("dragleave", () => {
    linha.style.background = "#fff";
  });

  linha.addEventListener("drop", (e) => {
    e.preventDefault();
    linha.style.background = "#fff";
    const draggedClass = e.dataTransfer.getData("text/plain");
    const draggedElement = container.querySelector(`[data-class="${draggedClass}"]`);
    if (draggedElement && draggedElement !== linha) {
      container.insertBefore(draggedElement, linha.nextSibling);
      reordenarTabelasPorGrupoVisual();
    }
  });

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.setAttribute("data-class", className);
  checkbox.checked = config ? config.checkboxMarcado !== false : true;
  checkbox.style.width = "18px";
  checkbox.style.height = "18px";
  checkbox.style.accentColor = "#4a90e2";
  checkbox.addEventListener("change", () => {
    if (grupoTabela) grupoTabela.style.display = checkbox.checked ? "block" : "none";
  });

  const inputOrdem = document.createElement("input");
  inputOrdem.type = "number";
  inputOrdem.min = 1;
  inputOrdem.value = config?.ordemBase || 1;
  inputOrdem.setAttribute("data-class", className);
  inputOrdem.title = "Número base do grupo";
  inputOrdem.style.width = "60px";
  inputOrdem.style.padding = "4px 6px";
  inputOrdem.style.border = "1px solid #ccc";
  inputOrdem.style.borderRadius = "4px";
  inputOrdem.style.fontSize = "14px";
  inputOrdem.addEventListener("input", () => {
    aplicarOrdemGrupos();
    reordenarTabelasPorGrupoVisual();
  });

  const label = document.createElement("label");
  label.innerText = className;
  label.style.whiteSpace = "nowrap";
  label.style.flex = "1";
  label.style.fontSize = "15px";

  const botaoDuplicar = document.createElement("button");
  botaoDuplicar.textContent = "🌀";
  botaoDuplicar.title = "Duplicar grupo";
  botaoDuplicar.style.border = "none";
  botaoDuplicar.style.background = "none";
  botaoDuplicar.style.cursor = "pointer";
  botaoDuplicar.style.fontSize = "18px";
  botaoDuplicar.style.marginLeft = "4px";
  botaoDuplicar.addEventListener("click", () => {
    duplicarGrupoSemRender(className);
  });

  linha.appendChild(checkbox);
  linha.appendChild(inputOrdem);
  linha.appendChild(label);
  linha.appendChild(botaoDuplicar);
  container.appendChild(linha);
}


  
  
function gerarNomeDuplicado(base) {
  const nomesExistentes = includedProducts.map(p => p.class);
  let contador = 1;
  let novoNome;

  do {
    novoNome = `${base} (cópia ${contador})`;
    contador++;
  } while (nomesExistentes.includes(novoNome));

  return novoNome;
}


  // Atualiza ao carregar a página
  document.addEventListener("DOMContentLoaded", () => {
    atualizarValorFinalFooter();
  });

  






  async function gerarOrdemDeProducao() {
  if (!document || !window) return console.error("Função deve ser executada em ambiente de navegador com DOM.");

  const getValue = id => document.getElementById(id)?.value || "-";

  const dados = {
    numero: getValue("numeroOrcamento"),
    data: getValue("dataOrcamento"),
    operador: getValue("operadorInterno"),
    vendedor: document.getElementById("vendedorResponsavel")?.selectedOptions[0]?.textContent || "-"
  };

  const clienteWrapper = document.querySelector(".cliente-item");
  dados.nomeCliente = clienteWrapper?.querySelector(".razaoSocial")?.value || "-";
  dados.telefoneCliente = clienteWrapper?.querySelector(".telefoneCliente")?.value || "-";

  const cabecalho = `
    <table class="table table-bordered table-sm w-100 mb-4">
      <tbody>
        <tr>
          <td><strong>Ordem de Produção</strong></td>
          <td><strong>Nº:</strong> ${dados.numero}</td>
          <td><strong>Data:</strong> ${dados.data}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Cliente:</strong> ${dados.nomeCliente}</td>
          <td><strong>Telefone:</strong> ${dados.telefoneCliente}</td>
        </tr>
        <tr>
          <td><strong>Operador:</strong> ${dados.operador}</td>
          <td colspan="2"><strong>Vendedor:</strong> ${dados.vendedor}</td>
        </tr>
      </tbody>
    </table>
  `;

  const tabelas = document.querySelectorAll(".grupo-tabela");
  let blocosHTML = "";

  tabelas.forEach(wrapper => {
    const tabela = wrapper.querySelector("table");
    if (!tabela) return;
    const tbody = tabela.querySelector("tbody");
    if (!tbody) return;

    const grupoTituloOriginal = wrapper.querySelector("h3 strong")?.textContent || "Grupo";
    const grupoTitulo = grupoTituloOriginal
      .replace(/\d+/g, '')
      .replace(/-/g, ' ')
      .split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ')
      .trim();

    const novaTabela = document.createElement("table");
    novaTabela.className = "table table-bordered table-sm w-100";
    novaTabela.style.pageBreakInside = "avoid";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th style="width: 40%; background-color: #f2f2f2;">Utilização</th>
        <th style="width: 40%; background-color: #f2f2f2;">Descrição</th>
        <th style="width: 20%; background-color: #f2f2f2;">Quantidade</th>
      </tr>`;
    novaTabela.appendChild(thead);

    const novoTbody = document.createElement("tbody");

    const linhas = Array.from(tbody.querySelectorAll("tr.draggable"));
    linhas.forEach(linha => {
      const utilizacao = linha.children[0]?.innerText || "";
      const descricao = linha.children[1]?.innerText || "";
      const quantidade = linha.children[3]?.innerText || "1";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${utilizacao}</td>
        <td>${descricao}</td>
        <td style="text-align: center;">${quantidade}</td>`;
      novoTbody.appendChild(row);
    });

    const obsRow = Array.from(tbody.querySelectorAll("tr")).find(tr => tr.querySelector(".editable-observacoes"));
    if (obsRow) {
      const obsTexto = obsRow.querySelector(".editable-observacoes")?.innerText || "";
      const obsRowFormatada = document.createElement("tr");
      obsRowFormatada.innerHTML = `<td colspan="3"><strong>Observações:</strong> ${obsTexto.replace(/\n/g, "<br>")}</td>`;
      novoTbody.appendChild(obsRowFormatada);
    }

    novaTabela.appendChild(novoTbody);

    blocosHTML += `
      <div style="break-inside: avoid; page-break-inside: avoid;">
        <h2 style="font-size: 16px; margin-top: 30px; text-align: center; border-bottom: 1px solid #000;">${grupoTitulo}</h2>
        ${novaTabela.outerHTML}
      </div>
    `;
  });

  const corpoHTML = `
    <html>
      <head>
        <title>Ordem de Produção - ${dados.numero}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; }
          table { font-size: 12px; page-break-inside: avoid; }
          th, td { padding: 4px; vertical-align: middle; }
          h2 { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        ${cabecalho}
        ${blocosHTML}
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow || !printWindow.document) {
    return console.error("Não foi possível abrir a nova janela para impressão.");
  }

  printWindow.document.open();
  printWindow.document.write(corpoHTML);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function gerarOrcamentoParaImpressao() {
  const getValue = id => document.getElementById(id)?.value || "-";

  const dados = {
    numero: getValue("numeroOrcamento"),
    data: getValue("dataOrcamento"),
    origem: getValue("origemCliente"),
    nomeOrigem: getValue("nomeOrigem"),
    codigoOrigem: getValue("codigoOrigem"),
    telefoneOrigem: getValue("telefoneOrigem"),
    emailOrigem: getValue("emailOrigem"),
    comissao: getValue("comissaoArquiteto"),
    condicao: getValue("condicaoPagamento"),
    prazos: getValue("prazosArea"),
    condicoesGerais: getValue("condicoesGerais"),
    operador: getValue("operadorInterno"),
    vendedor: document.getElementById("vendedorResponsavel")?.selectedOptions[0]?.textContent || "-"
  };

  const clienteWrapper = document.querySelector(".cliente-item");
  dados.nomeCliente = clienteWrapper?.querySelector(".razaoSocial")?.value || "-";
  dados.cpfCnpj = clienteWrapper?.querySelector(".cpfCnpj")?.value || "-";
  dados.telefoneCliente = clienteWrapper?.querySelector(".telefoneCliente")?.value || "-";

  const tabelas = document.querySelectorAll(".grupo-tabela");
  const grupos = {};
  let totalGeral = 0;

  tabelas.forEach(wrapper => {
    if (wrapper.style.display === "none") return;

    const tabela = wrapper.querySelector("table");
    if (!tabela) return;
    const tbody = tabela.querySelector("tbody");
    if (!tbody) return;
    const primeiraLinha = tbody.querySelector("tr.draggable");
    const totalRow = tbody.querySelector("tr.extra-summary-row");
    const obsRow = Array.from(tbody.querySelectorAll("tr")).find(tr => tr.querySelector(".editable-observacoes"));
    if (!primeiraLinha || !totalRow) return;

    const grupoId = primeiraLinha.children[0]?.innerText?.trim() || "sem-nome";
    const prefixo = grupoId.split(".")[0];

    const valorTotalStr = totalRow.querySelector(".formula-result")?.innerText || "R$ 0,00";
    const valorNumerico = parseFloat(valorTotalStr.replace("R$", "").replace(".", "").replace(",", ".")) || 0;
    totalGeral += valorNumerico;

    if (!grupos[prefixo]) grupos[prefixo] = { subgrupos: [], total: 0 };

    grupos[prefixo].total += valorNumerico;
    grupos[prefixo].subgrupos.push({
      utilizacao: primeiraLinha.children[1]?.innerText || "",
      descricao: primeiraLinha.children[2]?.innerText || "",
      observacao: obsRow?.querySelector(".editable-observacoes")?.innerText || ""
    });
  });

  let blocosHTML = "";

  Object.entries(grupos).forEach(([prefixo, grupo]) => {
    let bloco = `<h1 style="font-size: 18px; margin-top: 40px; text-align: center;">Grupo ${prefixo}</h1>`;
    grupo.subgrupos.forEach(sub => {
      bloco += `
        <table class="table table-bordered table-sm w-100">
          <thead>
            <tr>
              <th style="width: 50%; background:#f2f2f2">Utilização</th>
              <th style="width: 50%; background:#f2f2f2">Descrição</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${sub.utilizacao}</td>
              <td>${sub.descricao}</td>
            </tr>
            ${sub.observacao ? `<tr><td colspan="2"><strong>Observação:</strong> ${sub.observacao}</td></tr>` : ""}
          </tbody>
        </table>
      `;
    });

    bloco += `
      <div style="text-align: right; margin-top: 10px;">
        <strong>Total: R$ ${grupo.total.toFixed(2).replace('.', ',')}</strong>
      </div>
      <hr>
    `;

    blocosHTML += bloco;
  });

  const rodape = `
    <div style="margin-top: 60px;">
      <table class="table table-bordered table-sm w-100">
        <tbody>
          <tr><td><strong>Condição de Pagamento:</strong></td><td>${dados.condicao}</td></tr>
          <tr><td><strong>Prazos por Área:</strong></td><td>${dados.prazos.replace(/\n/g, "<br>")}</td></tr>
          <tr><td><strong>Condições Gerais:</strong></td><td>${dados.condicoesGerais.replace(/\n/g, "<br>")}</td></tr>
        </tbody>
      </table>
    </div>
    <div style="text-align: right; font-size: 18px; margin-top: 20px;">
      <strong>Total Geral: R$ ${totalGeral.toFixed(2).replace('.', ',')}</strong>
    </div>
  `;

  const cabecalho = `
    <div style="margin-bottom: 40px;">
      <table class="table table-bordered table-sm w-100">
        <tr>
          <td style="width: 40%; text-align: center; vertical-align: middle;">
            <img src="logo.jpg" style="max-height: 80px;"><br>
            <BR>
           
            CNPJ: 00.000.000/0000-00<br>
            (31) 99999-9999<br>
            www.ferreiraulhoa.com.br
          </td>
          <td style="width: 60%;">
            <table class="table table-sm w-100">
              <tbody>
                <tr><td><strong>Orçamento:</strong></td><td>${dados.numero}</td></tr>
                <tr><td><strong>Data:</strong></td><td>${dados.data}</td></tr>
                <tr><td><strong>Telefone:</strong></td><td>${dados.telefoneOrigem}</td></tr>
              </tbody>
            </table>
          </td>
        </tr>
      </table>

      <table class="table table-bordered table-sm w-100 mt-2">
        <tbody>
          <tr><td><strong>Email Origem:</strong></td><td>${dados.emailOrigem}</td></tr>
          <tr><td><strong>Cliente:</strong></td><td>${dados.nomeCliente}</td></tr>
          <tr><td><strong>CPF/CNPJ:</strong></td><td>${dados.cpfCnpj}</td></tr>
          <tr><td><strong>Telefone Cliente:</strong></td><td>${dados.telefoneCliente}</td></tr>
          <tr><td><strong>Vendedor:</strong></td><td>${dados.vendedor}</td></tr>
          <tr><td><strong>Operador:</strong></td><td>${dados.operador}</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const corpoHTML = `
    <html>
      <head>
        <title>Orçamento ${dados.numero}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          table { font-size: 12px; }
          th, td { padding: 4px; vertical-align: middle; }
          h1, h2 { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        ${cabecalho}
        ${blocosHTML}
        ${rodape}
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(corpoHTML);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
