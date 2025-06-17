// popupvalores.js

function abrirPopupValores(custos) {
  const existingPopup = document.getElementById("popup-valores");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.id = "popup-valores";
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 1px solid #ccc;
    padding: 20px;
    z-index: 10000;
    width: 600px;
    font-family: Arial, sans-serif;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
  `;

  const formatMoney = val => !isNaN(val) ? `R$ ${parseFloat(val).toFixed(2)}` : "-";
  const formatPercent = val => !isNaN(val) ? `${parseFloat(val).toFixed(2)}%` : "-";

  const sanitize = val => {
    if (typeof val === 'string') {
      val = val.replace(/[^0-9,.-]/g, '').replace(',', '.');
    }
    return parseFloat(val);
  };

  const gerarBloco = (titulo, id, valor) => `
    <div id="${id}" style="margin-bottom: 15px;">
      <label style="font-weight: bold;">${titulo}</label>
      <div>${valor}</div>
    </div>
  `;

  const custoTotal = sanitize(custos.custoTotalMaterial);
  const precoSugerido = sanitize(custos.precoSugerido);
  const precoMinimo = sanitize(custos.precoMinimo);

  const lucroReal = precoSugerido - custoTotal;

  const custosCorrigidos = {
    custoTotalMaterial: custoTotal,
    precoSugerido,
    precoMinimo,
    lucroReal,
    custoTotalMaterialPct: precoSugerido ? (custoTotal / precoSugerido * 100) : null,
    precoMinimoPct: precoSugerido ? (precoMinimo / precoSugerido * 100) : null,
    precoSugeridoPct: precoSugerido ? 100 : null,
    lucroRealPct: precoMinimo ? (lucroReal / precoMinimo * 100) : null
  };

  // Calcular a soma dos valores de custo final
  let somaCustoFinal = 0;
  const linhasTabela = document.querySelectorAll('.included-group-table tbody tr');
  linhasTabela.forEach(row => {
    const valorCustoFinal = row.querySelector('.valor-custo-final');
    if (valorCustoFinal) {
      const valorTexto = valorCustoFinal.textContent.trim().replace('R$ ', '').replace(',', '.');
      somaCustoFinal += parseFloat(valorTexto) || 0;
    }
  });

  popup.innerHTML = `
    <h4 style="margin-bottom: 20px;">Valores Calculados</h4>
    <div style="display: flex; gap: 30px; justify-content: space-between;">
      <div style="flex: 1;">
        ${gerarBloco("Custo Total de Material", "custoTotalMaterial", formatMoney(custosCorrigidos.custoTotalMaterial))}
        ${gerarBloco("Preço Mínimo", "precoMinimo", formatMoney(custosCorrigidos.precoMinimo))}
        ${gerarBloco("Preço Sugerido", "precoSugerido", formatMoney(custosCorrigidos.precoSugerido))}
        ${gerarBloco("Lucro Real", "lucroReal", formatMoney(custosCorrigidos.lucroReal))}
        ${gerarBloco("Soma de Valor de Custo Final", "somaCustoFinal", formatMoney(somaCustoFinal))}
      </div>
      <div style="flex: 1;">
        ${gerarBloco("Custo Total (%)", "custoTotalMaterialPct", formatPercent(custosCorrigidos.custoTotalMaterialPct))}
        ${gerarBloco("Preço Mínimo (%)", "precoMinimoPct", formatPercent(custosCorrigidos.precoMinimoPct))}
        ${gerarBloco("Preço Sugerido (%)", "precoSugeridoPct", formatPercent(custosCorrigidos.precoSugeridoPct))}
        ${gerarBloco("Lucro Real (%)", "lucroRealPct", formatPercent(custosCorrigidos.lucroRealPct))}
      </div>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="fecharPopupValores()" class="btn btn-secondary">Fechar</button>
    </div>
  `;

  document.body.appendChild(popup);
}


function fecharPopupValores() {
  const popup = document.getElementById("popup-valores");
  if (popup) popup.remove();
}

