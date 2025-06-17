/******************************************************************
 * renderIncludedProducts()
 * ----------------------------------------------------------------
 * • Desenha todos os grupos ou apenas um grupo específico
 *   (quando passado { grupoId })
 * • Linhas draggables, ordem sincronizada c/ includedProducts
 * • Mantém dados/fórmulas intactos após reordenação
 ******************************************************************/
/******************************************************************
 * renderIncludedProducts()
 * ----------------------------------------------------------------
 * - Desenha todos os grupos (ou apenas um via { grupoId })
 * - Cria linhas draggables (mantém ordem em includedProducts)
 * - NÃO executa listarProdutosEmDropdown() se estiver em modelo.html
 ******************************************************************/
/* ================================================================
 * renderIncludedProducts()
 * ---------------------------------------------------------------
 * • Quantidade usa primeiro o valor fixo `quantidade` (se existir);
 *   caso contrário, calcula a partir de `formula_quantidade`.
 * • Mantém todo o restante do comportamento (fórmulas editáveis,
 *   custo final, total do grupo, drag-and-drop, etc.).
 * ==============================================================*/
function renderIncludedProducts(dados = {}) {
  /* LOG opcional ................................................ */
  try { Object.entries(dados).forEach(([k, v]) => console.log(`🔹 ${k}:`, v)); }
  catch (e) { console.error("❌ Erro ao imprimir dados:", e, dados); }

  const isModeloPage = /modelo\.html$/i.test(window.location.pathname);
  const container    = document.getElementById("included-products-container");
  if (!container) return;

  const scrollY        = window.scrollY;
  const grupos         = agruparPorClasse(includedProducts);
  const grupoTarget    = dados.grupoId;
  const nomesOrdenados = Object.keys(grupos);

  /* Limpeza ..................................................... */
  if (grupoTarget) {
    container.querySelector(`.grupo-tabela[data-group="${grupoTarget}"]`)?.remove();
  } else {
    container.innerHTML = "";
  }

  /* Render de cada grupo ........................................ */
  nomesOrdenados.forEach(grupo => {
    if (grupoTarget && grupo !== grupoTarget) return;

    const produtos = grupos[grupo];
    if (!produtos?.length) return;

    const nomeOriginal = window.grupoNomeOriginalMap?.[grupo] || grupo;
    const nomeVisivel  = formatarNomeGrupo(grupo);
    const dadosPopup   = window.groupPopupsData?.[grupo] || dados?.popup || {};

    criarPopupParaGrupo(grupo, dadosPopup);

    /* Wrapper --------------------------------------------------- */
    const wrapper = document.createElement("div");
    wrapper.className      = "grupo-tabela border rounded mb-4 p-2";
    wrapper.dataset.group  = grupo;
    wrapper.dataset.nomeOriginal = nomeOriginal;

    wrapper.innerHTML = `
      <div class="botoes-wrapper mb-2">
        <button class="btn btn-outline-secondary me-2" onclick="abrirPopupGrupo('${grupo}')">Grupo "${nomeVisivel}"</button>
        <button class="btn btn-outline-secondary me-2" onclick="abrirPopupValores(calcularCustosGrupo('${grupo}'), '${grupo}')">Ver Valores Finais</button>
        <button class="btn btn-outline-secondary me-2" onclick="duplicarGrupo('${grupo}')">Duplicar Grupo</button>
      </div>
      <div class="d-flex align-items-center gap-2 my-2">
        <label class="form-label mb-0"><strong>Produto Acabado:</strong></label>
        <input type="text" class="form-control w-100" value="${nomeVisivel}" disabled>
      </div>
      <div class="d-flex align-items-center gap-2 mb-2">
        <label class="form-label mb-0"><strong>Ambiente:</strong></label>
        <input type="text" class="form-control w-100" placeholder="Descreva o ambiente...">
      </div>`;

    /* Tabela ---------------------------------------------------- */
    const tabela = document.createElement("table");
    tabela.className   = "included-group-table table table-bordered table-sm";
    tabela.dataset.group = grupo;

    let totalGrupo = 0;

    const linhas = produtos.map(prod => {
      const ctxGrupo = { ...prod, ...dadosPopup };

      /* ► Quantidade: valor fixo tem prioridade; senão, fórmula */
      const temQtdFixa   = prod.quantidade !== undefined && prod.quantidade !== null && prod.quantidade !== "";
      const qtyFormula   = prod.formula_quantidade || "";
      const quantidade   = temQtdFixa
            ? parseFloat(prod.quantidade) || 0
            : evaluateFormula(qtyFormula || "0", ctxGrupo);

      const qtyDisplay   = Number.isFinite(quantidade) ? quantidade : 0;

      /* ► Custo final = custo unitário × quantidade */
      const custoUnit       = parseFloat(prod.cost) || 0;
      const valorCustoFinal = custoUnit * qtyDisplay;
      totalGrupo += valorCustoFinal;

      return `
        <tr draggable="true"
            ondragstart="handleDragStart(event)"
            ondragover="handleDragOver(event)"
            ondrop="handleDrop(event)"
            data-index="${prod.index}" data-class="${grupo}">
          <td class="d-none ordem-cell">${prod.ordem}</td>

          <td contenteditable="true" class="editable-utilizacao">
            ${prod.descricao_utilizacao ?? prod.utilizacao ?? ""}
          </td>

          <td contenteditable="true" class="editable-descricao">${prod.descricao}</td>

          <td><div class="formula-result valor-custo-final"
                   data-index="${prod.index}" data-type="custoFinal">
                   R$ ${valorCustoFinal.toFixed(2).replace(".", ",")}
              </div></td>

          <td><div>R$ ${custoUnit.toFixed(2).replace(".", ",")}</div></td>

          <td><div>${prod.codigo_omie || "-"}</div></td>

          <!-- Quantidade (agora com lógica fixa/ fórmula) -->
   <td>
  <input type="number" class="form-control quantidade-fixa"
         data-index="${prod.index}" data-type="quantidade"
         value="${parseFloat(prod.formula_quantidade || prod.quantidade || 0)}" />
</td>


          <!-- Quantidade Desejada (original) -->
          <td>
            <div class="formula-input" contenteditable="true"
                 data-index="${prod.index}" data-type="adjustedQuantityFormula"
                 data-raw-formula="${prod.adjustedQuantityFormula || ''}"
                 style="display:none;">${prod.adjustedQuantityFormula || ''}</div>
            <div class="formula-result"
                 data-index="${prod.index}" data-type="adjustedQuantityFormula"
                 style="cursor:pointer;">${evaluateFormula(prod.adjustedQuantityFormula || "0", ctxGrupo)}</div>
          </td>

          <td>
            <button class="remove-product btn btn-sm btn-danger"
                    onclick="removeProduct(${prod.index})">Remover</button>
          </td>
        </tr>`;
    }).join("");

    /* Observações automáticas ---------------------------------- */
    const [p1, p2] = [produtos[0]?.descricao?.trim() || "", produtos[1]?.descricao?.trim() || ""];
    const obsAuto  = p1 ? `${p1}${p2 ? "; em " + p2 : ""}<br>Altura final:<br>Altura do Montante:` : "";

    tabela.innerHTML = `
      <thead>
        <tr>
          <th class="d-none">Ordem</th>
          <th>Utilização</th>
          <th>Descrição</th>
          <th>Valor de Custo Final</th>
          <th>Custo Unitário</th>
          <th>Código Omie</th>
          <th>Quantidade</th>
          <th>Quantidade Desejada</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        ${linhas}
        <tr class="extra-summary-row">
          <td colspan="3"><strong>Total:</strong></td>
          <td colspan="6"><div class="formula-result" style="font-weight:bold;">
            R$ ${totalGrupo.toFixed(2).replace(".", ",")}
          </div></td>
        </tr>
        <tr>
          <td colspan="3"><strong>Observações:</strong></td>
          <td colspan="6" contenteditable="true" class="editable-observacoes">${obsAuto}</td>
        </tr>
      </tbody>`;

    wrapper.appendChild(tabela);
    container.appendChild(wrapper);
  });

  /* Pós-render .................................................. */
  window.scrollTo({ top: scrollY });
  ativarCamposFormulaEditaveis();   // lida com fórmulas das duas colunas
  atualizarCamposCustoFinal();
  if (!isModeloPage) listarProdutosEmDropdown();
  listarTabelasExistentes();
  console.log("✅ Grupos renderizados / atualizados.");
}



