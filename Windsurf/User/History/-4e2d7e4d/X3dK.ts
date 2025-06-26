// Load environment variables first
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });


/*

* Current Goal - 
 * make llm handle every obstacle while playwright working.

Todo 1. Look out the controller.ts, it needs some changes
Todo 2. The snapshot should be sent everytime after each execution

*/

import MCP_Client from "./mcp_client.ts";
import Controller2 from "./playwright_controller/controller2.ts";

let options = {
  name: "client_1",
  port: 8080,
  version: "v.1.0.0",
};

const new_client = new MCP_Client(options);

async function main() {
  // await new_client.Connect_Server();
  // await new_client.get_tools();
  // const new_client = new LLM_Client({
  //   model: "gemma-3-27b-it",
  //   apiKey: process.env.GOOGLE_API_KEY,
  //   config: { responseMimeType: "application/json" },
  // });
  // new_client.RunLLM({
  //   model: "gemma3",
  //   outputType: { responseMimeType: "text/plain" },
  // });
  // await Controller2(false);
}

// main();

await Controller2();
