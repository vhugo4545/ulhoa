function preencherFormularioComProposta(proposta) {
  if (!proposta || typeof proposta !== "object") {
    console.error("❌ Proposta inválida:", proposta);
    return;
  }

  const campos = proposta.camposFormulario || {};
  console.log("📋 Preenchendo formulário com os campos:", campos);

  try {
    document.getElementById("numeroOrcamento").value = campos.numeroOrcamento || proposta.numeroProposta || "";
    document.getElementById("dataOrcamento").value = campos.dataOrcamento || "";
    document.getElementById("origemCliente").value = campos.origemCliente || "";
    document.getElementById("cep").value = campos.cep || "";
    document.getElementById("rua").value = campos.rua || "";
    document.getElementById("numero").value = campos.numero || "";
    document.getElementById("complemento").value = campos.complemento || "";
    document.getElementById("bairro").value = campos.bairro || "";
    document.getElementById("cidade").value = campos.cidade || "";
    document.getElementById("estado").value = campos.estado || "";
    document.getElementById("operadorInterno").value = campos.operadorInterno || "";
    document.getElementById("prazosArea").value = campos.prazosArea || "";
    document.getElementById("condicaoPagamento").value = campos.condicaoPagamento || "";
    document.getElementById("condicoesGerais").value = campos.condicoesGerais || "";
  } catch (err) {
    console.error("❌ Erro ao preencher campos principais:", err);
  }

  // Selecionar vendedor com pequeno delay
  setTimeout(() => {
    const vendedorSelect = document.getElementById("vendedorResponsavel");
    const valorVendedor = campos.vendedorResponsavel || "";
    if (vendedorSelect) {
      const opcoes = [...vendedorSelect.options].map(o => o.value);
      if (opcoes.includes(valorVendedor)) {
        vendedorSelect.value = valorVendedor;
        console.log("✅ Vendedor selecionado:", valorVendedor);
      } else {
        console.warn("⚠️ Vendedor não encontrado na lista:", valorVendedor);
      }
    }
  }, 500);

  // Clientes
  try {
    const wrapper = document.getElementById("clientesWrapper");
    wrapper.innerHTML = "";
    const clientes = campos.clientes || [];

    console.log(`👥 Inserindo ${clientes.length} cliente(s)`);

    clientes.forEach((cliente, i) => {
      const div = document.createElement("div");
      div.classList.add("row", "g-3", "cliente-item");
      div.innerHTML = `
        <div class="col-md-6 position-relative">
          <label class="form-label">Nome / Razão Social</label>
          <input type="text" class="form-control razaoSocial" value="${cliente.nome_razao_social || ""}" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Código Omie</label>
          <input type="text" class="form-control codigoCliente" value="${cliente.codigoOmie || ""}" readonly />
        </div>
        <div class="col-md-6">
          <label class="form-label">CPF / CNPJ</label>
          <input type="text" class="form-control cpfCnpj" value="${cliente.cpfCnpj || ""}" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Função</label>
          <input type="text" class="form-control funcaoCliente" value="${cliente.funcao || ""}" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Telefone</label>
          <input type="text" class="form-control telefoneCliente" value="${cliente.telefone || ""}" />
        </div>
      `;
      wrapper.appendChild(div);
    });
   } catch (err) {
    console.error("❌ Erro ao preencher clientes:", err);
  }

  // ⏳ Reaplica autocomplete após preencher os campos dos clientes
  setTimeout(() => {
    document.querySelectorAll(".cliente-item").forEach(cliente => {
      aplicarAutocompleteCliente(cliente);
    });
    console.log("✅ Autocomplete reaplicado após preenchimento.");
  }, 100);

  // Parcelas
  try {
    const parcelas = campos.parcelas || [];
    if (parcelas.length && document.getElementById("condicaoPagamento")?.value === "parcelado") {
      const container = document.getElementById("parcelamentoContainer");
      const lista = document.getElementById("listaParcelas");
      lista.innerHTML = "";

      parcelas.forEach(parcela => {
        const div = document.createElement("div");
        div.className = "row g-2 align-items-end mb-2";
        div.innerHTML = `
          <div class="col-md-5">
            <label class="form-label">Data</label>
            <input type="date" class="form-control data-parcela" value="${parcela.data || ""}" />
          </div>
          <div class="col-md-5">
            <label class="form-label">Valor</label>
            <input type="text" class="form-control valor-parcela" value="${parcela.valor || ""}" />
          </div>
          <div class="col-md-2">
            <button type="button" class="btn btn-outline-danger w-100" onclick="this.closest('.row').remove()">Remover</button>
          </div>
        `;
        lista.appendChild(div);
      });

      container.style.display = "block";
    }
  } catch (err) {
    console.error("❌ Erro ao preencher parcelas:", err);
  }

  // Produtos e parâmetros técnicos
  try {
    if (Array.isArray(proposta.grupos)) {
      console.log("📦 Preenchendo produtos agrupados...");
      includedProducts = [];
      window.groupPopupsData = {};

      proposta.grupos.forEach((grupo, gIndex) => {
        const nomeGrupo = grupo.nome || `Grupo-${gIndex + 1}`;

        (grupo.itens || []).forEach((item, i) => {
          includedProducts.push({
            class: nomeGrupo,
            descricao: item.nome_produto || "",
            price: item.preco || 0,
            cost: item.custo || 0,
            quantity: item.quantidade || 0,
            quantidade_desejada: item.quantidade_desejada || 0,
            adjustedQuantityFormula: item.formula_quantidade || "",
            vendaFormula: item.formula_preco || "",
            custoFormula: item.formula_custo || "",
            codigo_omie: item.codigo_omie || "",
            descricao_utilizacao: item.descricao_utilizacao || "",
            index: includedProducts.length,
            ordem: `${nomeGrupo}.${i + 1}`
          });
        });

        if (grupo.parametros || typeof grupo.parametros === "object") {
          window.groupPopupsData[nomeGrupo] = { ...grupo.parametros };
        }
      });

      console.log("✅ Produtos carregados:", includedProducts.length);

      if (typeof renderIncludedProducts === "function") {
        renderIncludedProducts();
      }

      // ⏳ Após renderização, preencher campos [data-tag] diretamente nos popups
      setTimeout(() => {
        proposta.grupos.forEach(grupo => {
          const nomeGrupo = grupo.nome;
          const parametros = grupo.parametros || {};
          const popup = document.querySelector(`.popup-info[data-group-id="${nomeGrupo}"]`);
          if (popup) {
            Object.entries(parametros).forEach(([key, val]) => {
              const input = popup.querySelector(`[data-tag="${key}"]`);
              if (input) input.value = val;
            });
            console.log(`✅ Popup preenchido: ${nomeGrupo}`);
          }
        });
      }, 500);
    } else {
      console.warn("⚠️ Nenhum grupo de produtos encontrado.");
    }
  } catch (err) {
    console.error("❌ Erro ao preencher produtos agrupados:", err);
  }
}



function carregarPropostaPeloIdDaURL() {
  const params = new URLSearchParams(window.location.search);
  const idProposta = params.get("id");

  if (!idProposta) {
    console.warn("⚠️ Nenhum ID informado na URL.");
    return;
  }

  console.log("🔎 Buscando proposta pelo ID:", idProposta);

  fetch(`https://ulhoa-0a02024d350a.herokuapp.com/api/propostas/${idProposta}`)
    .then(res => {
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      return res.json();
    })
    .then(proposta => {
      if (!proposta || typeof proposta !== "object") {
        console.error("❌ Proposta não encontrada.");
        return;
      }

      console.log("✅ Proposta carregada:", proposta);
      preencherFormularioComProposta(proposta);
    })
    .catch(err => {
      console.error("❌ Erro ao buscar proposta:", err);
    });
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("📂 DOM carregado. Iniciando busca...");
  carregarPropostaPeloIdDaURL();
});