function configurarDragAndDropLinhas(escopo = document) {
  // Seleciona todas as linhas que não sejam de resumo
  const linhas = escopo.querySelectorAll(
    ".included-group-table tbody tr:not(.extra-summary-row)"
  );

  linhas.forEach(tr => {
    // Evita registrar listeners duplicados
    if (tr.dataset.ddInit) return;

    tr.setAttribute("draggable", "true");
    tr.addEventListener("dragstart", handleDragStart);
    tr.addEventListener("dragover", handleDragOver);
    tr.addEventListener("drop", handleDrop);

    // Flag indicando que esta linha já está pronta para D&D
    tr.dataset.ddInit = "1";

    /* (Opcional) cursor + highlight para UX */
    tr.style.cursor = "move";
    tr.addEventListener("dragenter", () => tr.classList.add("bg-light"));
    tr.addEventListener("dragleave", () => tr.classList.remove("bg-light"));
  });
}
let draggedRow = null;

/* 1. Começou a arrastar ........................................ */
function handleDragStart(ev) {
  draggedRow = ev.currentTarget;               // a <tr> sendo arrastada
  ev.dataTransfer.effectAllowed = "move";
  ev.dataTransfer.setData("text/plain", "");   // Firefox precisa de um payload
}

/* 2. Arrastando sobre outra linha ............................... */
function handleDragOver(ev) {
  ev.preventDefault();                         // habilita soltar
  ev.dataTransfer.dropEffect = "move";
}

