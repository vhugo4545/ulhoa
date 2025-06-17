async function salvarPropostaEditavel() {
  try {
    const clientes = Array.from(document.querySelectorAll(".cliente-item")).map(el => ({
      nome_razao_social: el.querySelector(".razaoSocial")?.value || "",
      codigoOmie: el.querySelector(".codigoCliente")?.value || "",
      cpfCnpj: el.querySelector(".cpfCnpj")?.value || "",
      funcao: el.querySelector(".funcaoCliente")?.value || "",
      telefone: el.querySelector(".telefoneCliente")?.value || ""
    }));

    const condicaoPagamento = document.getElementById("condicaoPagamento")?.value || "";
    let parcelas = [];
    if (condicaoPagamento === "parcelado") {
      const datas = document.querySelectorAll(".data-parcela");
      const valores = document.querySelectorAll(".valor-parcela");
      parcelas = Array.from(datas).map((el, i) => ({
        data: el.value,
        valor: valores[i]?.value || ""
      }));
    }

    const camposFormulario = {
      numeroOrcamento: document.getElementById("numeroOrcamento")?.value || "",
      dataOrcamento: document.getElementById("dataOrcamento")?.value || "",
      origemCliente: document.getElementById("origemCliente")?.value || "",
      clientes,
      cep: document.getElementById("cep")?.value || "",
      rua: document.getElementById("rua")?.value || "",
      numero: document.getElementById("numero")?.value || "",
      complemento: document.getElementById("complemento")?.value || "",
      bairro: document.getElementById("bairro")?.value || "",
      cidade: document.getElementById("cidade")?.value || "",
      estado: document.getElementById("estado")?.value || "",
      vendedorResponsavel: document.getElementById("vendedorResponsavel")?.value || "",
      operadorInterno: document.getElementById("operadorInterno")?.value || "",
      prazosArea: document.getElementById("prazosArea")?.value || "",
      condicaoPagamento,
      condicoesGerais: document.getElementById("condicoesGerais")?.value || "",
      parcelas
    };

    const grupos = [];
    document.querySelectorAll(".grupo-tabela").forEach(container => {
      const nomeGrupo = container.dataset.group;
      const tabela = container.querySelector(".included-group-table");
      const linhas = tabela.querySelectorAll("tbody tr:not(.extra-summary-row):not(.extra-summary-row ~ tr)");

      const itens = Array.from(linhas).map(tr => {
        const precoStr = tr.querySelector("td:nth-child(4) div")?.textContent || "";
        const custoStr = tr.querySelector("td:nth-child(5) div")?.textContent || "";
        const codigoOmie = tr.querySelector("td:nth-child(6) div")?.textContent.trim() || "";

        const quantidadeStr = tr.querySelector("td:nth-child(7)")?.textContent || ""; // sem parse
        const quantidadeDesejadaStr = tr.querySelector("td:nth-child(8) .formula-result")?.textContent || "";

        return {
          nome_produto: tr.querySelector(".editable-descricao")?.textContent.trim() || "",
          preco: precoStr, // salva como texto
          custo: custoStr, // salva como texto
          quantidade: quantidadeStr.trim(), // exatamente como está na tabela
          quantidade_desejada: quantidadeDesejadaStr.trim(),
          descricao_utilizacao: tr.querySelector(".editable-utilizacao")?.textContent.trim() || "",
          codigo_omie: codigoOmie,
          formula_preco: tr.dataset.formulaPreco || "",
          formula_custo: tr.dataset.formulaCusto || "",
          formula_quantidade: tr.querySelector(".formula-input")?.textContent?.trim() || ""
        };
      }).filter(item => item.nome_produto);

      const parametros = { ...window.groupPopupsData?.[nomeGrupo] };
      const popup = document.getElementById(`popup-${nomeGrupo}`);
      if (popup) {
        popup.querySelectorAll("[data-tag]").forEach(input => {
          const chave = input.getAttribute("data-tag");
          if (chave) parametros[chave] = input.value;
        });
      }

      if (itens.length > 0) {
        grupos.push({ nome: nomeGrupo, itens, parametros });
      }
    });

    if (!grupos.length) {
      console.warn("⚠️ Nenhum grupo ou item para salvar.");
      return { erro: "Nenhum produto informado." };
    }

    const numeroProposta = camposFormulario.numeroOrcamento || Date.now().toString();

    const proposta = {
      tipoProposta: "editavel",
      numeroProposta,
      camposFormulario,
      grupos
    };

    const resposta = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/propostas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposta)
    });

    const resultado = await resposta.json();
    console.log("📦 Resposta do servidor:", resultado);
    return resultado;

  } catch (erro) {
    console.error("❌ Erro ao salvar proposta:", erro);
    return { erro: "Erro inesperado ao salvar proposta." };
  }
}
async function  salvarPropostaModelo() {
  try {
    const clientes = Array.from(document.querySelectorAll(".cliente-item")).map(el => ({
      nome_razao_social: el.querySelector(".razaoSocial")?.value || "",
      codigoOmie: el.querySelector(".codigoCliente")?.value || "",
      cpfCnpj: el.querySelector(".cpfCnpj")?.value || "",
      funcao: el.querySelector(".funcaoCliente")?.value || "",
      telefone: el.querySelector(".telefoneCliente")?.value || ""
    }));

    const condicaoPagamento = document.getElementById("condicaoPagamento")?.value || "";
    let parcelas = [];
    if (condicaoPagamento === "parcelado") {
      const datas = document.querySelectorAll(".data-parcela");
      const valores = document.querySelectorAll(".valor-parcela");
      parcelas = Array.from(datas).map((el, i) => ({
        data: el.value,
        valor: valores[i]?.value || ""
      }));
    }

    const camposFormulario = {
      numeroOrcamento: document.getElementById("numeroOrcamento")?.value || "",
      dataOrcamento: document.getElementById("dataOrcamento")?.value || "",
      origemCliente: document.getElementById("origemCliente")?.value || "",
      clientes,
      cep: document.getElementById("cep")?.value || "",
      rua: document.getElementById("rua")?.value || "",
      numero: document.getElementById("numero")?.value || "",
      complemento: document.getElementById("complemento")?.value || "",
      bairro: document.getElementById("bairro")?.value || "",
      cidade: document.getElementById("cidade")?.value || "",
      estado: document.getElementById("estado")?.value || "",
      vendedorResponsavel: document.getElementById("vendedorResponsavel")?.value || "",
      operadorInterno: document.getElementById("operadorInterno")?.value || "",
      prazosArea: document.getElementById("prazosArea")?.value || "",
      condicaoPagamento,
      condicoesGerais: document.getElementById("condicoesGerais")?.value || "",
      parcelas
    };

    const grupos = [];
    document.querySelectorAll(".grupo-tabela").forEach(container => {
      const nomeGrupo = container.dataset.group;
      const tabela = container.querySelector(".included-group-table");
      const linhas = tabela.querySelectorAll("tbody tr:not(.extra-summary-row):not(.extra-summary-row ~ tr)");

      const itens = Array.from(linhas).map(tr => {
        const precoStr = tr.querySelector("td:nth-child(4) div")?.textContent || "";
        const custoStr = tr.querySelector("td:nth-child(5) div")?.textContent || "";
        const codigoOmie = tr.querySelector("td:nth-child(6) div")?.textContent.trim() || "";

        const quantidadeStr = tr.querySelector("td:nth-child(7)")?.textContent || ""; // sem parse
        const quantidadeDesejadaStr = tr.querySelector("td:nth-child(8) .formula-result")?.textContent || "";

        return {
          nome_produto: tr.querySelector(".editable-descricao")?.textContent.trim() || "",
          preco: precoStr, // salva como texto
          custo: custoStr, // salva como texto
          quantidade: quantidadeStr.trim(), // exatamente como está na tabela
          quantidade_desejada: quantidadeDesejadaStr.trim(),
          descricao_utilizacao: tr.querySelector(".editable-utilizacao")?.textContent.trim() || "",
          codigo_omie: codigoOmie,
          formula_preco: tr.dataset.formulaPreco || "",
          formula_custo: tr.dataset.formulaCusto || "",
          formula_quantidade: tr.querySelector(".formula-input")?.textContent?.trim() || ""
        };
      }).filter(item => item.nome_produto);

      const parametros = { ...window.groupPopupsData?.[nomeGrupo] };
      const popup = document.getElementById(`popup-${nomeGrupo}`);
      if (popup) {
        popup.querySelectorAll("[data-tag]").forEach(input => {
          const chave = input.getAttribute("data-tag");
          if (chave) parametros[chave] = input.value;
        });
      }

      if (itens.length > 0) {
        grupos.push({ nome: nomeGrupo, itens, parametros });
      }
    });

    if (!grupos.length) {
      console.warn("⚠️ Nenhum grupo ou item para salvar.");
      return { erro: "Nenhum produto informado." };
    }

    const numeroProposta = camposFormulario.numeroOrcamento || Date.now().toString();

    const proposta = {
      tipoProposta: "modelo",
      numeroProposta,
      camposFormulario,
      grupos
    };

    const resposta = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/propostas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposta)
    });

    const resultado = await resposta.json();
    console.log("📦 Resposta do servidor:", resultado);
    return resultado;

  } catch (erro) {
    console.error("❌ Erro ao salvar proposta:", erro);
    return { erro: "Erro inesperado ao salvar proposta." };
  }
}


