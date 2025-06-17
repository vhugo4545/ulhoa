// 📦 carregarProdutosModelo.js

const searchInput = document.getElementById("searchInput");
const grupoList = document.getElementById("grupoList");
const erroMsg = document.getElementById("erroMsg");
const container = document.getElementById("included-products-container");

// Variáveis globais
window.includedProducts = window.includedProducts || [];
window.groupPopupsData = window.groupPopupsData || {};
window.parametrosPorGrupo = window.parametrosPorGrupo || {};
window.grupoNomeMap = window.grupoNomeMap || {};
window.grupoNomeOriginalMap = window.grupoNomeOriginalMap || {};

let grupos = [];

// 🔄 Carrega proposta modelo do backend
async function carregarPropostaModelo() {
  try {
    const res = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/propostas");
    if (!res.ok) throw new Error("Erro ao buscar propostas");

    const propostas = await res.json();

    // 🔍 Encontra a última proposta do tipo "modelo"
    const ultimaModelo = [...propostas].reverse().find(p => p.tipoProposta === "modelo");

    if (!ultimaModelo || !ultimaModelo.grupos) {
      erroMsg.textContent = "Nenhuma proposta com tipo 'modelo' ou grupos encontrados.";
      console.warn("❌ Nenhuma proposta válida do tipo 'modelo' encontrada.");
      return;
    }

    // ---
  
    // ---
    // Make ultimaModelo accessible globally
    window.ultimaPropostaModelo = ultimaModelo; 
   

 

    grupos = ultimaModelo.grupos;
    renderLista();

  } catch (err) {
    erroMsg.textContent = "Erro ao carregar dados: " + err.message;
    console.error("❌ Erro ao carregar proposta modelo:", err);
  }
}


// 🧹 Formata nome para exibição
function formatarNome(nome) {
  return (nome || "")
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

// 📋 Renderiza lista de grupos
function renderLista(filtro = "") {
  grupoList.innerHTML = "";
  const nomesUnicos = new Set();

  grupos
    .filter(grupo => grupo.nome?.toLowerCase().includes(filtro.toLowerCase()))
    .forEach(grupo => {
      if (!nomesUnicos.has(grupo.nome)) {
        nomesUnicos.add(grupo.nome);

        const li = document.createElement("li");
        li.textContent = formatarNome(grupo.nome);
        li.className = "list-group-item";
        li.style.cursor = "pointer";

        li.addEventListener("click", () => adicionarProdutosDoGrupo(grupo));
        
        grupoList.appendChild(li);
      }
    });
}

// ➕ Adiciona produtos e configura popup
function adicionarProdutosDoGrupo(grupo) {
  if (!grupo || typeof grupo !== "object") return console.error("❌ Grupo inválido:", grupo);

  const nomeVisivel = grupo.nome?.trim() || "Grupo Sem Nome";

  // 🔐 Gerar identificador único interno (não afeta nome visual)
  const idInternoBase = nomeVisivel.replace(/\s+/g, '-').toLowerCase();
  const nomesInternos = includedProducts.map(p => p.grupoInterno || p.class);
  let grupoInterno = idInternoBase;
  let contador = 1;

  while (nomesInternos.includes(grupoInterno)) {
    grupoInterno = `${idInternoBase}-${contador.toString().padStart(4, '0')}`;
    contador++;
  }

  // ⚙️ Mapeamento interno
  grupoNomeMap[nomeVisivel] = grupoInterno;
  grupoNomeOriginalMap[grupoInterno] = nomeVisivel;

  // 💾 Popup
  if (grupo.infoPopup && typeof grupo.infoPopup === "object") {
    groupPopupsData[grupoInterno] = { ...grupo.infoPopup };
    console.log(`📥 Popup carregado para "${grupoInterno}":`, grupo.infoPopup);
  }

  // ➕ Adiciona os produtos
  const produtos = grupo.itens || [];
  if (!produtos.length) return console.warn(`⚠️ Grupo "${nomeVisivel}" não possui produtos.`);

  produtos.forEach((item, i) => {
    includedProducts.push({
      class: grupoInterno,                     // ⚠️ Internamente único
      grupoInterno,                            // 🔐 Identificador interno para lógica
      nomeVisivel,                             // ✅ Mantido para o cliente
      index: includedProducts.length,
      ordem: `${grupoInterno}.${i + 1}`,
      descricao: item.nome_produto || "",
      cost: parseFloat(item.valor_unitario) || 0,
      price: parseFloat(item.valor_unitario) || 0,
      quantity: item.quantidade || 0,
      codigoOmie: item.codigoOmie || "",
      adjustedQuantityFormula: item.adjustedQuantityFormula || "",
      custoFormula: item.valor_unitario?.toString() || "",
      vendaFormula: item.valor_unitario?.toString() || ""
    });
  });

  // 📦 Dados para renderização
  const dadosCompletos = {
    grupoId: grupoInterno,
    nomeOriginal: nomeVisivel,
    nomeVisivel,
    produtos: includedProducts.filter(p => p.class === grupoInterno),
    popup: groupPopupsData?.[grupoInterno] || {},
    parametros: parametrosPorGrupo?.[grupoInterno] || {}
  };

   renderIncludedProducts(dadosCompletos);
}


// 🔁 Evento de filtro
searchInput.addEventListener("input", () => renderLista(searchInput.value));

// 🚀 Carrega ao iniciar
carregarPropostaModelo();