/* 3. Soltando a linha .......................................... */
function handleDrop(ev) {
  ev.preventDefault();
  const alvo = ev.currentTarget;               // <tr> onde soltei

  if (!draggedRow || draggedRow === alvo) return;

  /* Decide se insere antes ou depois com base no cursor */
  const rect      = alvo.getBoundingClientRect();
  const halfway   = rect.top + rect.height / 2;
  const before    = ev.clientY < halfway;
  const tbody     = alvo.parentElement;

  if (before) {
    tbody.insertBefore(draggedRow, alvo);
  } else {
    tbody.insertBefore(draggedRow, alvo.nextSibling);
  }

  /* Ajusta “Ordem” visual + array de dados */
  atualizarOrdemLinhas(tbody);
  draggedRow = null;
}

/* 4. Sincroniza DOM ↔ includedProducts .......................... */
function atualizarOrdemLinhas(tbody) {
  const linhas = [...tbody.querySelectorAll("tr:not(.extra-summary-row)")];

  linhas.forEach((tr, idx) => {
    /* 4.1 Atualiza número mostrado */
    tr.querySelector(".ordem-cell").textContent = idx + 1;

    /* 4.2 Atualiza o objeto original */
    const prodIndex = Number(tr.dataset.index);               // id único
    const prodObj   = includedProducts.find(p => p.index === prodIndex);
    if (prodObj) prodObj.ordem = idx + 1;
  });

  /* 4.3 Se quiser persistir em backend/localStorage, faça aqui */
}



function atualizarCamposCustoFinal() {
  includedProducts.forEach(prod => {
    const linha = document.querySelector(`.included-group-table tr[data-index="${prod.index}"]`);
    if (!linha) return;

    const grupo = prod.class;
    const contexto = { ...prod, ...groupPopupsData[grupo] };

    const quantidade = evaluateFormula(prod.adjustedQuantityFormula || '0', contexto);
    const custoUnitario = parseFloat(prod.cost) || 0;
    const valorFinal = quantidade * custoUnitario;

    const campoFinal = linha.querySelector(".valor-custo-final");
    if (campoFinal) {
      campoFinal.textContent = `R$ ${valorFinal.toFixed(2).replace(".", ",")}`;
    }
  });
} 

