// js/storage.js

const PROMPTS_KEY = 'meuPromptPrompts';
const FOLDERS_KEY = 'meuPromptFolders';

// Função auxiliar para gerar IDs únicos simples
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// --- Funções de Pastas ---

async function getFolders() {
    try {
        const result = await chrome.storage.local.get([FOLDERS_KEY]);
        return result[FOLDERS_KEY] || [];
    } catch (error) {
        console.error("Error getting folders:", error);
        return [];
    }
}

async function saveFolder(folderName) {
    if (!folderName || folderName.trim() === "") {
        console.error("Folder name cannot be empty");
        return null;
    }
    try {
        const folders = await getFolders();
        const newFolder = {
            id: generateId(),
            name: folderName.trim()
        };
        folders.push(newFolder);
        await chrome.storage.local.set({ [FOLDERS_KEY]: folders });
        return newFolder;
    } catch (error) {
        console.error("Error saving folder:", error);
        return null;
    }
}

async function updateFolder(folderId, newName) {
    if (!newName || newName.trim() === "") {
        console.error("New folder name cannot be empty");
        return false;
    }
    try {
        const folders = await getFolders();
        const folderIndex = folders.findIndex(f => f.id === folderId);
        if (folderIndex > -1) {
            folders[folderIndex].name = newName.trim();
            await chrome.storage.local.set({ [FOLDERS_KEY]: folders });
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error updating folder:", error);
        return false;
    }
}

async function deleteFolder(folderId) {
    try {
        let folders = await getFolders();
        folders = folders.filter(f => f.id !== folderId);
        await chrome.storage.local.set({ [FOLDERS_KEY]: folders });

        // Também precisamos lidar com prompts que estavam nesta pasta.
        // Opção 1: Excluir prompts da pasta.
        // Opção 2: Mover prompts para "All Prompts" (ou seja, folderId = null ou um ID especial).
        // Por simplicidade, vamos remover o folderId dos prompts associados (órfãos).
        let prompts = await getPrompts();
        prompts = prompts.map(p => {
            if (p.folderId === folderId) {
                return { ...p, folderId: null }; // Ou ''
            }
            return p;
        });
        await chrome.storage.local.set({ [PROMPTS_KEY]: prompts });
        return true;
    } catch (error) {
        console.error("Error deleting folder:", error);
        return false;
    }
}

// --- Funções de Prompts ---

async function getPrompts(folderId = null) {
    try {
        const result = await chrome.storage.local.get([PROMPTS_KEY]);
        const allPrompts = result[PROMPTS_KEY] || [];
        if (folderId && folderId !== 'all' && folderId !== 'favorites') { // 'favorites' será tratado na UI
            return allPrompts.filter(p => p.folderId === folderId);
        }
        return allPrompts;
    } catch (error) {
        console.error("Error getting prompts:", error);
        return [];
    }
}

async function savePrompt(promptData) {
    // promptData = { title: string, content: string, folderId: string (or null), tags: string[] }
    if (!promptData.title || promptData.title.trim() === "") {
        console.error("Prompt title cannot be empty");
        return null;
    }
    try {
        const prompts = await getPrompts(); // Pega todos para adicionar/atualizar
        if (promptData.id) { // Atualizar existente
            const index = prompts.findIndex(p => p.id === promptData.id);
            if (index > -1) {
                prompts[index] = { ...prompts[index], ...promptData };
            } else {
                // Se ID foi fornecido mas não encontrado, tratar como novo? Ou erro?
                // Por ora, vamos adicionar como novo se não encontrar, mas isso pode indicar um problema.
                console.warn("Prompt ID for update not found, saving as new.");
                prompts.push({ ...promptData, id: generateId() }); // Garante novo ID se o antigo era inválido
            }
        } else { // Novo prompt
            const newPrompt = {
                id: generateId(),
                title: promptData.title.trim(),
                content: promptData.content || "",
                folderId: promptData.folderId || null,
                tags: promptData.tags || [],
                isFavorite: false, // Novo campo para favoritos
                createdAt: new Date().toISOString() // Data de criação
            };
            prompts.push(newPrompt);
        }
        await chrome.storage.local.set({ [PROMPTS_KEY]: prompts });
        // Retorna o prompt salvo (especialmente útil para novos prompts com ID gerado)
        // Para simplificar, apenas sinalizamos sucesso. A UI pode recarregar os prompts.
        return true;
    } catch (error) {
        console.error("Error saving prompt:", error);
        return false;
    }
}


async function getPromptById(promptId) {
    try {
        const prompts = await getPrompts();
        return prompts.find(p => p.id === promptId) || null;
    } catch (error) {
        console.error("Error getting prompt by ID:", error);
        return null;
    }
}

async function deletePrompt(promptId) {
    try {
        let prompts = await getPrompts();
        prompts = prompts.filter(p => p.id !== promptId);
        await chrome.storage.local.set({ [PROMPTS_KEY]: prompts });
        return true;
    } catch (error) {
        console.error("Error deleting prompt:", error);
        return false;
    }
}

async function toggleFavoritePrompt(promptId) {
    try {
        const prompts = await getPrompts();
        const promptIndex = prompts.findIndex(p => p.id === promptId);
        if (promptIndex > -1) {
            prompts[promptIndex].isFavorite = !prompts[promptIndex].isFavorite;
            await chrome.storage.local.set({ [PROMPTS_KEY]: prompts });
            return prompts[promptIndex];
        }
        return null;
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return null;
    }
}


// Para testes e debugging, pode ser útil
async function clearAllData() {
    try {
        await chrome.storage.local.remove([PROMPTS_KEY, FOLDERS_KEY]);
        console.log("All data cleared.");
        return true;
    } catch (error) {
        console.error("Error clearing data:", error);
        return false;
    }
}

// Exemplo de como usar (para ser chamado de popup.js ou durante o desenvolvimento):
// (async () => {
//     await clearAllData(); // Limpa tudo para começar do zero

//     const personalFolder = await saveFolder("Personal");
//     const workFolder = await saveFolder("Work");
//     console.log("Folders saved:", await getFolders());

//     if (personalFolder) {
//         await savePrompt({ title: "Ideia de Férias", content: "Planejar viagem para a praia.", folderId: personalFolder.id, tags: ["lazer", "viagem"] });
//     }
//     await savePrompt({ title: "Email para Cliente", content: "Escrever email de follow-up.", folderId: workFolder?.id, tags: ["trabalho", "cliente"] });
//     await savePrompt({ title: "Receita Bolo", content: "Ingredientes: farinha, ovos...", tags: ["culinária"] }); // Sem pasta

//     console.log("All Prompts:", await getPrompts());
//     if (personalFolder) {
//         console.log(`Prompts in ${personalFolder.name}:`, await getPrompts(personalFolder.id));
//     }
// })();
