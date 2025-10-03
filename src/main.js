import { GoogleGenAI } from '@google/genai';

// --- 1. CONFIGURAÇÃO E AUTENTICAÇÃO (Gemini API Key) ---

// O Parcel injeta a variável de ambiente APENAS se ela tiver o prefixo PARCEL_PUBLIC_
const GEMINI_API_KEY = process.env.PARCEL_PUBLIC_GEMINI_API_KEY; 

let ai = null; 

if (!GEMINI_API_KEY) {
    console.error("ERRO CRÍTICO: Chave da API Gemini não foi carregada. Verifique se o arquivo .env existe e se a variável usa o prefixo PARCEL_PUBLIC_.");
    // Deixa 'ai' como null para que a função generateResponse possa retornar um erro amigável
} else {
    // Inicializa a API com a chave
    ai = new GoogleGenAI(GEMINI_API_KEY);
}

// --- 2. INSTRUÇÃO DE SISTEMA (RAG e DSM-5) ---

// Esta instrução crítica restringe o modelo a usar APENAS o DSM-5 como fonte.
const systemInstruction = `Você é um assistente de IA altamente especializado. Sua única fonte de informação e referência para responder a todas as perguntas é o Manual Diagnóstico e Estatístico de Transtornos Mentais, 5ª Edição (DSM-5). 

SE VOCÊ NÃO PUDER ENCONTRAR A INFORMAÇÃO NO DSM-5, você deve responder com clareza que a informação solicitada está fora de sua base de conhecimento restrita ao DSM-5 ou solicitar que o usuário reformule a pergunta usando termos do manual. Não invente ou use outras fontes. Mantenha as respostas focadas e clinicamente relevantes.`;


// --- 3. FUNÇÃO DE GERAÇÃO DA RESPOSTA ---

/**
 * Envia o prompt do usuário para a API Gemini com a restrição do DSM-5.
 */
async function generateResponse(prompt) {
    // Retorna a mensagem de erro se a autenticação falhou
    if (!ai) {
        return "Desculpe, a conexão com a IA falhou. A chave de API não foi configurada corretamente (verifique o console).";
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1, // Baixo para respostas factuais e consistentes
            }
        });
        
        return response.text;
    } catch (error) {
        console.error('Erro na API Gemini:', error);
        // Retorna um erro amigável ao usuário
        return 'Ocorreu um erro ao buscar a resposta da IA. Pode ser um problema de permissão da API.';
    }
}


// --- 4. FUNÇÕES E LISTENERS DE INTERAÇÃO COM A UI ---

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

/**
 * Adiciona uma bolha de mensagem na janela de chat e rola para o fim.
 */
function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    // Usa innerHTML para processar <br>
    messageDiv.innerHTML = text.replace(/\n/g, '<br>'); 
    chatWindow.appendChild(messageDiv);
    
    // Rola automaticamente para a última mensagem
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
        // 3. Chama a função de geração da IA
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
    // Coloca o foco de volta na caixa de texto
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