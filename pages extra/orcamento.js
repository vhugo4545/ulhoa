document.addEventListener("DOMContentLoaded", () => {
    const productSearch = document.getElementById("product-search");
    const classFilter = document.getElementById("class-filter");
    const searchResultsTable = document.getElementById("search-results").querySelector("tbody");
    const includedProductsTable = document.getElementById("included-products").querySelector("tbody");

    let products = [
        { name: "Produto A", price: 100.00, cost: 80.00, description: "Smartphone 128GB com câmera dupla" },
        { name: "Produto B", price: 150.00, cost: 120.00, description: "Fone de ouvido Bluetooth com cancelamento de ruído" },
        { name: "Produto C", price: 200.00, cost: 160.00, description: "Mesa de escritório ajustável em altura" },
        { name: "Produto D", price: 250.00, cost: 200.00, description: "Cadeira ergonômica com apoio lombar" },
        { name: "Produto E", price: 300.00, cost: 250.00, description: "Geladeira Frost Free 300L" }
    ];

    let includedProducts = [];

    function filterProducts() {
        const query = productSearch.value.toLowerCase();
        searchResultsTable.innerHTML = "";

        const filteredProducts = products.filter(product => {
            return query.length < 3 || product.name.toLowerCase().includes(query);
        });

        filteredProducts.forEach(product => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${product.name}</td>
                <td>R$ ${product.price.toFixed(2)}</td>
                <td>R$ ${product.cost.toFixed(2)}</td>
                <td><span class="detail-icon material-icons-outlined" title="Ver detalhes">help_outline</span></td>
                <td><button class="add-product">Adicionar</button></td>
            `;
            searchResultsTable.appendChild(row);

            row.querySelector(".add-product").addEventListener("click", () => {
                addProduct(product);
            });

            row.querySelector(".detail-icon").addEventListener("click", () => {
                alert(`Descrição: ${product.description}`);
            });
        });
    }

    function addProduct(product) {
        const selectedClass = "Ficha Técnica";

       

        includedProducts.push({ ...product, class: selectedClass });
        console.log(product)
        renderIncludedProducts();
        calcularSomaTotal(product)
    }

    function removeProduct(index) {
        includedProducts.splice(index, 1);
        renderIncludedProducts();
    }

    function renderIncludedProducts() {
        includedProductsTable.innerHTML = "";
    
        let groupedProducts = {};
        includedProducts.forEach((product, index) => {
            if (!product.class) return;
    
            if (!groupedProducts[product.class]) {
                groupedProducts[product.class] = [];
            }
            groupedProducts[product.class].push({ ...product, index });
        });
    
        Object.keys(groupedProducts).forEach(className => {
            // Linha separadora do grupo (colocada no topo)
            const separatorRow = document.createElement("tr");
            separatorRow.classList.add("class-separator");
            separatorRow.innerHTML = `<td colspan="7"><strong>${className}</strong></td>`;
            includedProductsTable.appendChild(separatorRow);
    
            groupedProducts[className].forEach((product) => {
                const row = document.createElement("tr");
                row.setAttribute("draggable", "true");
                row.classList.add("draggable");
                row.dataset.index = product.index;
                row.dataset.class = product.class;
    
                // Obtém valores com padrão caso não existam
                let quantity = product.quantityPerMeter || 1;
                let cost = product.cost || 0;
    
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>R$ ${product.price.toFixed(2)}</td>
                    <td class="editable" data-field="cost" data-index="${product.index}">R$ ${cost.toFixed(2)}</td>
                    <td class="editable" data-field="quantity" data-index="${product.index}">${quantity}</td>
                    <td>R$ ${(product.price * quantity).toFixed(2)}</td>
                    <td>R$ ${(cost * quantity).toFixed(2)}</td>
                    <td><button class="remove-product" data-index="${product.index}">Remover</button></td>
                `;
                includedProductsTable.appendChild(row);
    
                // Evento para remover produto
                row.querySelector(".remove-product").addEventListener("click", () => {
                    removeProduct(product.index);
                });
    
                // Evento para editar custo e quantidade diretamente na célula
                row.querySelectorAll(".editable").forEach(cell => {
                    cell.addEventListener("click", function () {
                        let currentValue = this.innerText.replace("R$", "").trim();
                        let input = document.createElement("input");
                        input.type = "text";
                        input.value = currentValue;
                        input.style.width = "50px";
                        input.style.textAlign = "center";
    
                        this.innerHTML = "";
                        this.appendChild(input);
                        input.focus();
    
                        input.addEventListener("blur", function () {
                            saveEdit(cell, input.value);
                        });
    
                        input.addEventListener("keydown", function (event) {
                            if (event.key === "Enter") {
                                saveEdit(cell, input.value);
                            }
                        });
                    });
                });
    
                addDragAndDrop(row, className);
            });
    
            // Cálculo do total considerando a quantidade fracionada
            let totalPrice = groupedProducts[className].reduce((sum, p) => sum + (p.price * (p.quantityPerMeter || 1)), 0);
            let totalCost = groupedProducts[className].reduce((sum, p) => sum + (p.cost * (p.quantityPerMeter || 1)), 0);
    
            // Linha de totalização
            const totalRow = document.createElement("tr");
            totalRow.classList.add("total-row");
            totalRow.innerHTML = `
                <td><strong>Total (${className})</strong></td>
                <td></td>
                <td></td>
                <td></td>
                <td><strong>R$ ${totalPrice.toFixed(2)}</strong></td>
                <td><strong>R$ ${totalCost.toFixed(2)}</strong></td>
                <td></td>
            `;
            includedProductsTable.appendChild(totalRow);
        });
    }
    
    // Função para salvar edição do custo ou quantidade
    function saveEdit(cell, newValue) {
        let field = cell.dataset.field;
        let index = cell.dataset.index;
        let parsedValue = parseFloat(newValue.replace(",", "."));
    
        if (isNaN(parsedValue) || parsedValue <= 0) {
            parsedValue = 0.01; // Valor mínimo permitido
        }
    
        if (field === "cost") {
            includedProducts[index].cost = parsedValue;
            cell.innerHTML = `R$ ${parsedValue.toFixed(2)}`;
        } else if (field === "quantity") {
            includedProducts[index].quantityPerMeter = parsedValue;
            cell.innerHTML = parsedValue;
        }
    
        renderIncludedProducts();
    }
    
    
    

    function addDragAndDrop(row, className) {
        row.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("index", row.dataset.index);
            event.dataTransfer.setData("class", className);
        });

        row.addEventListener("dragover", (event) => {
            event.preventDefault();
            const draggedClass = event.dataTransfer.getData("class");
            if (draggedClass !== className) {
                return;
            }
        });

        row.addEventListener("drop", (event) => {
            event.preventDefault();
            const fromIndex = parseInt(event.dataTransfer.getData("index"));
            const fromClass = event.dataTransfer.getData("class");

            const toRow = event.target.closest("tr");
            if (!toRow || !toRow.dataset.index) return;

            const toIndex = parseInt(toRow.dataset.index);
            const toClass = toRow.dataset.class;

            if (fromClass !== toClass) {
                return;
            }

            const fromProduct = includedProducts.find(p => p.index == fromIndex);
            const toProductIndex = includedProducts.findIndex(p => p.index == toIndex);

            if (fromProduct && toProductIndex >= 0 && fromProduct.index !== toIndex) {
                includedProducts = includedProducts.filter(p => p.index !== fromIndex);
                includedProducts.splice(toProductIndex, 0, fromProduct);
                renderIncludedProducts();
            }
        });
    }

    productSearch.addEventListener("input", filterProducts);
    classFilter.addEventListener("change", filterProducts);
});



