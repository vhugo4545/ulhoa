// formularioOrcamento.js

  document.getElementById("condicaoPagamento").addEventListener("change", function () {
    const container = document.getElementById("parcelamentoContainer");
    if (this.value === "parcelado") {
      container.style.display = "block";
    } else {
      container.style.display = "none";
      document.getElementById("listaParcelas").innerHTML = "";
    }
  });

  // Adicionar nova parcela
  function adicionarParcela() {
    const lista = document.getElementById("listaParcelas");

    const div = document.createElement("div");
    div.className = "row g-2 align-items-end mb-2";

    div.innerHTML = `
      <div class="col-md-5">
        <label class="form-label">Data</label>
        <input type="date" class="form-control data-parcela" />
      </div>
      <div class="col-md-5">
        <label class="form-label">Valor</label>
        <input type="text" class="form-control valor-parcela" placeholder="R$ 0,00" />
      </div>
      <div class="col-md-2">
        <button type="button" class="btn btn-outline-danger w-100" onclick="this.closest('.row').remove()">Remover</button>
      </div>
    `;

    lista.appendChild(div);
  }

function obterDadosFormularioOrcamento() {
  const getValue = (id) => document.getElementById(id)?.value || "-";

  const dados = {
    numero: getValue("numeroOrcamento"),
    data: getValue("dataOrcamento"),
    origem: getValue("origemCliente"),
    nomeOrigem: getValue("nomeOrigem"),
    codigoOrigem: getValue("codigoOrigem"),
    telefoneOrigem: getValue("telefoneOrigem"),
    emailOrigem: getValue("emailOrigem"),
    comissao: getValue("comissaoArquiteto"),
    condicao: getValue("condicaoPagamento"),
    prazos: getValue("prazosArea"),
    condicoesGerais: getValue("condicoesGerais"),
    operador: getValue("operadorInterno"),
    vendedor: document.getElementById("vendedorResponsavel")?.selectedOptions[0]?.textContent || "-"
  };

  const clienteWrapper = document.querySelector(".cliente-item");
  dados.nomeCliente = clienteWrapper?.querySelector(".razaoSocial")?.value || "-";
  dados.cpfCnpj = clienteWrapper?.querySelector(".cpfCnpj")?.value || "-";
  dados.telefoneCliente = clienteWrapper?.querySelector(".telefone")?.value || "-";
  dados.emailCliente = clienteWrapper?.querySelector(".email")?.value || "-";

  const endereco = {
    cep: getValue("cep"),
    rua: getValue("rua"),
    numero: getValue("numeroEndereco"),
    bairro: getValue("bairro"),
    cidade: getValue("cidade"),
    estado: getValue("estado")
  };

  dados.enderecoObra = endereco;

  console.log("%c📄 Dados do formulário de orçamento:", "color: navy; font-weight: bold");

  return dados;
}

// Atribui ao botão de salvar se existir
window.addEventListener("DOMContentLoaded", () => {
  const btnSalvar = document.getElementById("save-proposal");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", () => {
      obterDadosFormularioOrcamento();
    });
    console.log("%c✅ Evento de salvar proposta ativado.", "color: green");
  } else {
    console.warn("⚠️ Botão 'save-proposal' não encontrado.");
  }
});

