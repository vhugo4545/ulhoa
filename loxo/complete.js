async function carregarPropostaPelaURL() {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
        alert("❌ ID da proposta não informado na URL.");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/propostas/${id}`);
        if (!res.ok) throw new Error("Proposta não encontrada.");

        const proposta = await res.json();
        const campos = proposta.camposFormulario || {};
        const produtos = proposta.produtosSelecionados || [];

        // 🧾 Preenche os campos do formulário
        Object.keys(campos).forEach(idCampo => {
            const el = document.getElementById(idCampo);
            if (el) el.value = campos[idCampo];
        });

        // ♻️ Preenche produtos no sistema
        window.includedProducts = produtos.map((p, i) => ({
            name: p.nome,
            price: p.preco,
            cost: p.custo,
            quantity: p.quantidade,
            adjustedQuantity: p.quantidade, // <-- adicione esta linha
            class: p.grupo,
            priceFormula: p.formula_preco || "",
            costFormula: p.formula_custo || "",
            adjustedQuantityFormula: p.formula_quantidade || ""
        }));
        

        renderIncludedProducts();
console.log("Passou por aqui")
        console.log("✅ Proposta carregada com sucesso:", proposta);
    } catch (err) {
        console.error("❌ Erro ao carregar proposta:", err);
        alert("Erro ao carregar proposta. Verifique o console.");
    }
}

carregarPropostaPelaURL()