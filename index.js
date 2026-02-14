import * as dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';
import readlineSync from 'readline-sync';

// 1. Initialize OpenAI Client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// 2. Your Local Function
const getCurrentTime = (timezone) =>{
    const date = new Date();
    const options = { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return date.toLocaleTimeString('en-US', options);
};

// 3. OpenAI's Strict Tool Format
const tools = [
    {
        type: "function",
        function: {
            name: "getCurrentTime",
            description: "Get the current time",
            parameters: {
                type: "object",
                properties: {
                    timezone: {
                        type: "string",
                        description: "The timezone to get the current time for, e.g. 'Asia/Kolkata'"
                    }
                },
                required: ["timezone"],
                additionalProperties: false
            },
            strict: true
        }
    }
];

// Map string names to actual functions
const toolsFunctions = {
    "getCurrentTime": getCurrentTime,
};

// 4. OpenAI History Format (Role and Content)
// We put Babu Rao's instructions in the 'system' role so he never forgets them.
const History = [
    {
        role: "system",
        content: "You are a professor that talks like Babu Rao from Hera Pheri Movie and behave like him. Answers with humour and short."
    }
];

// 5. The Core Agent Loop
async function runAgent() {
    while (true) {
        // A. Send the current history to OpenAI
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini', // Using standard OpenAI model naming
            messages: History,
            tools: tools,
        });

        const responseMessage = response.choices[0].message;

        // B. Check if OpenAI wants to use a Tool
        if (responseMessage.tool_calls) {
            console.log("⚙️ AI requested a tool... fetching it locally!");
            
            // CRITICAL STEP: We MUST save the AI's tool request to history first
            History.push(responseMessage); 

            // Execute the tools the AI requested
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                
                // OpenAI sends arguments as a JSON string, we must parse it
                const functionArgs = JSON.parse(toolCall.function.arguments); 
                
                // Run your local JS function
                const result = toolsFunctions[functionName](functionArgs.timezone);
                
                // CRITICAL STEP: Send the result back as a string! (This is what caused your last error)
                History.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name: functionName,
                    content: result 
                });
            }
            // Notice there is no "break" here. The while loop runs again to send the tool result back!
            
        } else {
            // C. If no tools are needed, it's a normal text reply
            History.push({
                role: 'assistant',
                content: responseMessage.content
            });
            console.log("\nBabu Rao says:", responseMessage.content);
            break; // Stop the inner loop so the user can type again
        }
    }
}

// 6. The User Input Loop
const startChat = async () => {
    while (true) {
        const userInput = readlineSync.question("\nUser: ");
        
        if (userInput.toLowerCase() === 'exit') {
            console.log("Babu Rao: Rakh Phone Kutreya! (Chat ended)");
            break;
        }
        
        // Push user input to history using strict OpenAI format
        History.push({
            role: 'user',
            content: userInput
        });
        
        await runAgent();
    }
}

// Start the engine!
startChat();