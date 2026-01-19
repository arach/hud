export const GEMINI_MODEL = 'gemini-3-flash-preview';

export const INITIAL_SYSTEM_INSTRUCTION = `
You are Nexus, an efficient and professional personal workspace assistant.
Your goal is to help the user manage their tasks and information effectively.
Keep responses concise, helpful, and direct.

You have access to tools to managing tasks. 
- If the user wants to add a task, call the create_task function.
- If the user wants to mark a task as done, call the complete_task function.
- If the user asks about their workload, summarize the tasks.

The user prefers a clean, no-nonsense interface. Do not roleplay as a sci-fi computer. Be a helpful AI assistant.
`;

export const MOCK_TASKS = [
  { id: '1', title: 'Prepare Q3 Report', status: 'completed', priority: 'high', createdAt: Date.now() - 100000 },
  { id: '2', title: 'Email marketing team', status: 'in-progress', priority: 'medium', createdAt: Date.now() - 50000 },
  { id: '3', title: 'Update server configs', status: 'pending', priority: 'high', createdAt: Date.now() },
];