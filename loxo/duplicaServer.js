
  async function carregarVendedores() {
    try {
      const response = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/vendedores");
      if (!response.ok) throw new Error("Erro ao buscar vendedores");

      const vendedores = await response.json();
      const select = document.getElementById("selectVendedor");

      // Limpar e adicionar a opção inicial
      select.innerHTML = '<option value="">Selecione</option>';

      // Preencher com os vendedores
      vendedores.forEach(vendedor => {
        const option = document.createElement("option");
        option.value = vendedor.nome; // você pode usar vendedor.nome se preferir
        option.textContent = vendedor.nome;
        select.appendChild(option);
      });

    } catch (error) {
      console.error("❌ Erro ao carregar vendedores:", error);
    }
  }

  // Chamar quando a página carregar
  window.addEventListener("DOMContentLoaded", carregarVendedores);


  async function carregarClasses() {
    const dropdownList = document.getElementById("dropdownClassesList");
    const botaoDropdown = document.getElementById("dropdownClassesBtn");

    // Verifica se os elementos existem antes de tentar usar
    if (!dropdownList || !botaoDropdown) {
      console.error("❌ Elementos do dropdown não encontrados no DOM.");
      return;
    }

    try {
      const response = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/classes");

      if (!response.ok) {
        throw new Error("Erro ao buscar classes de produtos");
      }

      const classes = await response.json();

      // Limpar os itens existentes
      dropdownList.innerHTML = "";

      // Criar cada item dinamicamente
      classes.forEach(classe => {
        if (!classe.nome) return; // ignora se não houver nome

        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "dropdown-item";
        a.href = "#";
        a.textContent = classe.nome;

        a.addEventListener("click", function (event) {
          selecionarClasse(event, classe.nome);
        });

        li.appendChild(a);
        dropdownList.appendChild(li);
      });

      if (classes.length === 0) {
        const li = document.createElement("li");
        li.innerHTML = `<span class="dropdown-item disabled">Nenhuma classe cadastrada</span>`;
        dropdownList.appendChild(li);
      }

    } catch (error) {
      console.error("❌ Erro ao carregar classes:", error);
    }
  }

  // Atualiza o botão com o nome da classe selecionada
  function selecionarClasse(event, nomeClasse) {
    event.preventDefault();
    const botao = document.getElementById("dropdownClassesBtn");
    if (botao) {
      botao.textContent = nomeClasse;
    }
    console.log("✅ Classe selecionada:", nomeClasse);
  }

  // Carrega automaticamente após DOM carregado
  window.addEventListener("DOMContentLoaded", carregarClasses);

  async function salvarTudo() {
    const dadosTeste = {
        tipo: "editavel", // ← Define o tipo padrão como "editavel"
        camposFormulario: {},
        grupos: {},
        produtosSelecionados: []
    };

    // 🧾 1. Captura todos os inputs, selects e textareas dentro do formulário #novoOrcamentoForm
    const formulario = document.querySelector("#novoOrcamentoForm");
    if (formulario) {
        formulario.querySelectorAll("input, textarea, select").forEach(el => {
            if (el.id) {
                dadosTeste.camposFormulario[el.id] = el.value;
            }
        });
    }

    // 💾 2. Copia os dados dos popups por grupo (groupPopupsData → grupos)
    if (typeof groupPopupsData === "object") {
        dadosTeste.grupos = JSON.parse(JSON.stringify(groupPopupsData));
    }

    // 📦 3. Percorre todos os produtos renderizados
    document.querySelectorAll(".grupo-tabela").forEach(grupo => {
        const grupoId = grupo.dataset.group;
        const className = grupo.querySelector("strong")?.textContent?.trim() || grupoId;

        const rows = grupo.querySelectorAll("tbody tr:not(.total-row)");
        rows.forEach(row => {
            const index = row.dataset.index;
            const produto = {
                index: parseInt(index),
                grupo: className,
                nome: row.cells[0]?.textContent.trim(),
                preco: parseFloat(row.cells[1]?.textContent.trim()) || 0,
                custo: parseFloat(row.cells[2]?.textContent.trim()) || 0,
                quantidade: parseFloat(row.cells[3]?.textContent.trim()) || 1,
                valor_venda: parseFloat(row.cells[4]?.textContent.trim()) || 0,
                valor_custo: parseFloat(row.cells[5]?.textContent.trim()) || 0,
                formula_preco: row.querySelector('.formula-input[data-type="price"]')?.dataset.rawFormula || "",
                formula_custo: row.querySelector('.formula-input[data-type="cost"]')?.dataset.rawFormula || "",
                formula_quantidade: row.querySelector('.formula-input[data-type="adjustedQuantity"]')?.dataset.rawFormula || ""
            };

            dadosTeste.produtosSelecionados.push(produto);
        });
    });

    console.log("✅ dadosTeste gerado com sucesso:");
    console.log(dadosTeste);

    // 🌐 4. Enviar para a API
    try {
        const response = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/propostas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dadosTeste)
        });

        let resultado = {};
        try {
            resultado = await response.json();
        } catch (e) {
            console.warn("⚠️ A resposta da API não era JSON válido.");
        }

        if (response.ok) {
            alert("✅ Proposta salva com sucesso!");
            console.info("🎉 Proposta salva corretamente no banco de dados.");
            console.info("📦 Resposta da API:", resultado);
        } else {
            console.error("❌ Erro ao salvar proposta (status HTTP):", response.status);
            console.error("📨 Detalhes do erro:", resultado);
            alert("❌ Erro ao salvar proposta. Verifique o console.");
        }
    } catch (erro) {
        console.error("🚫 Erro de rede ao salvar proposta:", erro);
        alert("🚫 Falha na comunicação com o servidor. Verifique sua conexão.");
    }

    return dadosTeste;
}

