// carregarClasses.js

/**
 * Gera o dropdown de produtos baseado nos inputs já presentes na tela (grupo renderizado).
 * Este script deve ser incluído após o carregamento do DOM.
 */

/**
 * Gera o dropdown de produtos baseado nos campos já renderizados na tela.
 */
function listarProdutosEmDropdown() {
  const dropdownList = document.getElementById("dropdownClassesList");
  const dropdownBtn = document.getElementById("dropdownClassesBtn");

  if (!dropdownBtn || !dropdownList) {
    console.warn("⚠️ Elementos do dropdown não encontrados na página.");
    return;
  }

  dropdownList.innerHTML = "";

  // 🔎 Seleciona todas as tabelas renderizadas
  const grupos = document.querySelectorAll('#included-products-container .grupo-tabela');

  if (grupos.length === 0) {
    dropdownList.innerHTML = `<li><span class="dropdown-item disabled">Nenhum grupo encontrado</span></li>`;
    console.warn("⚠️ Nenhum grupo renderizado.");
    return;
  }

  grupos.forEach(grupoDiv => {
    const groupId = grupoDiv.dataset.group; // ex: "guarda-corpo---montante-h"
    const inputNomeGrupo = grupoDiv.querySelector('input.form-control[disabled]');
    const nomeVisivel = inputNomeGrupo?.value?.trim() || groupId;

    if (!groupId || !nomeVisivel) return;

    const li = document.createElement("li");
    const a = document.createElement("a");

    a.className = "dropdown-item";
    a.href = "#";
    a.textContent = nomeVisivel;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      dropdownBtn.textContent = nomeVisivel;
      dropdownBtn.setAttribute("data-group-id", groupId); // 🔗 Armazena o ID real do grupo
    });

    li.appendChild(a);
    dropdownList.appendChild(li);
  });

  console.log("%c✅ Dropdown carregado com os grupos visíveis e data-group-id aplicado.", "color: green; font-weight: bold;");
}





// Atualiza o dropdown após renderização dos grupos
if (typeof renderIncludedProducts === "function") {
  const originalRender = renderIncludedProducts;
  window.renderIncludedProducts = function (...args) {
    originalRender(...args);
    listarProdutosEmDropdown();
  };
}

