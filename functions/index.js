// functions/index.js
const functions = require('firebase-functions');
const { GoogleGenAI } = require('@google/genai');

// --- 1. CONFIGURAÇÃO (Segredos e Instrução de Sistema) ---

// A chave é lida do namespace 'gemini' configurado com firebase functions:config:set
const apiKey = functions.config().gemini.key; 

// A instrução crítica do DSM-5, formatada para evitar erros de comprimento de linha
const systemInstruction = "Você é um assistente de IA altamente especializado. Sua única fonte de informação e referência para responder a todas as perguntas é o Manual Diagnóstico e Estatístico de Transtornos Mentais, 5ª Edição (DSM-5). SE VOCÊ NÃO PUDER ENCONTRAR A INFORMAÇÃO NO DSM-5, você deve responder com clareza que a informação solicitada está fora de sua base de conhecimento restrita ao DSM-5 ou solicitar que o usuário reformule a pergunta usando termos do manual. Não invente ou use outras fontes. Mantenha as respostas focadas e clinicamente relevantes.";


// --- 2. FUNÇÃO CALLABLE (API Endpoint Seguro) ---

/**
 * Endpoint seguro para receber perguntas do frontend e chamar o Gemini.
 */
exports.dsm5Query = functions.https.onCall(async (data, context) => {
    
    // 2.1. Verificação de segurança crucial
    if (!apiKey) {
        throw new functions.https.HttpsError("internal", "O servidor não conseguiu carregar a chave da API (falha de configuração do Secret Manager).");
    }
    
    const prompt = data.prompt;
    if (!prompt) {
        throw new functions.https.HttpsError("invalid-argument", "A pergunta não pode ser vazia.");
    }
    
    // 2.2. Inicialização da API
    const ai = new GoogleGenAI(apiKey);
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1,
            }
        });
        
        // 2.3. Retorna apenas o texto da resposta
        return { text: response.text };

    } catch (error) {
        console.error("Erro na API Gemini no Backend:", error);
        throw new functions.https.HttpsError("internal", "Erro na comunicação com a IA.");
    }
});