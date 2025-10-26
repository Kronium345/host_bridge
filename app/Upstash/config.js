import { Client as WorkflowClient } from '@upstash/workflow';

// import { QSTASH_URL, QSTASH_TOKEN } from './env.js';

export const workflowClient = new WorkflowClient({
    baseUrl: process.env.QSTASH_URL,
    token: process.env.QSTASH_TOKEN,
});
