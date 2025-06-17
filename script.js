document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.querySelector("#data-table tbody");
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    const pageInfo = document.getElementById("page-info");
    const searchInput = document.getElementById("search");
    const filterSeller = document.getElementById("filter-seller");
    const filterStatus = document.getElementById("filter-status");
    const loadingDiv = document.getElementById("loading");
    const table = document.getElementById("data-table");

    let data = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    try {
        // Exibe mensagem de carregamento
        loadingDiv.style.display = "block";
        table.style.display = "none";

        const res = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/propostas", {
            cache: "no-store"
        });

        const propostas = await res.json();
        const sellers = new Set();

        data = propostas
            .filter(p => p.tipoProposta === "editavel")
            .map(p => {
                const campos = p.camposFormulario || {};
                const grupos = p.grupos || [];

                const total = grupos.reduce((soma, grupo) => {
                    return soma + grupo.itens.reduce((subtotal, item) => {
                        const preco = parseFloat(item.preco) || 0;
                        const qtd = parseFloat(item.quantidade) || 1;
                        return subtotal + (preco * qtd);
                    }, 0);
                }, 0);

                const clienteObj = (campos.clientes && campos.clientes[0]) || {};
                const nomeCliente = clienteObj.nome_razao_social || "Cliente sem nome";
                const vendedor = campos.vendedorResponsavel || "Indefinido";
                const status = p.statusOrcamento || "Sem status";
                const dataCriacao = new Date(p.createdAt).toLocaleDateString("pt-BR");

                sellers.add(vendedor);

                return {
                    _id: p._id,
                    cliente: nomeCliente,
                    vendedor,
                    status,
                    date: dataCriacao,
                    value: `R$ ${total.toFixed(2)}`,
                    createdAt: new Date(p.createdAt)
                };
            })
            .reverse();

        data.forEach((item, index) => {
            item.id = index + 1;
        });

        // Preenche opções do filtro de vendedor
        sellers.forEach(vendedor => {
            const option = document.createElement("option");
            option.value = vendedor;
            option.textContent = vendedor;
            filterSeller.appendChild(option);
        });

        renderTable();
    } catch (err) {
        console.error("Erro ao buscar propostas:", err);
        loadingDiv.innerHTML = "❌ Erro ao carregar propostas.";
        return;
    } finally {
        loadingDiv.style.display = "none";
        table.style.display = "table";
    }

    function renderTable(filteredData = data) {
        tableBody.innerHTML = "";

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        filteredData.slice(start, end).forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${start + index + 1}</td>
                <td>${item.date}</td>
                <td>${item.value}</td>
                <td>${item.vendedor}</td>
                <td>${item.cliente}</td>
                <td><span class="status ${item.status.toLowerCase().replace(/\s/g, "-")}">${item.status}</span></td>
                <td class="actions">
                    <button class="edit-btn" data-id="${item._id}">
                        <span class="material-icons-outlined">edit</span>
                    </button>
                    <button class="duplicate-btn" data-id="${item._id}">
                        <span class="material-icons-outlined">content_copy</span>
                    </button>
                    <button class="delete-btn" data-id="${item._id}">
                        <span class="material-icons-outlined">delete</span>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        pageInfo.textContent = `Página ${currentPage}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = end >= filteredData.length;

        addActionEventListeners(filteredData);
    }

    function addActionEventListeners(filteredData) {
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                const itemId = event.currentTarget.getAttribute("data-id");
                data = data.filter(item => item._id !== itemId);
                filterTable();
            });
        });

        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                const itemId = event.currentTarget.getAttribute("data-id");
                if (itemId) {
                    window.location.href = `criarPropostaV2.html?id=${itemId}`;
                } else {
                    alert("❌ ID não encontrado.");
                }
            });
        });

        document.querySelectorAll(".duplicate-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                const itemId = event.currentTarget.getAttribute("data-id");
                const originalItem = data.find(item => item._id === itemId);
                if (originalItem) {
                    const newItem = {
                        ...originalItem,
                        _id: "duplicado-" + Date.now(),
                        id: data.length + 1
                    };
                    data.unshift(newItem);
                    filterTable();
                }
            });
        });
    }

    function filterTable() {
        const searchText = searchInput.value.toLowerCase();
        const selectedSeller = filterSeller.value;
        const selectedStatus = filterStatus.value;

        const filteredData = data.filter(item => {
            const matchesSearch = Object.values(item).some(value =>
                value.toString().toLowerCase().includes(searchText)
            );
            const matchesSeller = selectedSeller === "" || item.vendedor === selectedSeller;
            const matchesStatus = selectedStatus === "" || item.status === selectedStatus;
            return matchesSearch && matchesSeller && matchesStatus;
        });

        currentPage = 1;
        renderTable(filteredData);
    }

    searchInput.addEventListener("input", filterTable);
    filterSeller.addEventListener("change", filterTable);
    filterStatus.addEventListener("change", filterTable);
    prevPageBtn.addEventListener("click", () => {
        currentPage--;
        renderTable();
    });
    nextPageBtn.addEventListener("click", () => {
        currentPage++;
        renderTable();
    });
});

// Função para navegação com parâmetros
function irParaPagina(pagina, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${pagina}?${query}` : pagina;
    window.location.href = url;
}
