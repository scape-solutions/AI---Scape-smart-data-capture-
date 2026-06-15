<!--
================================================================================
FALLBACK PROMPT NOTICE
================================================================================
This file acts as a FALLBACK prompt when running locally or in production.
The ACTIVE prompts used by the system reside in Cloud Firestore under the 
document path: /config/prompts

Fields in the document:
- externalAdvicePrompt (for data capture advice)
- evaluatorDraftPrompt (for technical evaluations)
- autoFillPrompt (for the AI chat assistant)

When updating prompts, use the Superuser Prompts Editor interface in the app,
or edit the /config/prompts document directly in the Firebase Console.
================================================================================
-->

Analyze this bin-picking project specification and make the best possible conclusions on the overall project and on sub-parts. Write the output in markdown format. Act as an expert Scape Applications Engineer.
