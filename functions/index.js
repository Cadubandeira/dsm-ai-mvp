// functions/index.js
// --- IMPORTS ---
const {onRequest} = require('firebase-functions/v2/https');
// Não precisa de setGlobalOptions ou defineSecret aqui, pois definiremos na função.
const {GoogleGenAI} = require('@google/genai');

// --- INSTRUÇÃO DE SISTEMA ---
const systemInstruction = "Você é um assistente de IA altamente especializado. Sua única fonte de informação e referência para responder a todas as perguntas é o Manual Diagnóstico e Estatístico de Transtornos Mentais, 5ª Edição (DSM-5). SE VOCÊ NÃO PUDER ENCONTRAR A INFORMAÇÃO NO DSM-5, você deve responder com clareza que a informação solicitada está fora de sua base de conhecimento restrita ao DSM-5 ou solicitar que o usuário reformule a pergunta usando termos do manual. Não invente ou use outras fontes. Mantenha as respostas focadas e clinicamente relevantes.";

// --- FUNÇÃO PRINCIPAL (UNIFICADA) ---

exports.dsm5Query = onRequest({ 
    // 1. Configuração do Cloud Run (V2)
    region: 'us-central1',
    timeoutSeconds: 300,
    maxInstances: 2,           // Limite de instâncias (custo)
    secrets: ['GEMINI_KEY']    // Vínculo com a variável de ambiente segura
}, async (req, res) => {
    
    // 2. Leitura da Chave API e Verificação de Erro (dentro da função)
    const apiKey = process.env.GEMINI_KEY;

    if (!apiKey) {
        // Agora, este erro 500 não deve mais aparecer se o segredo for definido!
        console.error("Erro: A chave GEMINI_KEY não foi carregada.");
        return res.status(500).send({ error: "Erro de servidor: Chave da API não carregada." });
    }
    
    // 3. Habilitar CORS (para o preflight OPTIONS e a requisição POST)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Resposta para requisição OPTIONS (pré-voo do navegador)
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // 4. Validar o método e o corpo da requisição (a partir daqui é a lógica do POST)
    if (req.method !== 'POST' || !req.body || !req.body.prompt) {
        res.status(400).send({ 
            status: 'error', 
            message: 'Requisição inválida. Use POST e forneça o campo "prompt".'
        });
        return;
    }

    const prompt = req.body.prompt;
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
        
        // 5. Retorna a resposta com status 200 (OK)
        res.status(200).send({ status: 'success', text: response.text });

    } catch (error) {
        console.error('Erro na API Gemini no Backend:', error);
        res.status(500).send({ status: 'error', message: 'Erro interno na comunicação com a IA.' });
    }
});