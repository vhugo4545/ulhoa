// grupos.js

/**
 * Atualiza a lista de grupos com base nos produtos incluídos e cria checkboxes para filtragem.
 * Permite exibir/esconder os grupos na interface.
 */

function atualizarListaDeGrupos() {
  const container = document.getElementById("grupo-checkboxes");
  if (!container || !window.includedProducts) return;

  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(2, 1fr)";
  container.style.gap = "10px";

  const gruposAtuais = [...new Set(includedProducts.map(p => p.class))];

  // ✅ Mapeia grupos já presentes na lista (evita recriar)
  const gruposJaListados = new Set(
    Array.from(container.querySelectorAll("input[data-grupo]"))
         .map(input => input.dataset.grupo)
  );

  let novosGruposAdicionados = 0;

  gruposAtuais.forEach(grupo => {
    if (gruposJaListados.has(grupo)) return; // já existe

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.grupo = grupo;
    checkbox.className = "form-check-input";
    checkbox.addEventListener("change", filtrarGrupos);

    const label = document.createElement("label");
    label.textContent = grupo;
    label.className = "form-check-label ms-2";

    const wrapper = document.createElement("div");
    wrapper.className = "form-check d-flex align-items-center";
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    container.appendChild(wrapper);
    novosGruposAdicionados++;
  });

  console.log(`%c✅ Lista de grupos atualizada: ${novosGruposAdicionados} novo(s) grupo(s) incluído(s).`, "color: green; font-weight: bold;");
}


function filtrarGrupos() {
  const checkboxes = document.querySelectorAll("#grupo-checkboxes input[type='checkbox']");

  checkboxes.forEach(cb => {
    const grupo = cb.dataset.grupo;
    const wrapper = document.querySelector(`[data-group='grupo-${grupo}']`);
    if (wrapper) {
      wrapper.style.display = cb.checked ? "block" : "none";
    }
  });

  console.log("🔁 Grupos filtrados conforme checkboxes marcados.");
}

// Inicializa após renderização de produtos (precisa ser chamada manualmente)
// Exemplo: chamar atualizarListaDeGrupos() após renderIncludedProducts();
