// js/manage_prompt.js

document.addEventListener('DOMContentLoaded', async () => {
    const promptForm = document.getElementById('prompt-form');
    const pageTitle = document.getElementById('manage-prompt-title');
    const titleInput = document.getElementById('prompt-title-input');
    const contentInput = document.getElementById('prompt-content-input');
    const folderSelect = document.getElementById('prompt-folder-select');
    const tagsInput = document.getElementById('prompt-tags-input');
    const btnSave = document.getElementById('btn-save-prompt');
    const btnCancel = document.getElementById('btn-cancel');
    const btnBack = document.getElementById('btn-back');

    let editingPromptId = null;

    // --- Inicialização ---
    async function initialize() {
        await populateFolders();

        const urlParams = new URLSearchParams(window.location.search);
        editingPromptId = urlParams.get('id');

        if (editingPromptId) {
            pageTitle.textContent = 'Editar Prompt';
            const prompt = await getPromptById(editingPromptId);
            if (prompt) {
                titleInput.value = prompt.title;
                contentInput.value = prompt.content;
                folderSelect.value = prompt.folderId || "";
                tagsInput.value = prompt.tags ? prompt.tags.join(', ') : "";
            } else {
                console.error("Prompt não encontrado para edição.");
                // Poderia redirecionar ou mostrar uma mensagem de erro
                alert("Erro: Prompt para edição não encontrado.");
                window.location.href = 'popup.html'; // Volta para a lista
            }
        } else {
            pageTitle.textContent = 'Novo Prompt';
        }

        // Adiciona manipuladores de evento
        promptForm.addEventListener('submit', handleSavePrompt);
        if(btnCancel) btnCancel.addEventListener('click', handleCancel);
        if(btnBack) btnBack.addEventListener('click', handleCancel); // btnBack faz o mesmo que cancelar
    }

    async function populateFolders() {
        const folders = await getFolders(); // Vem de storage.js
        if (folderSelect) {
            folders.forEach(folder => {
                const option = document.createElement('option');
                option.value = folder.id;
                option.textContent = folder.name;
                folderSelect.appendChild(option);
            });
        }
    }

    // --- Manipuladores de Evento ---
    async function handleSavePrompt(event) {
        event.preventDefault(); // Previne o envio padrão do formulário

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const folderId = folderSelect.value;
        const tagsString = tagsInput.value.trim();

        // Validação simples
        if (!title) {
            alert("O título do prompt é obrigatório.");
            titleInput.focus();
            return;
        }
        if (!content) {
            alert("O conteúdo do prompt é obrigatório.");
            contentInput.focus();
            return;
        }

        const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        const promptData = {
            title,
            content,
            folderId: folderId || null, // Salva null se "Nenhuma" for selecionado
            tags
        };

        if (editingPromptId) {
            promptData.id = editingPromptId;
        }

        const success = await savePrompt(promptData); // Vem de storage.js

        if (success) {
            // Redireciona de volta para a página principal (popup.html)
            // Passar um parâmetro para indicar sucesso ou para atualizar a lista pode ser útil
            window.location.href = 'popup.html?promptSaved=true';
        } else {
            alert("Erro ao salvar o prompt. Verifique o console para mais detalhes.");
        }
    }

    function handleCancel() {
        // Simplesmente volta para a página principal
        window.location.href = 'popup.html';
    }

    initialize();
});
