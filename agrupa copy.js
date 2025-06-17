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




document.addEventListener("DOMContentLoaded", async () => {
  const selectVendedor = document.getElementById("selectVendedor");

  try {
    const response = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/vendedores");
    const vendedores = await response.json();

    vendedores.forEach(vendedor => {
      const option = document.createElement("option");
      option.value = vendedor.nome;
      option.textContent = vendedor.nome;
      selectVendedor.appendChild(option);
    });

  } catch (error) {
    console.error("❌ Erro ao carregar vendedores:", error);
  }
});


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

    // 🧠 Ao focar → mostrar fórmula original
    campo.addEventListener("focus", () => {
      campo.value = campo.dataset.formula || "";
    });

    // ✅ Ao sair → salvar fórmula e reavaliar
    campo.addEventListener("blur", () => {
      const novaFormula = campo.value.trim();
      campo.dataset.formula = novaFormula;
      grupo[tag] = novaFormula;

      try {
        const novoResultado = evaluateFormula(novaFormula, grupo);
        campo.value = isNaN(novoResultado) ? "Erro" : novoResultado;
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
      const query = productSearch.value.trim().toLowerCase();
      searchResultsTable.innerHTML = "";
    
      if (query.length < 3) return;
    
      const filteredProducts = products.filter(product => {
        const nome = product.name?.toLowerCase() || "";
        const codigo = product.codigo_produto?.toString().toLowerCase() || "";
        return nome.includes(query) || codigo.includes(query);
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
          alert(`📝 Descrição: \n\n${product.description}`);
        });
      });
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
  
  function abrirPopupValores(custos) {
    // Verifica se já existe o popup e remove
    const existingPopup = document.getElementById("popup-valores");
    if (existingPopup) existingPopup.remove();
  
    // Cria o container do popup
    const popup = document.createElement("div");
    popup.id = "popup-valores";
    popup.style.cssText = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border: 1px solid #ccc;
      padding: 20px;
      z-index: 10000;
      box-shadow: 0 0 10px rgba(0,0,0,0.2);
      width: 300px;
      font-family: Arial, sans-serif;
    `;
  
    // Estrutura HTML do popup
    popup.innerHTML = `
      <h4>Valores Calculados</h4>
      <div><strong>Custo Total de Material:</strong><br> ${custos.custoTotalMaterial}</div>
      <div style="margin-top:10px;"><strong>Preço Mínimo:</strong><br> ${custos.precoMinimo}</div>
      <div style="margin-top:10px;"><strong>Preço Sugerido:</strong><br> ${custos.precoSugerido}</div>
      <div style="margin-top:10px;"><strong>Lucro Real:</strong><br> ${custos.lucroReal}</div>
      <button onclick="document.getElementById('popup-valores').remove()" style="margin-top:15px;">Fechar</button>
    `;
  
    document.body.appendChild(popup);
  }
  

    
  function renderIncludedProducts() {
    console.log("render iniciado");
    let formulaCache = {
      priceFormula: {},
      costFormula: {},
      adjustedQuantityFormula: {}
    };
  
    ["priceFormula", "costFormula", "adjustedQuantityFormula"].forEach(type => {
      document.querySelectorAll(`.formula-input[data-type='${type}']`).forEach(el => {
        const index = el.dataset.index;
        if (index) formulaCache[type][index] = el.dataset.rawFormula || el.innerText.trim();
      });
    });
  
    const container = document.getElementById("included-products-container");
    if (!container) return;
    container.innerHTML = "";
  
    const groupedProducts = {};
  
    includedProducts.forEach((product, index) => {
      if (!product.class) return;
      if (!groupedProducts[product.class]) groupedProducts[product.class] = [];
  
      ["priceFormula", "costFormula", "adjustedQuantityFormula"].forEach(type => {
        if (formulaCache[type][index]) {
          product[type] = formulaCache[type][index];
        }
      });
  
      groupedProducts[product.class].push({ ...product, index });
    });
  
    const formatarReal = v => `R$ ${parseFloat(v || 0).toFixed(2)}`;
  
    Object.keys(groupedProducts).forEach(className => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("grupo-tabela");
      const grupoId = `grupo-${className.replace(/\s+/g, '-').toLowerCase()}`;
      wrapper.setAttribute("data-group", grupoId);
  
label.innerHTML = `
  <strong>${className}</strong>
  <button class="info-button" data-group="${grupoId}" style="margin-left: 8px;">?</button>
  <button class="money-button" data-group="${grupoId}" style="margin-left: 4px;">$</button>
`;

// Novo evento dinâmico para o botão $
label.querySelector(".money-button").addEventListener("click", () => {
  // Busca a tabela dentro do wrapper atual
  const tabela = wrapper.querySelector("table");

  if (!tabela) {
    console.error("❌ Tabela não encontrada para este grupo.");
    return;
  }

  // Seleciona o valor da segunda coluna da linha extra-summary-row
  const custoTotalElement = tabela.querySelector("tr.extra-summary-row > td:nth-child(2) > div.formula-input");

  if (!custoTotalElement) {
    console.error("❌ Custo Total de Material não encontrado.");
    return;
  }

  const custoTotalMaterial = custoTotalElement.textContent.trim();

  // Monta o objeto custos com o valor dinâmico
  const custos = {
    custoTotalMaterial: custoTotalMaterial,
    precoMinimo: "0.00",   // Placeholder por enquanto
    precoSugerido: "0.00",
    lucroReal: "0%"
  };

  abrirPopupValores(custos);
});


      
      label.querySelector(".info-button").addEventListener("click", () => abrirPopup(grupoId, className));
      wrapper.appendChild(label);
  
      const table = document.createElement("table");
      table.classList.add("included-group-table");
      table.innerHTML = `
        <thead>
          <tr>
            <th>Produto</th>
            <th>Valor de Custo Final</th>
            <th>Valor de Venda Final</th>
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
  
      let totalPrice = 0;
      let totalCost = 0;
      let totalQtd = 0;
      let totalVendaFormula = 0;
      let totalCustoFormula = 0;
  
      groupedProducts[className].forEach(product => {
        const context = { ...product, groupId: grupoId };
        const quantidade = parseFloat(product.adjustedQuantity ?? product.quantity ?? 1);
        context.quantity = quantidade;
  
        const cost = parseFloat(product.cost || 0);
        const price = parseFloat(product.price || 0);
  
        let quantidadeDesejada = 1;
        if (product.adjustedQuantityFormula) {
          try {
            quantidadeDesejada = evaluateFormula(product.adjustedQuantityFormula, context);
          } catch {
            quantidadeDesejada = 1;
          }
        } else if (product.adjustedQuantity !== undefined) {
          quantidadeDesejada = product.adjustedQuantity;
        }
        context.adjustedQuantity = quantidadeDesejada;
  
        const valorVenda = evaluateFormula(product.priceFormula || "0", context) * quantidadeDesejada;
        const valorCusto = evaluateFormula(product.costFormula || "0", context) * quantidadeDesejada;
        totalVendaFormula += valorVenda;
        totalCustoFormula += valorCusto;
  
        const row = document.createElement("tr");
        row.setAttribute("draggable", "true");
        row.classList.add("draggable");
        row.dataset.index = product.index;
        row.dataset.class = product.class;
  
        row.innerHTML = `
          <td>${product.name}</td>
          <td><div>${formatarReal(cost * quantidade)}</div></td>
          <td><div>${formatarReal(price)}</div></td>
          <td><div class="quantity-cell" contenteditable="true" data-index="${product.index}">${quantidade}</div></td>
          <td>
            <div class="formula-input" contenteditable="true" data-index="${product.index}" data-type="priceFormula" data-raw-formula="${product.priceFormula || ''}" style="display: none;">${product.priceFormula || ''}</div>
            <div class="formula-result" data-index="${product.index}" data-type="priceFormula" style="cursor: pointer;"></div>
          </td>
         <td><div>${product.codigo_produto || product.costFormula || "-"}</div></td>

          <td>
            <div class="formula-input" contenteditable="true" data-index="${product.index}" data-type="adjustedQuantityFormula" data-raw-formula="${product.adjustedQuantityFormula || ''}" style="display: none;">${product.adjustedQuantityFormula || ''}</div>
            <div class="formula-result" data-index="${product.index}" data-type="adjustedQuantityFormula" style="cursor: pointer;"></div>
          </td>
          <td>
            <button class="remove-product" data-index="${product.index}" onclick="removeProduct(${product.index})">Remover</button>
          </td>
        `;
  
        tbody.appendChild(row);
  
        const qtdCell = row.querySelector(".quantity-cell");
        if (qtdCell) {
          qtdCell.addEventListener("blur", () => {
            const newQtd = parseFloat(qtdCell.innerText.trim().replace(",", "."));
            const valorFinal = !isNaN(newQtd) && newQtd >= 0 ? newQtd : 1;
  
            const index = product.index;
            if (index !== undefined && includedProducts[index]) {
              includedProducts[index].quantity = valorFinal;
              includedProducts[index].adjustedQuantity = valorFinal;
            }
  
            renderIncludedProducts();
            
          });
  
          qtdCell.addEventListener("keydown", e => {
            if (e.key === "Enter") {
              e.preventDefault();
              qtdCell.blur();
            }
          });
        }
  
        const editableTypes = ["priceFormula", "adjustedQuantityFormula"];
        editableTypes.forEach(type => {
          const input = row.querySelector(`.formula-input[data-type='${type}']`);
          const display = row.querySelector(`.formula-result[data-type='${type}']`);
  
          if (input && display) {
            try {
              display.innerText = evaluateFormula(product[type] || "0", context);
            } catch (e) {
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
  
              const ctx = {
                ...product,
                groupId: grupoId,
                adjustedQuantity: quantidadeDesejada,
                quantity: quantidade
              };
  
              let result;
              try {
                result = evaluateFormula(newFormula || "0", ctx);
              } catch (e) {
                result = "Erro";
              }
  
              display.innerText = result;
              display.style.display = "block";
            });
  
            input.addEventListener("keydown", e => {
              if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
              }
            });
          }
        });
  
        totalCost += cost * quantidade;
        totalPrice += price * quantidade;
        totalQtd += quantidade;
  
        addDragAndDrop(row, className);
      });
  
      if (!window.groupPopupsData) window.groupPopupsData = {};
      if (!groupPopupsData[grupoId]) groupPopupsData[grupoId] = {};
      groupPopupsData[grupoId].custo_total = totalCost;
      groupPopupsData[grupoId].preco_total = totalPrice;
      groupPopupsData[grupoId].qtd_total = totalQtd;
  
      const totalRow = document.createElement("tr");
      totalRow.classList.add("total-row");
      totalRow.innerHTML = `
        <td><strong>Total (${className})</strong></td>
        <td><strong>${formatarReal(totalCost)}</strong></td>
        <td><strong></strong></td>
        <td><strong>${totalQtd}</strong></td>
        <td><strong>${formatarReal(totalVendaFormula)}</strong></td>
        <td><strong>${formatarReal(totalCustoFormula)}</strong></td>
        <td colspan="2"></td>
      `;
      tbody.appendChild(totalRow);
  
      const extraRow = document.createElement("tr");
      extraRow.classList.add("extra-summary-row");
  
      let groupFormula = groupPopupsData[grupoId]?.groupSaleFormula || "";
      let formulaResult;
      try {
        formulaResult = evaluateFormula(groupFormula || totalVendaFormula.toString(), {
          custo_total: totalCost,
          preco_total: totalPrice,
          qtd_total: totalQtd
        });
      } catch (e) {
        formulaResult = "Erro";
      }
  
      extraRow.innerHTML = `
        <td colspan="6" style="text-align: right;"><strong>Valor de venda final:</strong></td>
        <td colspan="2">
          <div 
            class="formula-input" 
            contenteditable="true" 
            data-type="groupSaleFormula" 
            style="display: none;"
          >${groupFormula}</div>
          <div 
            class="formula-result" 
            style="cursor: pointer;"
          >${formatarReal(formulaResult)}</div>
        </td>
      `;
      tbody.appendChild(extraRow);
  
      const input = extraRow.querySelector(".formula-input");
      const display = extraRow.querySelector(".formula-result");
  
      if (input && display) {
        display.addEventListener("click", () => {
          input.style.display = "block";
          display.style.display = "none";
          input.focus();
        });
  
        input.addEventListener("blur", () => {
          const novaFormula = input.innerText.trim();
          if (!groupPopupsData[grupoId]) groupPopupsData[grupoId] = {};
          groupPopupsData[grupoId].groupSaleFormula = novaFormula;
  
          let resultado;
          try {
            resultado = evaluateFormula(novaFormula || totalVendaFormula.toString(), {
              custo_total: totalCost,
              preco_total: totalPrice,
              qtd_total: totalQtd
            });
          } catch {
            resultado = "Erro";
          }
  
          display.innerText = formatarReal(resultado);
          input.style.display = "none";
          display.style.display = "block";
        });
  
        input.addEventListener("keydown", e => {
          if (e.key === "Enter") {
            e.preventDefault();
            input.blur();
          }
        });
      }
  
      wrapper.appendChild(table);
      container.appendChild(wrapper);
    });
  
    atualizarListaDeGrupos();
    atualizarValorFinalFooter()
  }
  
  
  
    
    
    
    
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
            if (draggedClass !== className) {
                return;
            }
        });

        row.addEventListener("drop", (event) => {
            event.preventDefault();
            const fromIndex = parseInt(event.dataTransfer.getData("index"));
            const fromClass = event.dataTransfer.getData("class");

            const toRow = event.target.closest("tr");
            if (!toRow || !toRow.dataset.index) return;

            const toIndex = parseInt(toRow.dataset.index);
            const toClass = toRow.dataset.class;

            if (fromClass !== toClass) {
                return;
            }

            const fromProduct = includedProducts.find(p => p.index == fromIndex);
            const toProductIndex = includedProducts.findIndex(p => p.index == toIndex);

            if (fromProduct && toProductIndex >= 0 && fromProduct.index !== toIndex) {
                includedProducts = includedProducts.filter(p => p.index !== fromIndex);
                includedProducts.splice(toProductIndex, 0, fromProduct);
                renderIncludedProducts();
            }
        });
    }

    productSearch.addEventListener("input", filterProducts);
    classFilter.addEventListener("change", filterProducts);




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
document.getElementById("field1").addEventListener("change", function () {
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



function atualizarListaDeGrupos() {
    const container = document.getElementById("grupo-checkboxes");
    if (!container) return;

    container.innerHTML = "";

    const gruposUnicos = [...new Set(includedProducts.map(p => p.class))];

    gruposUnicos.forEach(className => {
        const grupoId = `grupo-${className.replace(/\s+/g, '-')}`;
        
        // Cria checkbox para exibir/ocultar grupo
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = grupoId;
        checkbox.checked = true;

        // Controla exibição da tabela do grupo
        checkbox.addEventListener("change", () => {
            const tabelaGrupo = document.querySelector(`[data-group="${grupoId}"]`);
            if (tabelaGrupo) {
                tabelaGrupo.style.display = checkbox.checked ? "block" : "none";
            }
        });

        // Cria label
        const label = document.createElement("label");
        label.setAttribute("for", grupoId);
        label.innerText = className;

        const linha = document.createElement("div");
        linha.appendChild(checkbox);
        linha.appendChild(label);
        linha.style.display = "flex";
        linha.style.alignItems = "center";
        linha.style.gap = "8px";

        container.appendChild(linha);
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
  
  

  

  // Atualiza ao carregar a página
  document.addEventListener("DOMContentLoaded", () => {
    atualizarValorFinalFooter();
  });

  