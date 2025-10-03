// src/main.js (CÓDIGO DE FRONTEND REVISADO para chamar URL HTTP)

// Importa apenas a inicialização do Firebase para evitar erros (NÃO PRECISAMOS MAIS DE getFunctions)
import { initializeApp } from 'firebase/app'; 
// import { getFunctions, httpsCallable } from 'firebase/functions'; // REMOVER esta linha

// --- 1. CONFIGURAÇÃO E CONEXÃO DO FIREBASE ---

// A configuração é injetada automaticamente
const firebaseConfig = {
    // Sua configuração aqui
};

// Inicialização dos serviços
const app = initializeApp(firebaseConfig);

// URL da sua Cloud Function (O Firebase preenche isso no deploy)
// A URL terá o formato: https://us-central1-[PROJECT-ID].cloudfunctions.net/dsm5Query
// Para o desenvolvimento local, você precisaria de uma URL diferente, mas para o deploy é esta:
const FUNCTION_URL = `https://us-central1-${app.options.projectId}.cloudfunctions.net/dsm5Query`;

// --- 2. FUNÇÃO DE GERAÇÃO DA RESPOSTA (CHAMA O ENDPOINT HTTP) ---

/**
 * Envia o prompt para a Firebase Function via requisição Fetch.
 */
async function generateResponse(prompt) {
    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        const data = await response.json();

        if (data.status === 'success') {
            return data.text; 
        } else {
            // Captura erros retornados pelo servidor
            console.error('Erro do Backend:', data.message);
            return `Desculpe, ocorreu um erro no servidor: ${data.message}`;
        }
    } catch (error) {
        console.error('Erro ao chamar o endpoint HTTP:', error);
        return 'Desculpe, falha na comunicação com o servidor. Verifique o console.';
    }
}

// --- 3. FUNÇÕES E LISTENERS DE INTERAÇÃO COM A UI (O CÓDIGO DA UI PERMANECE O MESMO) ---

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

/**
 * Adiciona uma bolha de mensagem na janela de chat e rola para o fim.
 */
function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.innerHTML = text.replace(/\n/g, '<br>'); 
    chatWindow.appendChild(messageDiv);
    
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Função principal de envio de mensagem
async function sendMessage() {
    const prompt = userInput.value.trim();
    if (prompt === '') return;

    // 1. Exibe a mensagem do usuário
    appendMessage(prompt, 'user');
    userInput.value = '';
    sendButton.disabled = true; 

    // 2. Exibe uma mensagem de carregamento (placeholder)
    appendMessage("Pensando...", 'ia'); 
    const loadingMessage = chatWindow.lastChild;

    try {
        // 3. Chama a função de geração da IA no BACKEND
        const iaResponse = await generateResponse(prompt);

        // 4. Substitui a mensagem de carregamento pela resposta real
        loadingMessage.innerHTML = iaResponse.replace(/\n/g, '<br>');
        
    } catch (error) {
        console.error("Erro no fluxo do chat:", error);
        loadingMessage.innerHTML = "Ocorreu um erro inesperado na comunicação.";
    } finally {
        sendButton.disabled = false;
        userInput.focus(); 
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

// Listeners de Eventos
document.addEventListener('DOMContentLoaded', () => {
    userInput.focus(); 
});

// Ao clicar no botão
sendButton.addEventListener('click', sendMessage);

// Ao pressionar ENTER na caixa de texto
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});