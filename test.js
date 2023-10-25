import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage } from "langchain/schema";
import dotenv from "dotenv";
dotenv.config();

const chat = new ChatOpenAI({ temperature: 0 });

const response = await chat.call([
    new HumanChatMessage(
      "Translate this sentence from English to French. I love programming."
    ),
  ]);
  
  console.log(response);