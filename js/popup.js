// js/popup.js

document.addEventListener('DOMContentLoaded', async () => {
    // Seletores DOM
    const folderNavUl = document.querySelector('.folder-nav ul');
    const btnNewFolder = document.querySelector('.btn-new-folder');
    const promptsGrid = document.getElementById('prompts-grid');
    const btnNewPrompt = document.querySelector('.btn-new-prompt');
    const searchInput = document.getElementById('search-input');
    const logo = document.querySelector('.sidebar .logo');

    let allPrompts = [];
    let allFolders = [];
    let currentFolderId = 'all'; // 'all', 'favorites', ou ID da pasta

    // --- Funções de Renderização ---

    function renderFolders() {
        if (!folderNavUl) return;

        // Limpa pastas existentes, exceto "All Prompts" e "Favorites"
        const staticItems = folderNavUl.querySelectorAll('li[data-folder-id="all"], li[data-folder-id="favorites"]');
        folderNavUl.innerHTML = ''; // Limpa tudo
        staticItems.forEach(item => folderNavUl.appendChild(item.cloneNode(true))); // Readiciona os estáticos

        // Adiciona as pastas do usuário
        allFolders.forEach(folder => {
            const li = document.createElement('li');
            li.dataset.folderId = folder.id;
            // li.textContent = folder.name; // Agora o nome vai dentro de um span

            const folderNameSpan = document.createElement('span');
            folderNameSpan.classList.add('folder-name');
            folderNameSpan.textContent = folder.name;
            li.appendChild(folderNameSpan);

            // Ícone de pasta (placeholder)
            // const folderIcon = document.createElement('img');
            // folderIcon.src = "../icons/icon_folder.png";
            // folderIcon.alt = "";
            // li.prepend(folderIcon); // Adiciona no início

            if (folder.id !== 'all' && folder.id !== 'favorites') { // Não adicionar botões para 'All' ou 'Favorites'
                const folderActions = document.createElement('div');
                folderActions.classList.add('folder-actions');

                const editFolderButton = document.createElement('button');
                editFolderButton.classList.add('btn-icon-folder', 'edit-folder');
                editFolderButton.innerHTML = '✏️'; // Placeholder, usar SVG/icon depois
                editFolderButton.title = "Renomear Pasta";
                editFolderButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Impede que o clique selecione a pasta
                    handleRenameFolder(folder.id, folder.name);
                });

                const deleteFolderButton = document.createElement('button');
                deleteFolderButton.classList.add('btn-icon-folder', 'delete-folder');
                deleteFolderButton.innerHTML = '🗑️'; // Placeholder
                deleteFolderButton.title = "Excluir Pasta";
                deleteFolderButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id, folder.name);
                });

                folderActions.appendChild(editFolderButton);
                folderActions.appendChild(deleteFolderButton);
                li.appendChild(folderActions);
            }


            if (folder.id === currentFolderId) {
                li.classList.add('active');
            }
            folderNavUl.appendChild(li);
        });

        // Reatribui eventos de clique para seleção de pasta
        folderNavUl.querySelectorAll('li').forEach(li => {
            // Adiciona o event listener apenas se não for um botão dentro do li
            li.addEventListener('click', (event) => {
                if (event.target === li || event.target.classList.contains('folder-name') || event.target.tagName === 'IMG') {
                    handleFolderSelect(event);
                }
            });
        });
    }

    function renderPrompts(promptsToRender = allPrompts) {
        if (!promptsGrid) return;
        promptsGrid.innerHTML = ''; // Limpa prompts existentes

        const filteredPrompts = filterPrompts(promptsToRender);

        if (filteredPrompts.length === 0) {
            promptsGrid.innerHTML = '<p class="empty-state">Nenhum prompt encontrado.</p>'; // Melhorar este estado vazio depois
            return;
        }

        filteredPrompts.forEach(prompt => {
            const card = document.createElement('div');
            card.classList.add('prompt-card');
            card.dataset.promptId = prompt.id;

            // Título
            const title = document.createElement('h3');
            title.classList.add('prompt-title');
            title.textContent = prompt.title;

            // Conteúdo
            const content = document.createElement('p');
            content.classList.add('prompt-content');
            content.textContent = prompt.content;

            // Tags
            const tagsContainer = document.createElement('div');
            tagsContainer.classList.add('prompt-tags');
            if (prompt.tags && prompt.tags.length > 0) {
                prompt.tags.forEach(tagText => {
                    const tag = document.createElement('span');
                    tag.classList.add('tag');
                    tag.textContent = tagText;
                    if (tagText.toLowerCase() === 'idea' || tagText.toLowerCase() === 'ideia') {
                        tag.classList.add('idea'); // Adiciona classe para estilo específico
                    }
                    tagsContainer.appendChild(tag);
                });
            }

            // Ações
            const actions = document.createElement('div');
            actions.classList.add('prompt-actions');

            const copyButton = document.createElement('button');
            copyButton.classList.add('btn-icon', 'btn-copy');
            copyButton.innerHTML = '<img src="../icons/icon_copy.png" alt="Copy" title="Copiar"/>'; // Usar SVGs ou icon fonts seria melhor
            copyButton.addEventListener('click', () => handleCopyPrompt(prompt.content));

            const editButton = document.createElement('button');
            editButton.classList.add('btn-icon', 'btn-edit');
            editButton.innerHTML = '<img src="../icons/icon_edit.png" alt="Edit" title="Editar"/>';
            editButton.addEventListener('click', () => handleEditPrompt(prompt.id));

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn-icon', 'btn-delete');
            // Idealmente, usar SVGs aqui. Ex:
            // deleteButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24">...</svg>`;
            deleteButton.innerHTML = '<img src="../icons/icon_delete.png" alt="Delete" title="Excluir"/>'; // Manter placeholder por enquanto
            deleteButton.addEventListener('click', () => handleDeletePrompt(prompt.id));

            const favoriteButton = document.createElement('button');
            favoriteButton.classList.add('btn-icon', 'btn-favorite');
            // Usar caminhos diferentes para ícones de favorito preenchido/vazio
            const favIconName = prompt.isFavorite ? 'icon_favorite_filled.png' : 'icon_favorite_outline.png';
            favoriteButton.innerHTML = `<img src="../icons/${favIconName}" alt="Favorite" title="${prompt.isFavorite ? 'Desfavoritar' : 'Favoritar'}"/>`;
            favoriteButton.addEventListener('click', () => handleToggleFavorite(prompt.id));

            // Agrupar botões da direita
            const actionGroupRight = document.createElement('div');
            actionGroupRight.classList.add('action-group-right');
            actionGroupRight.appendChild(copyButton);
            actionGroupRight.appendChild(editButton);
            actionGroupRight.appendChild(deleteButton);

            actions.appendChild(favoriteButton);
            actions.appendChild(actionGroupRight);


            card.appendChild(title);
            card.appendChild(content);
            card.appendChild(tagsContainer);
            card.appendChild(actions);
            promptsGrid.appendChild(card);
        });
    }

    function filterPrompts(prompts) {
        let filtered = prompts;
        const searchTerm = searchInput.value.toLowerCase();

        // Filtrar por pasta selecionada
        if (currentFolderId === 'all') {
            // Nenhuma filtragem por pasta
        } else if (currentFolderId === 'favorites') {
            filtered = filtered.filter(p => p.isFavorite);
        } else { // Pasta específica
            filtered = filtered.filter(p => p.folderId === currentFolderId);
        }

        // Filtrar por termo de busca
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(searchTerm) ||
                p.content.toLowerCase().includes(searchTerm) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }
        return filtered;
    }

    // --- Manipuladores de Eventos ---
    async function handleFolderSelect(event) {
        const selectedFolderId = event.currentTarget.dataset.folderId;
        if (selectedFolderId === currentFolderId) return;

        currentFolderId = selectedFolderId;

        // Atualiza a classe 'active' na navegação de pastas
        folderNavUl.querySelectorAll('li').forEach(li => {
            li.classList.remove('active');
            if (li.dataset.folderId === currentFolderId) {
                li.classList.add('active');
            }
        });
        loadAndRenderPrompts(); // Recarrega e renderiza os prompts para a nova pasta
    }

    async function handleAddNewFolder() {
        const folderName = prompt("Digite o nome da nova pasta:"); // UI temporária
        if (folderName && folderName.trim() !== "") {
            const newFolder = await saveFolder(folderName.trim());
            if (newFolder) {
                allFolders.push(newFolder);
                renderFolders(); // Re-renderiza a lista de pastas
                // Opcional: selecionar a nova pasta automaticamente
                // currentFolderId = newFolder.id;
                // loadAndRenderPrompts();
            } else {
                alert("Erro ao salvar a pasta. Verifique o console.");
            }
        }
    }

    function handleNavigateToNewPrompt() {
        window.location.href = 'manage_prompt.html';
    }

    async function handleCopyPrompt(content) {
        try {
            await navigator.clipboard.writeText(content);
            // Adicionar feedback visual (ex: toast "Copiado!")
            alert("Prompt copiado para a área de transferência!"); // Feedback temporário
        } catch (err) {
            console.error('Falha ao copiar prompt: ', err);
            alert("Erro ao copiar o prompt.");
        }
    }

    async function handleEditPrompt(promptId) {
        window.location.href = `manage_prompt.html?id=${promptId}`;
    }

    async function handleDeletePrompt(promptId) {
        const confirmed = confirm("Tem certeza que deseja excluir este prompt?");
        if (confirmed) {
            const success = await deletePrompt(promptId);
            if (success) {
                await loadAndRenderPrompts(); // Recarrega e renderiza
            } else {
                alert("Erro ao excluir o prompt.");
            }
        }
    }

    async function handleToggleFavorite(promptId) {
        const updatedPrompt = await toggleFavoritePrompt(promptId);
        if (updatedPrompt) {
            // Atualiza o prompt na lista local `allPrompts` para evitar recarregar tudo do storage
            const index = allPrompts.findIndex(p => p.id === promptId);
            if (index > -1) {
                allPrompts[index] = updatedPrompt;
            }
            renderPrompts(allPrompts); // Re-renderiza para atualizar o ícone de favorito e a filtragem de favoritos
        } else {
            alert("Erro ao atualizar favorito.");
        }
    }

    async function handleSearch() {
        renderPrompts(allPrompts);
    }

    async function handleRenameFolder(folderId, currentName) {
        const newName = prompt(`Renomear pasta "${currentName}":`, currentName);
        if (newName && newName.trim() !== "" && newName.trim() !== currentName) {
            const success = await updateFolder(folderId, newName.trim()); // de storage.js
            if (success) {
                // Atualiza a lista local e re-renderiza
                const folderIndex = allFolders.findIndex(f => f.id === folderId);
                if (folderIndex > -1) {
                    allFolders[folderIndex].name = newName.trim();
                }
                renderFolders();
                // Se a pasta renomeada era a atual, não precisa fazer nada extra
                // pois o ID não mudou.
            } else {
                alert("Erro ao renomear a pasta.");
            }
        }
    }

    async function handleDeleteFolder(folderId, folderName) {
        const confirmed = confirm(`Tem certeza que deseja excluir a pasta "${folderName}"? Os prompts dentro dela não serão excluídos, mas ficarão sem pasta.`);
        if (confirmed) {
            const success = await deleteFolder(folderId); // de storage.js
            if (success) {
                allFolders = allFolders.filter(f => f.id !== folderId);
                // Se a pasta excluída era a ativa, volta para "All Prompts"
                if (currentFolderId === folderId) {
                    currentFolderId = 'all';
                    // Atualiza a classe 'active' na UI
                     folderNavUl.querySelectorAll('li').forEach(item => {
                        item.classList.remove('active');
                        if (item.dataset.folderId === 'all') {
                            item.classList.add('active');
                        }
                    });
                }
                renderFolders();
                await loadAndRenderPrompts(); // Recarrega prompts pois alguns podem ter mudado de pasta
            } else {
                alert("Erro ao excluir a pasta.");
            }
        }
    }


    // --- Inicialização ---
    async function initialize() {
        // Adiciona manipuladores de eventos
        if (btnNewFolder) btnNewFolder.addEventListener('click', handleAddNewFolder);
        if (btnNewPrompt) btnNewPrompt.addEventListener('click', handleNavigateToNewPrompt);
        if (searchInput) searchInput.addEventListener('input', handleSearch); // Pode adicionar debounce depois
        if (logo) logo.addEventListener('click', () => { // Clicar no logo volta para "All Prompts"
            currentFolderId = 'all';
            // Atualiza a classe 'active' na UI
            folderNavUl.querySelectorAll('li').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.folderId === 'all') {
                    item.classList.add('active');
                }
            });
            loadAndRenderPrompts();
        });


        // Carrega dados iniciais
        allFolders = await getFolders();
        renderFolders(); // Isso agora adiciona os event listeners para os botões das pastas também

        await loadAndRenderPrompts(); // Carrega e renderiza prompts para a pasta 'all' ou a última selecionada (se persistida)
    }

    async function loadAndRenderPrompts() {
        allPrompts = await getPrompts(); // Pega todos os prompts sempre, a filtragem ocorre em renderPrompts
        renderPrompts(allPrompts);
    }

    initialize();
});
