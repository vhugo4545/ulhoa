function evaluateFormula(formula, context = {}) {
  /* converte valores em números -------------------------------- */
  const parse = (val, label = "") => {
    if (val === undefined || val === null) return 0;
    if (typeof val === "string") {
      val = val.replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
      const extr = val.match(/-?\d+(\.\d+)?/);
      if (extr) return parseFloat(extr[0]);
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      console.warn(`⚠️ Valor inválido:`, val, `(Campo: ${label})`);
      return 0;
    }
    return num;
  };

  /* descobre grupo --------------------------------------------- */
  let groupId = context.groupId || context.class || context.grupoId || "";
  if (!groupId) {
    const active = document.activeElement;
    if (active?.getAttribute("data-grupo")) {
      groupId = active.getAttribute("data-grupo");
    } else {
      const wrapper = active?.closest?.(".grupo-tabela");
      groupId = wrapper?.dataset?.group || "";
    }
  }
  const cleanId = groupId.replace(/^grupo-/, "").replace(/-\d+$/, "");
  const popup   = window.groupPopupsData?.[cleanId] || {};
  const params  = window.parametrosPorGrupo?.[cleanId] || {};
  const vars    = { ...params, ...popup, ...context };

  /* substitui tags #variavel[...] ------------------------------- */
  try {
    if (!formula || typeof formula !== "string") return 0;
    if (!formula.includes("#")) return parse(formula);

    let parsed = formula
      .replace(/#arredondarCima\(([^)]+)\)/g, "Math.ceil($1)")
      .replace(/#arredondarBaixo\(([^)]+)\)/g, "Math.floor($1)")
      .replace(/#arredondarMais\(([^)]+)\)/g, "Math.round($1 + 0.499)")
      .replace(/#arredondarMenos\(([^)]+)\)/g, "Math.round($1 - 0.499)");

    parsed = parsed.replace(/#([a-zA-Z0-9_]+)(?:\[(.*?)\])?/g, (_, tag, grp) => {
      const tgt = grp ? grp.replace(/^grupo-/, "").replace(/-\d+$/, "") : cleanId;
      const dados = {
        ...window.parametrosPorGrupo?.[tgt],
        ...window.groupPopupsData?.[tgt]
      };
      const valor = dados?.[tag] ?? vars?.[tag];
      return parse(valor, tag);
    });

    const res = Function(`"use strict"; return (${parsed})`)();
    return Number.isFinite(res) ? res : 0;
  } catch (e) {
    console.warn("❌ Erro ao avaliar fórmula:", formula, e);
    return 0;
  }
}



function ativarCamposFormulaEditaveis(escopo = document) {
  /* clique no resultado → mostra input -------------------------- */
  escopo.querySelectorAll(".formula-result").forEach(div => {
    if (div.dataset.listener) return;
    div.dataset.listener = "1";

    div.addEventListener("click", () => {
      const inp = div.parentElement.querySelector(".formula-input");
      if (!inp) return;

      inp.textContent =
        inp.dataset.rawFormula ||
        getFormulaFromArray(inp.dataset.index, inp.dataset.type) || "";

      inp.style.display = "block";
      div.style.display = "none";
      placeCaretAtEnd(inp);
      inp.focus();
    });
  });

  /* blur / Enter no input --------------------------------------- */
  escopo.querySelectorAll(".formula-input").forEach(inp => {
    if (inp.dataset.listener) return;
    inp.dataset.listener = "1";

    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
    });

    inp.addEventListener("blur", () => {
      const formula = inp.textContent.trim();
      inp.dataset.rawFormula = formula;
      updateFormulaInArray(inp.dataset.index, inp.dataset.type, formula);

      const ctx       = buildContext(inp);
      let resultado   = evaluateFormula(formula, ctx);

      if (isNaN(resultado)) {
        const num = parseFloat(formula.replace("R$", "").replace(/\./g, "").replace(",", "."));
        resultado = !isNaN(num) ? num : formula;
      }

      const resDiv = inp.parentElement.querySelector(".formula-result");
      const isQuantidade = inp.dataset.type === "quantidadeFormula";

      resDiv.textContent = (typeof resultado === "number")
        ? (isQuantidade
            ? resultado                              // mostra só o número
            : `R$ ${resultado.toFixed(2).replace(".", ",")}`)
        : resultado;

      inp.style.display  = "none";
      resDiv.style.display = "block";

      /* dispare recálculos globais ------------------------------ */
      recalcularTotaisTabela?.();
      atualizarCamposCustoFinal?.();
    });
  });
}


/* ---------- Helpers ------------------------------------------------ */

/* Retorna fórmula salva no array usando o id único (não posição) */
function getFormulaFromArray(id, campo) {
  const prod = includedProducts.find(p => String(p.index) === String(id));
  return prod ? prod[campo] : "";
}

/* Atualiza/livra a fórmula no array */
function updateFormulaInArray(id, campo, formula) {
  const prod = includedProducts.find(p => String(p.index) === String(id));
  if (prod) prod[campo] = formula;
}

/* Monta o contexto correto para evaluateFormula() */
function buildContext(input) {
  const id       = input.dataset.index;
  const groupId  = input.closest("tr")?.dataset.class;
  const prodObj  = includedProducts.find(p => String(p.index) === String(id)) || {};
  return { ...prodObj, ...(groupPopupsData[groupId] || {}), groupId };
}

/* (Opcional) coloca o cursor no fim do contenteditable */
function placeCaretAtEnd(el) {
  const range = document.createRange();
  const sel   = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}


function recalcularTudo() {
  if (!Array.isArray(includedProducts)) return;

  includedProducts.forEach((prod, index) => {
    ["adjustedQuantityFormula", "custoFormula", "precoFormula"].forEach(tipo => {
      const formula = prod[tipo];
      if (formula) {
        const groupId = prod.class?.replace(/[^a-zA-Z0-9-_]/g, "-") || "";

        const context = {
          ...prod,
          groupId
        };

        const resultado = evaluateFormula(formula, context);
        const resultDiv = document.querySelector(`.formula-result[data-index='${index}'][data-type='${tipo}']`);
        if (resultDiv) {
          resultDiv.textContent = isNaN(resultado) ? "0" : resultado.toFixed(2);
        }

        console.groupCollapsed(`🔍 Produto ${index + 1} [${tipo}]`);
        console.log("Fórmula:", formula);
        console.log("Grupo:", prod.class);
        console.log("Contexto:", context);
        console.log("Resultado:", resultado);
        console.groupEnd();
      }
    });
  });

  console.log("🔁 Todas as fórmulas recalculadas.");
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

  calcularSomaTotal(); // se já existir
}
function recalcularTotaisTabela() {
  // Força campos contenteditable a salvar conteúdo antes do cálculo
  document.querySelectorAll("[contenteditable=true]").forEach(e => e.blur());

  document.querySelectorAll(".included-group-table").forEach(tabela => {
    tabela.querySelectorAll("tbody tr:not(.extra-summary-row)").forEach((linha, i) => {
      const tds = linha.querySelectorAll("td");
      if (tds.length < 7) return;

      const grupo = tabela.dataset.group;
      const index = linha.dataset.index;
      const contexto = {
        ...includedProducts?.[index],
        groupId: grupo
      };

      // 📌 Quantidade: usa fórmula se existir
      let qtd = 0;
      const formulaInput = tds[6].querySelector(".formula-input");
      const formulaCampo = formulaInput?.textContent?.trim();
      if (formulaCampo) {
        qtd = evaluateFormula(formulaCampo, contexto);
      }

      // 📌 Custo unitário: usa fórmula se estiver com dataset.formula
      const custoEl = tds[4].querySelector("div");
      const formulaCusto = custoEl?.dataset?.formula?.trim();
      let custo = 0;
      if (formulaCusto) {
        custo = evaluateFormula(formulaCusto, contexto);
      } else if (custoEl?.textContent) {
        custo = parseFloat(custoEl.textContent.replace("R$", "").replace(",", ".").trim()) || 0;
      }

      // 📌 Total final = quantidade × custo
      const total = qtd * custo;
      const finalEl = tds[3].querySelector("div");
      if (finalEl) {
        finalEl.textContent = `R$ ${total.toFixed(2).replace(".", ",")}`;
      }

      // Log
      console.log(`🔹 Linha ${i + 1} [Grupo: ${grupo} | Index: ${index}]: Qtd = ${qtd}, Custo = ${custo}, Total = ${total.toFixed(2)}`);
    });
  });
}



function calcularCustosGrupo(grupoId) {
  const dados = groupPopupsData?.[grupoId] || {};
  return {
    custoTotalMaterial: dados.custoTotalMaterial || 0,
    precoSugerido: dados.precoSugerido || 0,
    precoMinimo: dados.precoMinimo || 0,
  };
}
const btnValores = document.createElement("button");
btnValores.className = "btn btn-outline-secondary me-2";
btnValores.textContent = " Ver Valores Finais";
btnValores.onclick = () => {
  const custosGrupo = calcularCustosGrupo(grupo); // <-- Certifique-se que existe
  abrirPopupValores(custosGrupo, grupo);
};
botoesWrapper.appendChild(btnValores);
