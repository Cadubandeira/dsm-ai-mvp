// src/main.js (CÓDIGO DE FRONTEND REVISADO)

// Importa os módulos do Firebase para comunicação com o Backend
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

// --- 1. CONFIGURAÇÃO E CONEXÃO DO FIREBASE ---

// A configuração é injetada automaticamente pelo Firebase no Hosting
// Se for local, essa config pode ser vazia, mas no deploy ela será preenchida.
const firebaseConfig = {
    // Insira aqui os dados de config do seu projeto do Firebase (API Key, Project ID, etc.)
    // Você pode pegar isso no Console do Firebase > Configurações do Projeto
};

// Inicialização dos serviços
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Referência à função callable que criamos no backend (dsm5Query)
const dsm5Query = httpsCallable(functions, 'dsm5Query'); 

// --- 2. FUNÇÃO DE GERAÇÃO DA RESPOSTA (CHAMA O BACKEND) ---

/**
 * Envia o prompt para a Firebase Function no servidor seguro.
 */
async function generateResponse(prompt) {
    try {
        // Envia o prompt para a função Firebase
        const result = await dsm5Query({ prompt: prompt });
        
        // Retorna o campo 'text' que a função backend retorna
        return result.data.text; 
    } catch (error) {
        console.error('Erro ao chamar a Firebase Function:', error);
        // O erro do servidor é encapsulado aqui
        return 'Desculpe, ocorreu um erro na comunicação com o servidor seguro. Verifique o console.';
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