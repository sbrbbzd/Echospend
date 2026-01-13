
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { mlService } from './mlService';

const genAI = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY });
// Function Declarations for Gemini
export const FINANCIAL_FUNCTIONS: FunctionDeclaration[] = [
  {
    name: 'getFinancialSummary',
    description: 'Get the total spent, total income, and remaining budget status.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'searchTransactions',
    description: 'Search for specific expenses or income by keyword or category.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The keyword to search for in descriptions (e.g., "coffee", "uber").',
        },
        category: {
          type: Type.STRING,
          description: 'The category to filter by.',
        },
      },
    },
  },
  {
    name: 'updateBudget',
    description: 'Update the monthly budget limit.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        newAmount: {
          type: Type.NUMBER,
          description: 'The new budget amount to set.',
        },
      },
      required: ['newAmount'],
    },
  },
];

export async function parseExpenseInput(text: string, availableCategories: string[] = []) {
  try {
    // 1. FAST PATH: Check our local intelligence (Supabase) first
    // This avoids LLM latency/cost for known items (e.g. "netflix", "coffee")
    const match = await mlService.findSimilarSamples(text);

    // If found with high confidence, use it for the category suggestion
    let suggestedCategory = match?.confidence && match.confidence > 0.9 ? match.category : null;

    const categoryList = availableCategories.length > 0
      ? availableCategories.join(', ')
      : "Food, Transport, Utilities, Entertainment, Groceries, Shopping, Other";

    // Dynamic Few-Shot Prompting
    const examples = await mlService.getFewShotExamples(5);
    const examplesText = examples.length > 0
      ? `\nHere are some examples of how to categorize similar inputs:\n${examples.map(e => `- Input: "${e.input}" -> Category: "${e.output}"`).join('\n')}`
      : "";

    // If we have a strong local match, we can hint it to Gemini or even skip Gemini for categorization 
    // (though we still need Gemini to parse the Amount/Date)
    const hintText = suggestedCategory ? `\nIMPORTANT: This input strongly resembles "${suggestedCategory}" category based on history.` : "";

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this expense note and return a JSON object with: amount (number), category (one of: ${categoryList}), description (string), date (YYYY-MM-DD), time (HH:MM), and isIncome (boolean). 
      ${examplesText}
      ${hintText}

      Current Date: ${new Date().toISOString().split('T')[0]}
      Current Time: ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
      
      Input: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING, description: "Format HH:MM" },
            isIncome: { type: Type.BOOLEAN }
          },
          required: ["amount", "category", "description", "date", "time", "isIncome"]
        }
      }
    });

    if (!response || !response.text) {
      console.warn("Gemini returned an empty response for parsing.");
      return null;
    }

    const parsed = JSON.parse(response.text);

    // Override if our local confidence was super high (Cache Authority)
    if (suggestedCategory && match && match.confidence > 0.95) {
      parsed.category = suggestedCategory;
    }

    // Collect training data (async)
    // We only collect if it wasn't a perfect cache hit to avoid duplicate data spam
    if (!match || match.confidence < 0.99) {
      mlService.collectTrainingSample({
        inputText: parsed.description || text,
        inputType: 'text',
        parsedCategory: parsed.category,
        modelVersion: (suggestedCategory && match && match.confidence > 0.95) ? 'local-cache-v1' : 'gemini-3-flash-v1',
        confidenceScore: suggestedCategory ? 0.95 : 0.85
      }).catch(err => console.log('ML collection skipped:', err.message));
    }

    const predictionSource = (suggestedCategory && match && match.confidence > 0.95) ? 'local-cache' : 'gemini';

    return {
      ...parsed,
      predictionSource
    };
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return null;
  }
}

export async function processAssistantMessage(
  message: string,
  history: any[],
  context: { expenses: any[], budget: number }
) {
  const model = "gemini-3-pro-preview";

  const response = await genAI.models.generateContent({
    model,
    contents: [
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: `You are EchoSpend AI, a helpful financial assistant. 
      You have access to the user's current expenses and budget. 
      Today's date is ${new Date().toISOString().split('T')[0]}.
      Use tools to answer questions about spending or to update settings.`,
      tools: [{ functionDeclarations: FINANCIAL_FUNCTIONS }],
    },
  });

  return response;
}

export async function sendToolResponse(
  modelParts: any[],
  results: { id: string, name: string, result: any }[],
  originalMessage: string
) {
  // We must include the model turn EXACTLY as it was received (including thoughts)
  // to satisfy the thinking model's requirement for a thought signature.
  const response = await genAI.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      { role: 'user', parts: [{ text: originalMessage }] },
      {
        role: 'model',
        parts: modelParts
      },
      {
        role: 'user',
        parts: results.map(r => ({
          functionResponse: {
            name: r.name,
            id: r.id,
            response: { result: r.result }
          }
        }))
      }
    ],
    config: {
      tools: [{ functionDeclarations: FINANCIAL_FUNCTIONS }],
    }
  });

  return response;
}
