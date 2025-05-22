document.addEventListener("DOMContentLoaded", () => {
    const editor = document.getElementById("editor");

    // Lista de variáveis disponíveis
    const variables = ["Nome", "Telefone", "Email", "Endereço", "Cidade", "Estado", "Data de Nascimento"];

    // Cria a lista de sugestões (autocomplete) dinamicamente
    let autocompleteList = document.createElement("ul");
    autocompleteList.id = "autocomplete-list";
    autocompleteList.className = "autocomplete-list";
    document.body.appendChild(autocompleteList);

    // Formata texto (negrito, itálico, sublinhado)
    function formatText(command, value = null) {
        document.execCommand(command, false, value);
    }




    // Exporta o conteúdo como HTML
    document.getElementById("save-text").addEventListener("click", () => {
        const blob = new Blob([editor.innerHTML], { type: "text/html" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "documento.html";
        link.click();
    });

    // Detecta quando o usuário digita no editor
    editor.addEventListener("input", (event) => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const text = range.startContainer.textContent;

        if (text.includes("#")) {
            showAutocomplete(range, selection);
        } else {
            autocompleteList.style.display = "none";
        }
    });

    // Exibe a lista de sugestões de variáveis
    function showAutocomplete(range, selection) {
        autocompleteList.innerHTML = "";
        variables.forEach(variable => {
            const li = document.createElement("li");
            li.textContent = variable;
            li.onclick = () => insertVariable(variable, range, selection);
            autocompleteList.appendChild(li);
        });

        // Posição da lista de sugestões próximo ao cursor
        const rect = range.getBoundingClientRect();
        autocompleteList.style.top = `${rect.top + window.scrollY + 25}px`;
        autocompleteList.style.left = `${rect.left + window.scrollX}px`;
        autocompleteList.style.display = "block";
    }

    // Insere a variável no texto e remove o `#`
    function insertVariable(variable, range, selection) {
        let text = range.startContainer.textContent;
        text = text.replace(/#$/, ""); // Remove o '#' antes de inserir a variável
        range.startContainer.textContent = text; // Atualiza o texto sem o '#'

        const span = document.createElement("span");
        span.className = "variable";
        span.textContent = `${variable}`;
        range.insertNode(span);
        autocompleteList.style.display = "none";

        // Ajustar posição do cursor após inserção
        range.setStartAfter(span);
        range.setEndAfter(span);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    // Fecha o autocomplete se clicar fora
    document.addEventListener("click", (e) => {
        if (!autocompleteList.contains(e.target) && e.target !== editor) {
            autocompleteList.style.display = "none";
        }
    });

    // Função para salvar como PDF com margens e texto real
    function saveAsPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        // Definir margens e conteúdo
        const margins = { top: 20, left: 15, right: 15, bottom: 20 };
        const content = editor.innerText.replace(/\n/g, "\n"); // Ajusta quebras de linha

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(content, margins.left, margins.top, {
            maxWidth: 180, // Define largura máxima do texto dentro do PDF
        });

        doc.save("documento.pdf");
    }
});

// Aplica formatação ao texto selecionado
function formatText(command, value = null) {
    document.execCommand(command, false, value);
}

// Alterna entre alinhamentos do texto
function alignText(alignment) {
    document.execCommand("justify" + alignment);
}

// Função para transformar o texto selecionado em lista com pontos (Bullet List)
function toggleBulletList() {
    document.execCommand("insertUnorderedList");
}



// Função para aumentar o tamanho do texto
function increaseFontSize() {
    document.execCommand("fontSize", false, "5"); // Nível 5 equivale a um tamanho maior
}

// Função para diminuir o tamanho do texto
function decreaseFontSize() {
    document.execCommand("fontSize", false, "1"); // Nível 1 equivale a um tamanho menor
}

// Remove toda a formatação do texto
function removeFormatting() {
    document.execCommand("removeFormat");
}

document.addEventListener("DOMContentLoaded", () => {
    const editor = document.getElementById("editor");
    const templateSelect = document.getElementById("template-select");

    // Modelos disponíveis
    const templates = {
        "contrato": `
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
                * { font-family: 'Poppins', sans-serif !important; }
            </style>
            <p style="line-height: 108%; margin-bottom: 0.28cm"><b>CONTRATO DE FORNECIMENTO DE SERVIÇOS</b></p>
            <p style="line-height: 108%; margin-bottom: 0.28cm"><b>PARTES:</b></p>
            <ol>
                <li><p><strong>Fornecedor:</strong> <span style="background: #ffff00">VICTOR HUGO NUNES MOREIRA</span>, 
                pessoa jurídica, com sede na Rua Visconde de Taunay, 860, inscrita no CNPJ sob o nº 
                <span style="background: #ffff00">44.423.322/0001-19</span>, doravante denominado "FORNECEDOR".</p></li>
                <li><p><strong>Cliente:</strong> <span style="background: #ffff00">FERREIRA E ULHOA METAIS LTDA</span>, 
                com sede em Belo Horizonte, na Rua Olinto Magalhães, 117, Vila Celeste Império (Padre Eustáquio), 
                inscrita no CNPJ sob o nº <span style="background: #ffff00">02.836.048/0001-60</span>, doravante denominado "CLIENTE".</p></li>
            </ol>

            <p><strong>CLÁUSULA 1 - OBJETO</strong></p>
            <p><strong>1.1</strong> O presente contrato tem como objeto o fornecimento dos serviços para o desenvolvimento 
            de um <strong>sistema de orçamentos personalizados</strong>, integrado com o sistema <strong>Omie</strong>, visando 
            facilitar a criação de orçamentos e criação de pedidos de venda. A <strong>Contratada</strong> se responsabiliza 
            exclusivamente pelas funções relacionadas à criação do sistema.</p>
            
            <p><strong>1.2</strong> Fica acordado que ações como <strong>cadastro de produtos</strong>, <strong>criação de contas</strong>, 
            <strong>configurações internas</strong> e qualquer outra função que não esteja diretamente relacionada ao funcionamento do PDV, 
            serão de <strong>responsabilidade exclusiva do CONTRATANTE</strong>.</p>

            <p><strong>CLÁUSULA 2 - FASES DO PROJETO</strong></p>
            <p><strong>2.1</strong> Fase de Averiguação (Sem Custo): Esta fase envolve a verificação detalhada do projeto.</p>
            
            <p><strong>2.2</strong> Fase de Concepção e Testes – Valor: 50% do valor total do projeto.</p>
            <p><strong>2.3</strong> Fase de Entrega do Projeto – Valor: 50% do valor total do projeto.</p>

            <p><strong>CLÁUSULA 3 - PAGAMENTO</strong></p>
            <p><strong>3.1</strong> Pagamento da Primeira Etapa: <span style="background: #ffff00">27/02/2025.</span></p>

            <p><strong>3.2</strong> Pagamentos por Etapa:</p>
            <ul>
                <li><strong>Fase de Concepção e Testes:</strong> R$ 1.500,00 (42,86% do valor total).</li>
                <li><strong>Fase de Entrega do Projeto:</strong> R$ 2.000,00 (57,14% do valor total).</li>
            </ul>

            <p><strong>CLÁUSULA 4 - PRAZO DE EXECUÇÃO</strong></p>
            <p><strong>4.1</strong> O prazo para a conclusão de cada fase será de 30 dias corridos após o início da segunda etapa.</p>

            <p><strong>CLÁUSULA 5 - OBRIGAÇÕES DO FORNECEDOR</strong></p>
            <p>5.1 O FORNECEDOR se compromete a executar os serviços conforme especificado.</p>

            <p><strong>CLÁUSULA 6 - OBRIGAÇÕES DO CLIENTE</strong></p>
            <p>6.1 O CLIENTE se compromete a efetuar os pagamentos conforme especificado na Cláusula 3.</p>

            <p><strong>CLÁUSULA 7 - RESCISÃO</strong></p>
            <p><strong>7.1</strong> O contrato poderá ser rescindido por mútuo acordo ou descumprimento de cláusulas.</p>

            <p><strong>CLÁUSULA 8 - PROPRIEDADE INTELECTUAL</strong></p>
            <p>8.1 O código-fonte desenvolvido permanecerá exclusivamente sob a titularidade da CONTRATADA.</p>

            <p><strong>CLÁUSULA 9 - CONFIDENCIALIDADE</strong></p>
            <p>9.1 Ambas as partes concordam em manter sigilo sobre todas as informações confidenciais.</p>

            <p><strong>CLÁUSULA 10 - ASSINATURAS</strong></p>
            <p>Por estarem assim justas e contratadas, as partes assinam o presente contrato.</p>

            <p><b>[Local], [Data]</b></p>
            <p><b>VICTOR FRIOLLINE</b> - FORNECEDOR</p>
            <p><b>FERREIRA E ULHOA METAIS LTDA</b> - CLIENTE</p>
        `
    };

    // Evento para mudar o conteúdo do editor ao selecionar um modelo
    templateSelect.addEventListener("change", () => {
        const selectedTemplate = templateSelect.value;
        if (templates[selectedTemplate]) {
            editor.innerHTML = templates[selectedTemplate]; // Insere o modelo no editor
        }
    });
});
