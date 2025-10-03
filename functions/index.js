// functions/index.js (IMPORTAÇÃO CORRIGIDA PARA GEN 2)

// Mude esta linha:
// const functions = require('firebase-functions');

// Para esta:
const {onRequest} = require('firebase-functions/v2/https');
const {setGlobalOptions} = require('firebase-functions/v2');
const {GoogleGenAI} = require('@google/genai');
const functions = require('firebase-functions'); // Mantemos este para acessar o config().gemini.key

// Definir a região e o tempo de execução globalmente
setGlobalOptions({ 
    region: 'us-central1', 
    timeoutSeconds: 300, // Dá mais tempo para a IA responder, por segurança
        // NOVO: Limita a escalabilidade para proteger o custo
    maxInstances: 2 
});


// --- 1. CONFIGURAÇÃO (Segredos e Instrução de Sistema) ---

// A chave é lida do namespace 'gemini' configurado com firebase functions:config:set
const apiKey = functions.config().gemini.key; 

//instruções
const systemInstruction = "Você é um assistente de IA altamente especializado. Sua única fonte de informação e referência para responder a todas as perguntas é o Manual Diagnóstico e Estatístico de Transtornos Mentais, 5ª Edição (DSM-5). SE VOCÊ NÃO PUDER ENCONTRAR A INFORMAÇÃO NO DSM-5, você deve responder com clareza que a informação solicitada está fora de sua base de conhecimento restrita ao DSM-5 ou solicitar que o usuário reformule a pergunta usando termos do manual. Não invente ou use outras fontes. Mantenha as respostas focadas e clinicamente relevantes.";


// --- 2. FUNÇÃO HTTP (onRequest) ---

/**
 * Endpoint HTTP seguro para receber perguntas e chamar o Gemini.
 */
exports.dsm5Query = onRequest(async (req, res) => {
    // 2.1. Habilitar CORS para que o frontend possa chamar o backend
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Resposta para requisição OPTIONS (pré-voo do navegador)
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // 2.2. Validar o método e o corpo da requisição
    if (req.method !== 'POST' || !req.body || !req.body.prompt) {
        res.status(400).send({ 
            status: 'error', 
            message: 'Requisição inválida. Use POST e forneça o campo "prompt".'
        });
        return;
    }

    // 2.3. Configuração da API
    const prompt = req.body.prompt;
    if (!apiKey) {
        res.status(500).send({ status: 'error', message: 'Erro de servidor: Chave da API não carregada.' });
        return;
    }
    
    const ai = new GoogleGenAI(apiKey);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1,
            }
        });
        
        // 2.4. Retorna a resposta com status 200 (OK)
        res.status(200).send({ status: 'success', text: response.text });

    } catch (error) {
        console.error('Erro na API Gemini no Backend:', error);
        res.status(500).send({ status: 'error', message: 'Erro interno na comunicação com a IA.' });
    }
});