function tratarPercentual(valor) {
  if (typeof valor === "string") {
    valor = valor.replace("%", "").replace(",", ".").trim();
  }
  const num = parseFloat(valor);
  return isNaN(num) ? 0 : num / 100;
}


function calcularValoresGrupo(grupoId) {
  const tratarPercentual = valor => {
    if (typeof valor === "string") {
      valor = valor.replace("%", "").replace(",", ".").trim();
    }
    const num = parseFloat(valor);
    return isNaN(num) ? 0 : num / 100;
  };

  const obterValorNumerico = (tag) => {
    const input = document.querySelector(`#popup_${tag}[data-grupo="${grupoId}"]`);
    if (input) {
      const raw = input.value || "";
      const valor = tratarPercentual(raw);
      console.log(`🔍 ${tag} [${grupoId}] = ${raw} → ${valor}`);
      return valor;
    } else {
      console.warn(`⚠️ Campo "${tag}" não encontrado no grupo "${grupoId}"`);
      return 0;
    }
  };

  const custoMaterialBase = groupPopupsData?.[grupoId]?.valorTotalProdutos || 0;
  console.log(`📦 Base de cálculo (valorTotalProdutos) do grupo "${grupoId}": R$ ${custoMaterialBase.toFixed(2)}`);

  const miudezas          = obterValorNumerico("miudezas");
  const gastoOperacional  = obterValorNumerico("gasto_operacional");
  const impostos          = obterValorNumerico("impostos");
  const margemLucro       = obterValorNumerico("margem_lucro");
  const margemSeguranca   = obterValorNumerico("margem_seguranca");
  const comissaoArquiteta = obterValorNumerico("comissao_arquiteta");
  const margemNegociacao  = obterValorNumerico("margem_negociacao");

  const custoTotalMaterial = custoMaterialBase * (1 + miudezas);

  const divisor = 1 - (gastoOperacional + impostos + margemLucro);
  if (divisor <= 0) {
    console.warn(`❌ Divisor inválido no grupo "${grupoId}" (valor: ${divisor.toFixed(4)}). Ajuste os percentuais.`);
    return {
      custoTotalMaterial: "R$ 0,00",
      precoMinimo: "R$ 0,00",
      precoSugerido: "R$ 0,00",
      lucroReal: "R$ 0,00"
    };
  }

  const multiplicador = 1 + margemSeguranca + comissaoArquiteta;
  const precoMinimo   = (custoTotalMaterial / divisor) * multiplicador;
  const precoSugerido = precoMinimo * (1 + margemNegociacao);
  const lucroReal = precoMinimo > 0 ? precoMinimo - (impostos + custoTotalMaterial + gastoOperacional + margemSeguranca + comissaoArquiteta) : 0;

  // 💾 Salva no objeto global
  groupPopupsData[grupoId].custoTotalMaterial = custoTotalMaterial;
  groupPopupsData[grupoId].precoMinimo = precoMinimo;
  groupPopupsData[grupoId].precoSugerido = precoSugerido;
  groupPopupsData[grupoId].lucroReal = lucroReal;

  console.log(`✅ Resultados [${grupoId}] → Custo: ${custoTotalMaterial}, Min: ${precoMinimo}, Sugerido: ${precoSugerido}, Lucro: ${lucroReal}`);

  return {
    custoTotalMaterial: `R$ ${custoTotalMaterial.toFixed(2).replace(".", ",")}`,
    precoMinimo:        `R$ ${precoMinimo.toFixed(2).replace(".", ",")}`,
    precoSugerido:      `R$ ${precoSugerido.toFixed(2).replace(".", ",")}`,
    lucroReal:          `R$ ${lucroReal.toFixed(2).replace(".", ",")}`
  };
}


