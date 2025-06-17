 

// 📁 API Handlers
const API = {
  async carregar(endpoint) {
    const response = await fetch(`https://ulhoa-0a02024d350a.herokuapp.com/api/${endpoint}`);
    if (!response.ok) throw new Error(`Erro ao buscar ${endpoint}`);
    return await response.json();
  },

  async post(endpoint, body) {
    const response = await fetch(`https://ulhoa-0a02024d350a.herokuapp.com/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw data;
    return data;
  }
};


async function salvarProdutoBase() {
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
      tipoProposta: "editavel",
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
  carregarVendedores();
  carregarClasses();
});