/* ------------------------------------------------------------------
 * Função principal
 * -----------------------------------------------------------------*/
/* ---------------------------------------------------------------
 * Helper  ➜  "R$ 1.234,56"  →  1234.56   (Number)
 * -------------------------------------------------------------*/
function toNumber(v) {
  if (!v) return 0;
  return parseFloat(
    v.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()
  ) || 0;
}

/* ---------------------------------------------------------------
 * Função principal
 * -------------------------------------------------------------*/
async function salvarPropostaModelo() {
  try {
    /* ▸ Clientes ------------------------------------------------ */
    const clientes = Array.from(document.querySelectorAll(".cliente-item")).map(el => ({
      nome_razao_social: el.querySelector(".razaoSocial")?.value || "",
      codigoOmie:       el.querySelector(".codigoCliente")?.value || "",
      cpfCnpj:          el.querySelector(".cpfCnpj")?.value || "",
      funcao:           el.querySelector(".funcaoCliente")?.value || "",
      telefone:         el.querySelector(".telefoneCliente")?.value || ""
    }));

    /* ▸ Condição de pagamento e parcelas ----------------------- */
    const condicaoPagamento = document.getElementById("condicaoPagamento")?.value || "";
    let parcelas = [];
    if (condicaoPagamento === "parcelado") {
      const datas   = document.querySelectorAll(".data-parcela");
      const valores = document.querySelectorAll(".valor-parcela");
      parcelas = Array.from(datas).map((el, i) => ({
        data: el.value,
        valor: toNumber(valores[i]?.value)
      }));
    }

    /* ▸ Campos do formulário ----------------------------------- */
    const camposFormulario = {
      numeroOrcamento:       document.getElementById("numeroOrcamento")?.value || "",
      dataOrcamento:         document.getElementById("dataOrcamento")?.value || "",
      origemCliente:         document.getElementById("origemCliente")?.value || "",
      clientes,
      cep:                   document.getElementById("cep")?.value || "",
      rua:                   document.getElementById("rua")?.value || "",
      numero:                document.getElementById("numero")?.value || "",
      complemento:           document.getElementById("complemento")?.value || "",
      bairro:                document.getElementById("bairro")?.value || "",
      cidade:                document.getElementById("cidade")?.value || "",
      estado:                document.getElementById("estado")?.value || "",
      vendedorResponsavel:   document.getElementById("vendedorResponsavel")?.value || "",
      operadorInterno:       document.getElementById("operadorInterno")?.value || "",
      prazosArea:            document.getElementById("prazosArea")?.value || "",
      condicaoPagamento,
      condicoesGerais:       document.getElementById("condicoesGerais")?.value || "",
      parcelas
    };

    /* ▸ Grupos e itens ----------------------------------------- */
    const grupos = [];

    document.querySelectorAll(".grupo-tabela").forEach(container => {
      const nomeGrupo = container.dataset.group;
      const linhas = container.querySelectorAll(
        "tbody tr:not(.extra-summary-row):not(.extra-summary-row ~ tr)"
      );

      const itens = Array.from(linhas).map(tr => {
        /* Strings brutas vindas da tabela */
        const precoStr   = tr.querySelector("td:nth-child(4) div")?.textContent.trim() || "";
        const custoStr   = tr.querySelector("td:nth-child(5) div")?.textContent.trim() || "";
        const codigoOmie = tr.querySelector("td:nth-child(6) div")?.textContent.trim() || "";

        const qtdStr   = tr.querySelector("td:nth-child(7)")?.textContent.trim() || "";
        const qtdDesStr= tr.querySelector("td:nth-child(8) .formula-result")?.textContent.trim() || "";

        const formulaInput = tr.querySelector("td:nth-child(8) .formula-input");

        return {
          /* ⇩ Precisão nos nomes: iguais ao seu ItemSchema */
          descricao_utilizacao: tr.querySelector(".editable-utilizacao")?.textContent.trim() || "",
          nome_produto:         tr.querySelector(".editable-descricao")?.textContent.trim() || "",
          preco:                toNumber(precoStr),
          custo:                toNumber(custoStr),
          quantidade:           toNumber(qtdStr),
          quantidade_desejada:  toNumber(qtdDesStr),
          formula_preco:        formulaInput?.dataset?.formulaPreco  || "",
          formula_custo:        formulaInput?.dataset?.formulaCusto  || "",
          formula_quantidade:   formulaInput?.textContent.trim() || "",
          codigo_omie:          codigoOmie
          // Se um dia precisar de custo_material_base, basta incluí-lo aqui
        };
      }).filter(item => item.nome_produto);

      /* ▸ Parâmetros adicionais do popup ----------------------- */
      const parametros = { ...(window.groupPopupsData?.[nomeGrupo] || {}) };
      container.querySelectorAll("[data-tag]").forEach(inp => {
        const tag = inp.getAttribute("data-tag");
        if (tag) parametros[tag] = inp.value;
      });

      if (itens.length) grupos.push({ nome: nomeGrupo, itens, parametros });
    });

    if (!grupos.length) {
      console.warn("⚠️ Nenhum produto para salvar.");
      return { erro: "Nenhum produto informado." };
    }

    /* ▸ Objeto final ------------------------------------------- */
    const numeroProposta = camposFormulario.numeroOrcamento || Date.now().toString();
    const proposta = {
      tipoProposta: "modelo",    // mantém como "modelo"
      numeroProposta,
      camposFormulario,
      grupos
    };

    /* ▸ POST ---------------------------------------------------- */
    const resp = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/propostas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposta)
    });

    const resultado = await resp.json();
    console.log("📦 Resposta do servidor:", resultado);
    return resultado;

  } catch (e) {
    console.error("❌ Erro ao salvar proposta:", e);
    return { erro: "Erro inesperado ao salvar proposta." };
  }
}






async function atualizarProposta(propostaAtualizada) {
  if (!propostaAtualizada || !propostaAtualizada._id) {
    console.error("❌ Proposta inválida para atualização.");
    return;
  }

  const id = propostaAtualizada._id;
  const url = `https://ulhoa-0a02024d350a.herokuapp.com/api/propostas/${id}`;

  try {
    const resposta = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(propostaAtualizada)
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.error || "Erro desconhecido ao atualizar.");
    }

    const resultado = await resposta.json();
    console.log("✅ Proposta atualizada com sucesso:", resultado);
    return resultado;

  } catch (err) {
    console.error("❌ Erro ao atualizar proposta:", err.message);
  }
}