let valorTotalProdutosCalculado = 0; // Variável externa que guardará o valor total

function calcularValorTotalProdutosGrupo(grupoId) {
  // Encontra o container do grupo
  const grupoDiv = document.querySelector(`.grupo-tabela[data-group="${grupoId}"]`);
  if (!grupoDiv) {
    console.warn(`❌ Container com data-group="${grupoId}" não encontrado.`);
    return 0;
  }

  // Encontra a tabela interna dentro do grupo
  const tabela = grupoDiv.querySelector('.included-group-table');
  if (!tabela) {
    console.warn(`❌ Tabela não encontrada dentro do grupo: ${grupoId}`);
    return 0;
  }

  let total = 0;

  console.group(`📊 Soma da coluna "Valor de Custo Final" - Grupo: ${grupoId}`);

  // Itera sobre as linhas do corpo da tabela
  tabela.querySelectorAll("tbody tr:not(.extra-summary-row)").forEach((tr, index) => {
    const tds = tr.querySelectorAll("td");
    if (tds.length < 4) return;

    const valorDiv = tds[3].querySelector("div");
    if (!valorDiv) return;

    const texto = valorDiv.textContent.trim();
    const valor = parseFloat(texto.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.'));

    if (!isNaN(valor)) {
      total += valor;
      console.log(`✅ Linha ${index + 1}: "${texto}" → ${valor.toFixed(2)}`);
    } else {
      console.warn(`⚠️ Linha ${index + 1}: valor inválido → "${texto}"`);
    }
  });

  console.groupEnd();

  // Atualiza objeto e variável global
  if (!window.groupPopupsData) window.groupPopupsData = {};
  if (!window.groupPopupsData[grupoId]) window.groupPopupsData[grupoId] = {};

  window.groupPopupsData[grupoId].valorTotalProdutos = total;
  valorTotalProdutosCalculado = total;

  console.log(`📦 Total final do grupo "${grupoId}": R$ ${total.toFixed(2)}`);
  return total;
}



function criarPopupParaGrupo(grupoId, dadosPopup = {}) {
  const id = `popup-${grupoId}`;

  // 🔢 Calcula e salva o valor total da 3ª coluna
  let valorTotalProdutosCalculado = 0;
  if (typeof calcularValorTotalProdutosGrupo === "function") {
    valorTotalProdutosCalculado = calcularValorTotalProdutosGrupo(grupoId) || 0;
  }

  if (document.getElementById(id)) return;

  if (!window.groupPopupsData) window.groupPopupsData = {};
  if (!window.groupPopupsData[grupoId]) {
    window.groupPopupsData[grupoId] = dadosPopup;
  }

  const paginaSomenteLeitura = window.location.pathname.includes("criarPropostaV2.html");
  const camposOcultos = [
    
  ];

  if (!document.getElementById("popup-style")) {
    const style = document.createElement("style");
    style.id = "popup-style";
    style.innerHTML = `
      .popup-info {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: 9999;
        padding: 20px;
        box-sizing: border-box;
      }
      .popup-content {
        background-color: #fff;
        border-radius: 12px;
        padding: 30px;
        width: 100%;
        max-width: 700px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        position: relative;
        animation: fadeIn 0.3s ease-out;
      }
      .popup-footer {
        padding: 10px 0;
        text-align: right;
      }
      .popup-content .close-popup {
        position: absolute;
        top: 15px;
        right: 20px;
        font-size: 24px;
        color: #888;
        transition: 0.2s ease;
        cursor: pointer;
      }
      .popup-content .close-popup:hover {
        color: #000;
        transform: scale(1.2);
      }
      .popup-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 20px;
      }
      .popup-grid .form-group.full-width {
        grid-column: span 2;
      }
      .popup-grid label {
        font-weight: 500;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
      }
      .popup-grid input {
        width: 100%;
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid #ccc;
      }
      .copy-icon {
        font-size: 18px;
        cursor: pointer;
        margin-left: 6px;
        color: #888;
      }
      .copy-icon:hover {
        color: #000;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  const getCampo = (id, label, unidade = "", isPercentual = false) => {
    if (paginaSomenteLeitura && camposOcultos.includes(id)) {
      return "";
    }
    const simbolo = isPercentual ? "%" : "";
    return `
      <div class="form-group">
        <label for="popup_${id}">${simbolo} ${label}
          <span class="material-symbols-outlined copy-icon" onclick="copiarTag('${id}')">content_copy</span>
        </label>
        <input type="text" id="popup_${id}" data-tag="${id}" class="${isPercentual ? 'percentual-campo' : ''}"
               oninput="salvarCampoPopup('${grupoId}', '${id}', this.value)">
      </div>`;
  };

  const campos = `
    <input type="hidden" id="custo_total_base" value="${dadosPopup.custo_total_base || 1000}" />

    <div class="form-group full-width"><strong>📌 Informações</strong><hr></div>
    ${getCampo("miudezas", "Miudezas", "%", true)}
    ${getCampo("gasto_operacional", "Gasto Operacional", "%", true)}
    ${getCampo("impostos", "Impostos", "%", true)}
    ${getCampo("margem_lucro", "Margem de Lucro", "%", true)}
    ${getCampo("margem_seguranca", "Margem de Segurança", "%", true)}
    ${getCampo("comissao_arquiteta", "Comissão Arquiteta", "%", true)}
    ${getCampo("margem_negociacao", "Margem de Negociação (R$)", "", false)}

    <div class="form-group full-width"><strong>📐 Parâmetros Técnicos</strong><hr></div>
    ${getCampo("altura_montante", "Altura Montante")}
    ${getCampo("numero_montantes", "Número de Montantes")}
    ${getCampo("numero_protecoes", "Nº de Proteções / Alturas")}

    <div class="form-group full-width"><strong>💰 Cálculos Automáticos</strong><hr></div>
    <div class="form-group full-width">
      <label for="popup_descricao">Unidade
        <span class="material-symbols-outlined copy-icon" onclick="copiarTag('descricao')">content_copy</span>
      </label>
      <input type="text" id="popup_descricao" data-tag="descricao" placeholder="Digite a descrição..."
             oninput="salvarCampoPopup('${grupoId}', 'descricao', this.value)" />
    </div>

    <div class="form-group full-width"><strong>📊 Valores Gerais</strong><hr></div>
    ${getCampo("custoTotalMaterial", "Custo Total de Material")}
    ${getCampo("precoMinimo", "Preço Mínimo")}
    ${getCampo("precoSugerido", "Preço Sugerido")}
    ${getCampo("lucroReal", "Lucro Real")}
    <div class="form-group full-width">
      <label for="popup_valor_total_${grupoId}">Total Calculado dos Produtos (R$)</label>
      <input type="text" id="popup_valor_total_${grupoId}" readonly value="R$ ${valorTotalProdutosCalculado.toFixed(2).replace('.', ',')}" />
    </div>
  `;

  const popup = document.createElement("div");
  popup.className = "popup-info";
  popup.id = id;
  popup.style.display = "none";
  popup.setAttribute("data-group-id", grupoId);

  popup.innerHTML = `
    <div class="popup-content">
      <span class="close-popup" onclick="fecharPopupGrupo('${grupoId}')">&times;</span>
      <h3>Informações adicionais - ${formatarNomeGrupo(grupoId)}</h3>
      <div class="popup-grid">${campos}</div>
      <div class="popup-footer">
        <button onclick="fecharPopupGrupo('${grupoId}')" class="btn btn-secondary">Fechar</button>
      </div>
    </div>`;

  document.body.appendChild(popup);
  preencherCamposPopup(grupoId);
}


function abrirPopupGrupo(grupoId) {
  document.querySelectorAll(".popup-info").forEach(p => p.style.display = "none");

  const p = document.getElementById(`popup-${grupoId}`);
  if (p) {
    p.style.display = "flex";

    if (typeof calcularValorTotalProdutosGrupo === "function") {
      const total = calcularValorTotalProdutosGrupo(grupoId);

      const inputTotal = document.getElementById(`popup_valor_total_${grupoId}`);
      if (inputTotal) {
        inputTotal.value = `R$ ${total.toFixed(2).replace('.', ',')}`;
      }

      if (!total || isNaN(total)) {
        console.error(`❌ Valor total de produtos para o grupo "${grupoId}" está zerado ou inválido.`);
      }
    }

    // ✅ Preencher campos automáticos (calculados)
    preencherCamposCalculados(grupoId);
  }
}

function fecharPopupGrupo(grupoId) {
  const p = document.getElementById(`popup-${grupoId}`);
  if (p) p.style.display = "none";
}
function salvarCampoPopup(grupoId, campo, valor) {
  if (!window.groupPopupsData) window.groupPopupsData = {};
  if (!window.groupPopupsData[grupoId]) window.groupPopupsData[grupoId] = {};

  window.groupPopupsData[grupoId][campo] = valor;
  console.log(`💾 Campo salvo: [${grupoId}] ${campo} =`, valor);
}
function copiarTag(tag) {
  const texto = `#${tag}`;
  navigator.clipboard.writeText(texto).then(() => {
    console.log(`📋 Tag copiada: ${texto}`);
  });
}

function preencherCamposPopup(grupoId) {
  const grupoBase = grupoId.replace(/-\d+$/, "");

  const proposta = window.ultimaPropostaModelo;
  if (!proposta || !Array.isArray(proposta.grupos)) {
    console.warn('⚠️ Proposta modelo não carregada em window.ultimaPropostaModelo');
    return;
  }

  const grupoData = proposta.grupos.find(g => g.nome === grupoBase);
  if (!grupoData) {
    console.warn(`⚠️ Grupo "${grupoBase}" não encontrado em ultimaPropostaModelo.grupos`);
    return;
  }

  const dadosParametros = grupoData.parametros || {};  
  window.parametrosPorGrupo = window.parametrosPorGrupo || {};
  window.parametrosPorGrupo[grupoId] = dadosParametros;

  const dadosPopup = window.groupPopupsData?.[grupoId] || {};
  const popup = document.getElementById(`popup-${grupoId}`);
  if (!popup) {
    console.warn(`⚠️ Popup não encontrado para o grupo "${grupoId}" (esperado id="popup-${grupoId}")`);
    return;
  }

  const todosDados = { ...dadosParametros, ...dadosPopup };

  popup.querySelectorAll("[data-tag]").forEach(input => {
    const campo = input.getAttribute("data-tag");

    // ✅ Armazena o grupoId no campo
    input.setAttribute("data-grupo", grupoId);

    // ✅ Preenche valor se existir
    if (todosDados[campo] !== undefined) {
      input.value = todosDados[campo];
    }
  });

  }

function preencherCamposCalculados(grupoId) {
  const resultado = calcularValoresGrupo(grupoId);
  const popup = document.getElementById(`popup-${grupoId}`);
  if (!popup || !resultado) {
    console.warn(`⚠️ Popup não encontrado ou cálculo falhou para o grupo "${grupoId}"`);
    return;
  }

  // 🧩 Mapeamento dos campos calculados
  const campos = {
    custoTotalMaterial: resultado.custoTotalMaterial,
    precoMinimo: resultado.precoMinimo,
    precoSugerido: resultado.precoSugerido,
    lucroReal: resultado.lucroReal,
  };

  // 🖊️ Preenche os campos do popup com os valores retornados
  for (const [tag, valor] of Object.entries(campos)) {
    const input = popup.querySelector(`[data-tag="${tag}"]`);
    if (input) {
      input.value = valor;
      console.log(`📥 Campo calculado preenchido: #${tag} = ${valor}`);
    } else {
      console.warn(`⚠️ Campo com data-tag="${tag}" não encontrado no popup "${grupoId}"`);
    }
  }
}




