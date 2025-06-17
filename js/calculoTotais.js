// calculoTotais.js

function calcularSomaTotal() {
  const total = includedProducts.reduce((acc, produto) => {
    const vendaUnit = evaluateFormula(produto.vendaFormula, produto.class);
    const qtd = produto.quantity || 0;
    return acc + vendaUnit * qtd;
  }, 0);

  const totalEl = document.getElementById("soma-total");
  if (totalEl) {
    totalEl.textContent = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
  }

  console.log(`%c📊 Total atualizado: R$ ${total.toFixed(2)}`, "color: teal");
}