function formatarNumero(valor) {
    // Remove "R$" e espaços extras
    valor = valor.replace("R$", "").trim();

    // Substitui vírgula por ponto
    valor = valor.replace(",", ".");

    // Remove todos os pontos, exceto o último (para garantir as casas decimais corretas)
    let partes = valor.split(".");
    if (partes.length > 2) {
        let parteInteira = partes.slice(0, -1).join(""); // Junta tudo antes do último ponto
        let parteDecimal = partes[partes.length - 1]; // Mantém apenas o último grupo decimal
        valor = parteInteira + "." + parteDecimal;
    }

    return parseFloat(valor) || 0; // Retorna como número ou 0 se for inválido
}

function formatarNumero(valor) {
    valor = valor.replace("R$", "").trim(); // Remove "R$" e espaços extras
    valor = valor.replace(",", "."); // Substitui vírgula por ponto

    let partes = valor.split(".");
    if (partes.length > 2) {
        let parteInteira = partes.slice(0, -1).join(""); // Junta tudo antes do último ponto
        let parteDecimal = partes[partes.length - 1]; // Mantém apenas o último grupo decimal
        valor = parteInteira + "." + parteDecimal;
    }

    return parseFloat(valor) || 0; // Retorna número ou 0 se inválido
}

function formatarNumero(valor) {
    valor = valor.replace("R$", "").trim(); // Remove "R$" e espaços extras
    valor = valor.replace(",", "."); // Substitui vírgula por ponto

    let partes = valor.split(".");
    if (partes.length > 2) {
        let parteInteira = partes.slice(0, -1).join(""); // Junta tudo antes do último ponto
        let parteDecimal = partes[partes.length - 1]; // Mantém apenas o último grupo decimal
        valor = parteInteira + "." + parteDecimal;
    }

    return parseFloat(valor) || 0; // Retorna número ou 0 se inválido
}

function calcularSomaTotal(produto) {
    let totalRows = document.querySelectorAll(".total-row"); // Seleciona todas as linhas de total
    
    let somaPreco = 0;
    let somaCusto = 0;

    // Percorre todas as linhas de total
    totalRows.forEach(row => {
        let colunas = row.children;
        if (colunas.length >= 3) {
            let preco = formatarNumero(colunas[1].textContent);
            let custo = formatarNumero(colunas[2].textContent);
            somaPreco += preco;
            somaCusto += custo;
        }
    });

    // Atualiza os campos de entrada com os valores somados (se a opção for "Sim")
    if (document.getElementById("field1").value === "sim") {
        document.getElementById("field4").value = somaPreco.toFixed(2); // Valor de Venda
        document.getElementById("field3").value = somaCusto.toFixed(2); // Valor de Custo
    } else {
        // Mantém os valores zerados se for "Não"
        document.getElementById("field4").value = "0.00";
        document.getElementById("field3").value = "0.00";
    }

    // Sempre atualiza o campo de descrição com quebra de linha
    if (produto) {
        let descricaoAtual = document.getElementById("field2").value;
        let novaDescricao = `${produto.name}: ${produto.description}`;

        if (descricaoAtual) {
            descricaoAtual += "\n" + novaDescricao; // Adiciona quebra de linha
        } else {
            descricaoAtual = novaDescricao; // Primeiro item sem quebra de linha
        }

        document.getElementById("field2").value = descricaoAtual;
    }
}

// Evento para recalcular ao mudar a opção do select
document.getElementById("field1").addEventListener("change", function () {
    if (this.value === "sim") {
        calcularSomaTotal(); // Chama a função para somar os valores
    } else {
        // Se não for soma, zera valores mas mantém a descrição preenchida
        document.getElementById("field4").value = "0.00";
        document.getElementById("field3").value = "0.00";
    }
});




