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
        const selectedClass = classFilter.value;
        if (!selectedClass) {
            alert("Por favor, selecione uma classe antes de adicionar um produto.");
            return;
        }

        includedProducts.push({ ...product, class: selectedClass });
        renderIncludedProducts();
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
            separatorRow.innerHTML = `<td colspan="5"><strong>${className}</strong></td>`;
            includedProductsTable.appendChild(separatorRow);

            groupedProducts[className].forEach((product) => {
                const row = document.createElement("tr");
                row.setAttribute("draggable", "true");
                row.classList.add("draggable");
                row.dataset.index = product.index;
                row.dataset.class = product.class;

                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>R$ ${product.price.toFixed(2)}</td>
                    <td>R$ ${product.cost.toFixed(2)}</td>
                    <td>${product.class}</td>
                    <td><button class="remove-product" data-index="${product.index}">Remover</button></td>
                `;
                includedProductsTable.appendChild(row);

                row.querySelector(".remove-product").addEventListener("click", () => {
                    removeProduct(product.index);
                });

                addDragAndDrop(row, className);
            });

            // Linha de totalização do grupo (colocada na parte inferior)
            let totalPrice = groupedProducts[className].reduce((sum, p) => sum + p.price, 0);
            let totalCost = groupedProducts[className].reduce((sum, p) => sum + p.cost, 0);

            const totalRow = document.createElement("tr");
            totalRow.classList.add("total-row");
            totalRow.innerHTML = `
                <td><strong>Total (${className})</strong></td>
                <td><strong>R$ ${totalPrice.toFixed(2)}</strong></td>
                <td><strong>R$ ${totalCost.toFixed(2)}</strong></td>
                <td></td>
                <td></td>
            `;
            includedProductsTable.appendChild(totalRow);
        });
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
