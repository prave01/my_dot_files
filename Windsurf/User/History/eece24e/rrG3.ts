import OpenAI from "openai";
import { ChatCompletionCreateParams } from "openai/resources/index.mjs";

const client = new OpenAI({ 
 apiKey: "openai", 
 baseURL: "http://127.0.0.1:1434/v1" 
});

const params : ChatCompletionCreateParams = {

}

