Objective: To implement an AI chatbot on the BLI Darwin configurator webpage to assist with sales-people’s experience on building a configuration that suits a client’s needs. 

Project Configured with React+Vite
Current Tech Stack:
JavaScript
CSS
HTML

Project Accessible at (Access Required): https://github.com/dustinstarksharp/chatbot

This project is currently into a few files with different roles:
•	App.jsx – This is the page that hosts everything that happens. It holds the window with the chat and receives the response from the API.
•	App.css – Configures the appearance of App.jsx
•	Chat-bubble.jsx – This file holds basic logic for bubbles in the chat and how appearance is selected
•	Chat-bubble.css – This file styles the chat bubbles. It includes how the user bubbles and AI bubbles look, as well as any animations that the bubbles might need.
•	Api-response-reader.js – This file interprets the response from the AI and clears all tags and applies formatting to the response. This way the AI’s response will display clearly in the chat.
•	Server.cjs – This file is responsible for communicating with the API. It is run independently of the application and forwards the API response to App.jsx

To run this application:
1.	Open a terminal and using the cd command, enter the base directory folder. You will be able to see file such as public, src, server.cjs and more.
2.	Enter “npm run dev”. This will begin running the page.
3.	Open a second terminal, and use the cd command to enter the base directory again.
4.	Enter “node server.cjs”. This will create the bridge from the application to the API
5.	Use the chatbot


Finished ToDos (3/5/2026):
•	Create a base webpage
•	Create a text box to input text
•	Create a chat area to store text
•	Create a chat bubble
•	Connect the text box to the text area and store them in chat bubbles
•	Connect the API to the application

ToDos to be completed (3/5/2026):
	We do not need BLI for:
•	Implement bot history so chatbot remembers the most recent chat
•	Implement exportable reports that users may use as proposals
•	Refactor code into modular pieces to increase readability 
•	Refine looks of chat interface

We do need BLI for:
•	Implement buttons on configured MFP that tell the AI what each piece does
•	
