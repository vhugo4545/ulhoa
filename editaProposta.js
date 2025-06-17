

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

function formatarNomeGrupo(nomeTecnico) {
  return (nomeTecnico || "")
    .replace(/^grupo-/, "")                   // remove prefixo "grupo-"
    .replace(/[-_]+/g, " ")                   // substitui 1 ou + hífens/underscores por espaço
    .replace(/\s+/g, " ")                     // normaliza espaços
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());  // capitaliza primeiras letras
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
  
});

// ⏱ Função utilitária fora do escopo da principal
function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

// 🎯 Função principal
async function lancarContaPagar(tipo) {
  try {
    let valorComissao, dataComissao, codigoFornecedor, codigoCategoria;

    if (tipo === "arquiteto") {
      valorComissao = parseFloat(document.getElementById("valorComissaoArquiteto")?.value || "0");
      dataComissao = document.getElementById("dataComissaoArquiteto")?.value || "";
      codigoFornecedor = document.getElementById("codigo_arqeuiteto")?.value || "";
      codigoCategoria = "2.08.02";
    } else if (tipo === "vendedor") {
      valorComissao = parseFloat(document.getElementById("valorComissaoVendedor")?.value || "0");
      dataComissao = document.getElementById("dataComissaoVendedor")?.value || "";
      codigoFornecedor = document.getElementById("selectVendedor")?.value || "";
      codigoCategoria = "2.07.99";
    } else {
      alert("Tipo inválido. Use 'arquiteto' ou 'vendedor'.");
      return;
    }

    if (!valorComissao || !dataComissao || !codigoFornecedor) {
      alert(`Preencha corretamente os dados do ${tipo}.`);
      return;
    }

    const payload = {
      codigo_lancamento_integracao: `${tipo}-${Date.now()}`,
      codigo_cliente_fornecedor: parseInt(codigoFornecedor),
      data_vencimento: formatarData(dataComissao),
      valor_documento: valorComissao,
      codigo_categoria: codigoCategoria,
      data_previsao: formatarData(dataComissao),
      id_conta_corrente: 2490089205
    };

    const resposta = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/contas_pagar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      console.error(`❌ Erro ao lançar conta do ${tipo}:`, resultado);
      alert(`Erro ao lançar conta de ${tipo}.`);
      return;
    }

    console.log(`✅ Comissão de ${tipo} lançada:`, resultado);
    alert(`✅ Comissão do ${tipo} lançada com sucesso!`);
  } catch (err) {
    console.error(`❌ Erro de conexão ao lançar ${tipo}:`, err);
    alert("Erro ao conectar com o servidor.");
  }
}

// 🎯 Eventos para os botões sem recarregar a página
document.getElementById("btnLancarContaPagarArquiteto")?.addEventListener("click", (e) => {
  e.preventDefault();
  lancarContaPagar("arquiteto");
});

document.getElementById("btnLancarContaPagarVendedor")?.addEventListener("click", (e) => {
  e.preventDefault();
  lancarContaPagar("vendedor");
});