async function carregarPropostaModelo() {
    try {
        const response = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/propostas?tipo=modelo");
        const propostas = await response.json();

        if (!response.ok || !Array.isArray(propostas) || propostas.length === 0) {
            console.warn("⚠️ Nenhum modelo encontrado.");
            alert("⚠️ Nenhum modelo de proposta foi encontrado.");
            return;
        }

        const modelo = propostas[0];
        console.log("📄 Modelo carregado:", modelo);

        try {
            // 1️⃣ Preenche os campos do formulário
            const campos = modelo.camposFormulario || {};
            for (const [id, valor] of Object.entries(campos)) {
                const el = document.getElementById(id);
                if (el) el.value = valor;
            }

            // 2️⃣ Carrega os dados dos popups
            if (modelo.grupos && typeof modelo.grupos === "object") {
                window.groupPopupsData = JSON.parse(JSON.stringify(modelo.grupos));
            }

            // 3️⃣ Normaliza produtos e adiciona grupo seguro
            if (Array.isArray(modelo.produtosSelecionados)) {
             // Dentro de carregarPropostaModelo()
window.includedProducts = modelo.produtosSelecionados.map(prod => {
    const grupo = typeof prod.grupo === "string" ? prod.grupo.trim() : "Sem Grupo";
    return {
        ...prod,
        name: prod.nome || "Produto sem nome",
        class: grupo, // <- ESSENCIAL PARA renderIncludedProducts()
        grupo: grupo, // ← opcional: manter compatível com o que veio da API
        preco: prod.preco || 0,
        custo: prod.custo || 0,
        quantidade: prod.quantidade || 1,
        price: prod.preco || 0,
        cost: prod.custo || 0,
        quantity: prod.quantidade || 1,
        priceFormula: prod.formula_preco || "",
        costFormula: prod.formula_custo || "",
        adjustedQuantityFormula: prod.formula_quantidade || ""
    };
});


                if (typeof renderIncludedProducts === "function") {
                    renderIncludedProducts(); // agora vai funcionar
                } else {
                    console.warn("⚠️ Função renderIncludedProducts() não encontrada.");
                }
            }

            alert("✅ Modelo carregado com sucesso!");
        } catch (erroInterno) {
            console.error("❌ Erro interno ao processar e renderizar o modelo:", erroInterno);
            alert("❌ Erro ao carregar modelo. Verifique o console.");
        }

    } catch (erro) {
        console.error("❌ Erro ao carregar modelo de proposta (requisição):", erro);
        alert("❌ Erro na requisição. Verifique o console.");
    }
}


let clientesCache = [];

// Buscar clientes uma única vez e armazenar no cache
async function carregarClientes() {
  if (clientesCache.length > 0) return;

  try {
    const res = await fetch(`${baseUrl}/visualizar`);
    if (!res.ok) throw new Error('Erro ao buscar clientes');
    clientesCache = await res.json();
  } catch (error) {
    console.error('❌ Erro ao carregar clientes:', error);
  }
}

async function carregarClientes() {
  if (clientesCache.length > 0) return;

  try {
    const res = await fetch(`${baseUrl}/visualizar`);
    if (!res.ok) throw new Error('Erro ao buscar clientes');
    clientesCache = await res.json();
  } catch (error) {
    console.error('❌ Erro ao carregar clientes:', error);
  }
}

function filtrarClientesPorNome(parteNome) {
  const termo = parteNome.toLowerCase();
  return clientesCache.filter(c => c.nome_fantasia?.toLowerCase().includes(termo));
}

