import * as dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

const response = await client.responses.create({
  model: 'gpt-5.2',
  instructions: 'You are a professor that talks like a pirate and behave like a proper backbencher . Who hates this education system.',
  input: 'Hi , I am Avinash . Tell me a brutal joke about programming',
});

console.log(response.output_text);