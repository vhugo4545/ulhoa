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

// 📎 Vendedores
async function carregarVendedores() {
  try {
    const vendedores = await API.carregar("vendedores");
    const select = document.getElementById("selectVendedor");

    if (!select) {
      console.warn("⚠️ Elemento #selectVendedor não encontrado no DOM.");
      return;
    }

    select.innerHTML = '<option value="">Selecione</option>';

    vendedores.forEach(v => {
      const opt = new Option(v.nome, v._id);
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("❌ Erro ao carregar vendedores:", err);
  }
}

// 📎 Classes
async function carregarClasses() {
  const dropdownList = document.getElementById("dropdownClassesList");
  const botaoDropdown = document.getElementById("dropdownClassesBtn");
  if (!dropdownList || !botaoDropdown) return;

  try {
    const classes = await API.carregar("classes");
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


async function salvarProdutoBase() {
  try {
    const grupos = [];

    document.querySelectorAll(".grupo-tabela").forEach(grupoEl => {
      const grupoId = grupoEl.dataset.group || "grupo-sem-nome";
      const nomeGrupo = grupoId.replace("grupo-", "") || "Sem nome";

      const itens = [];
      grupoEl.querySelectorAll("tbody tr.draggable").forEach(row => {
        const index = row.dataset.index;
        const nomeProduto = row.children[0]?.textContent.trim() || "";
        const valorCusto = row.children[1]?.innerText.trim().replace("R$", "").replace(",", ".") || "0";
        const valorVenda = row.children[2]?.innerText.trim().replace("R$", "").replace(",", ".") || "0";
        const quantidade = row.children[3]?.innerText.trim().replace(",", ".") || "1";

        const formulaPreco = row.querySelector(`.formula-input[data-type="priceFormula"]`)?.dataset.rawFormula || "";
        const codigoProduto = includedProducts[index]?.codigo_produto || ""; // 👈 novo campo
        const formulaQtd = row.querySelector(`.formula-input[data-type="adjustedQuantityFormula"]`)?.dataset.rawFormula || "";

        itens.push({
          nome_produto: nomeProduto,
          preco: valorVenda,
          custo: valorCusto,
          quantidade,
          valor_venda: valorVenda,
          valor_custo: valorCusto,
          formula_preco: formulaPreco,
          formula_custo: codigoProduto, // 👈 agora salva o código aqui
          formula_quantidade: formulaQtd,
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

    const nomeProposta = grupos[0]?.itens?.[0]?.nome_produto || "Sem nome";

    const proposta = {
      nome: nomeProposta,
      tipoProposta: "modelo",
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



window.addEventListener("DOMContentLoaded", () => {
  carregarVendedores();
  carregarClasses();
});