function mostrarSugestoes(sugestoes) {
  const ul = document.getElementById('sugestoes');
  ul.innerHTML = '';

  if (sugestoes.length === 0) {
    ul.style.display = 'none';
    return;
  }

  sugestoes.slice(0, 5).forEach(cliente => {
    const li = document.createElement('li');
    li.textContent = cliente.nome_fantasia;
    li.className = 'list-group-item list-group-item-action';
    li.addEventListener('click', () => {
      preencherCamposCliente(cliente);
      ul.innerHTML = '';
    });
    ul.appendChild(li);
  });

  ul.style.display = 'block';
}

function preencherCamposCliente(cliente) {
  document.getElementById('nome').value = cliente.nome_fantasia || '';
  document.getElementById('cpfCnpj').value = cliente.cnpj_cpf || '';
  document.getElementById('endereco').value = cliente.endereco || '';
  document.getElementById('numeroComplemento').value = [cliente.endereco_numero, cliente.complemento].filter(Boolean).join(' ') || '';
  document.getElementById('enderecoEntrega').value = cliente.endereco || '';
  document.getElementById('idClienteOmie').value = cliente.codigo_cliente_omie || '';
}

function limparCamposCliente() {
  document.getElementById('cpfCnpj').value = '';
  document.getElementById('endereco').value = '';
  document.getElementById('numeroComplemento').value = '';
  document.getElementById('enderecoEntrega').value = '';
  document.getElementById('idClienteOmie').value = '';
}

document.getElementById('nome').addEventListener('input', async function () {
  const valor = this.value.trim();

  if (valor.length < 3) {
    document.getElementById('sugestoes').innerHTML = '';
    limparCamposCliente();
    return;
  }

  await carregarClientes();
  const resultados = filtrarClientesPorNome(valor);
  mostrarSugestoes(resultados);

  // Verifica se existe algum cliente com o nome EXATO
  const nomeExato = clientesCache.find(c => c.nome_fantasia?.toLowerCase() === valor.toLowerCase());
  if (!nomeExato) {
    limparCamposCliente();
  }
});

document.addEventListener('click', function (e) {
  if (!document.getElementById('sugestoes').contains(e.target)) {
    document.getElementById('sugestoes').innerHTML = '';
  }
});



let arquitetosCache = [];

async function carregarArquitetos() {
if (arquitetosCache.length > 0) return;

try {
  const res = await fetch(`${baseUrl}/visualizar`);
  if (!res.ok) throw new Error('Erro ao buscar arquitetos');
  arquitetosCache = await res.json();
} catch (error) {
  console.error('❌ Erro ao carregar arquitetos:', error);
}
}

function filtrarArquitetosPorNome(parteNome) {
const termo = parteNome.toLowerCase();
return arquitetosCache.filter(a => a.nome?.toLowerCase().includes(termo));
}

function mostrarSugestoesArquitetos(sugestoes) {
const ul = document.getElementById('sugestoes-arquiteto');
ul.innerHTML = '';

if (sugestoes.length === 0) {
  ul.style.display = 'none';
  return;
}

sugestoes.slice(0, 5).forEach(arquiteto => {
  const li = document.createElement('li');
  li.textContent = arquiteto.nome;
  li.className = 'list-group-item list-group-item-action';
  li.addEventListener('click', () => {
    preencherCamposArquiteto(arquiteto);
    ul.innerHTML = '';
  });
  ul.appendChild(li);
});

ul.style.display = 'block';
}

function preencherCamposArquiteto(arquiteto) {
document.getElementById('arquiteto').value = arquiteto.nome || '';
document.getElementById('codigo_arqeuiteto').value = arquiteto.codigo || '';
}

function limparCamposArquiteto() {
document.getElementById('codigo_arqeuiteto').value = '';
}

document.getElementById('arquiteto').addEventListener('input', async function () {
const valor = this.value.trim();

if (valor.length < 2) {
  document.getElementById('sugestoes-arquiteto').innerHTML = '';
  limparCamposArquiteto();
  return;
}

await carregarArquitetos();
const resultados = filtrarArquitetosPorNome(valor);
mostrarSugestoesArquitetos(resultados);

const nomeExato = arquitetosCache.find(a => a.nome?.toLowerCase() === valor.toLowerCase());
if (!nomeExato) {
  limparCamposArquiteto();
}
});

document.addEventListener('click', function (e) {
if (!document.getElementById('sugestoes-arquiteto').contains(e.target) &&
    e.target.id !== 'arquiteto') {
  document.getElementById('sugestoes-arquiteto').innerHTML = '';
}
});


