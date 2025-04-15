# Building a Conversational AI Avatar with Azure Speech & OpenAI

## Introduction

In this article, you'll learn how to build a conversational AI avatar using Azure Speech and OpenAI. This project combines Azure's Speech Service with OpenAI's language models to create an interactive, voice-enabled digital assistant. It uses WebRTC for real-time video streaming, allowing users to interact with an avatar that understands and responds to spoken language. You'll be guided through setting up Azure services, building a React frontend, and integrating speech recognition and text-to-speech capabilities.

### Technologies Used
- **Azure Speech Service**: Enables speech-to-text, text-to-speech capabilities, and avatar services for creating interactive digital assistants.
- **OpenAI**: Provides conversational intelligence for engaging dialogue.
- **React**: Used to create a responsive and interactive frontend.

## The Rise of Conversational AI Avatars

- **Current Landscape of AI Avatars**:
  - AI avatars are increasingly being used across industries such as customer service, education, and entertainment. Technological advancements have made them more realistic and interactive, enhancing user experiences.

- **How Digital Humans are Transforming User Interactions**:
  - AI avatars provide personalized and engaging interactions, improving user experiences. They are successfully implemented in various real-world applications, offering examples of their transformative potential.

- **Advantages of Visual and Voice-Enabled AI Assistants**:
  - Combining visual and voice capabilities in AI assistants improves accessibility and user engagement. AI avatars can bridge communication gaps and provide support in multiple languages.
  - For example in customer service, AI avatars can offer 24/7 support, handling repetitive queries with consistent, human-like responses, which boosts satisfaction and reduces support costs.

## Project Overview

- **Architecture Diagram**:
  - [IMAGE: Architecture diagram showing the connection between Frontend React application, WebRTC, Azure STT, Azure OpenAI Service, Azure TTS + Avatar, and Azure Cognitive Search]
  - The diagram illustrates how different components interact:
    - Frontend React application connects with WebRTC for audio/video streaming
    - WebRTC connects to Azure STT (Speech-to-Text) service
    - Azure STT feeds into Azure OpenAI Service
    - Azure OpenAI Service connects to both Azure TTS + Avatar and optional Azure Cognitive Search integration
    - The Azure TTS + Avatar service streams audio and video through the Web RTC connection to the frontend

## Prerequisites

- **Azure Account Setup**:
  - An active Azure subscription (you can create a free account at [Azure Portal](https://portal.azure.com))
  - Sufficient permissions to create and manage resources

- **Required API Keys and Resources**:
  - Azure Speech Service resource (for speech recognition, text-to-speech, and avatar functionality)
  - Azure OpenAI Service resource with a deployed model like GPT-3.5 or GPT-4
  - Optional: Azure Cognitive Search resource

- **Development Environment Setup**:
  - Node.js (version 18 or higher) and npm
  - Git for version control
  - A code editor (VS Code recommended)
  - Basic understanding of React and JavaScript

- **Repository Setup**:
  - Clone the project repository:
    ```bash
    git clone https://github.com/yourusername/azure-chatbot.git
    cd azure-chatbot
    ```
  - Install dependencies:
    ```bash
    npm install
    ```
  - The repository contains all the necessary code, which we'll be explaining in the following sections.

## Setting Up Azure Services

- **Creating an Azure Speech Resource**:
  1. Navigate to the [Azure Portal](https://portal.azure.com) and sign in with your account
  2. Click on "Create a resource" and search for "Speech"
  3. Select "Speech" from the results and click "Create"
  4. Fill in the required details:
     - Subscription: Select your Azure subscription
     - Resource Group: Create a new one or select an existing group
     - Region: Choose a region that supports the avatar feature (e.g., West US 2)
     - Name: Enter a unique name for your resource
     - Pricing tier: Select "Standard S0" (required for avatar functionality)
  5. Click "Review + create" and then "Create" to deploy the resource
  6. Once deployment is complete, go to your resource and make note of the:
     - Key (found under "Keys and Endpoint")
     - Region
     - Endpoint

- **Setting Up OpenAI Service in Azure**:
  1. Return to the Azure Portal home and click "Create a resource"
  2. Search for "Azure OpenAI" and select it from the results
  3. Click "Create" and fill in the required details:
     - Subscription: Select your Azure subscription
     - Resource Group: Use the same one as your Speech resource
     - Region: Select an available region for Azure OpenAI
     - Name: Enter a unique name for your resource
     - Pricing tier: Standard
  4. Click "Review + create" and then "Create" to deploy the resource
  5. Once deployment is complete, navigate to your Azure OpenAI resource
  6. Click on "Go to Azure OpenAI Studio" to open the studio
  7. In the Azure OpenAI Studio:
     - Go to "Deployments" and click "Create new deployment"
     - Select a model (e.g., GPT-3.5 Turbo or GPT-4)
     - Name your deployment
     - Click "Create"
  8. Make note of your:
     - Endpoint
     - API Key
     - Deployment name

- **Optional: Configuring Azure Cognitive Search for Knowledge Bases**:
  1. In the Azure Portal, click "Create a resource" and search for "Cognitive Search"
  2. Select "Azure Cognitive Search" and click "Create"
  3. Fill in the required details:
     - Subscription: Select your Azure subscription
     - Resource Group: Use the same one as your other resources
     - Service name: Enter a unique name for your search service
     - Location: Choose a region close to your other resources
     - Pricing tier: Standard (minimum for production use)
  4. Click "Review + create" and then "Create" to deploy the resource
  5. Once deployment is complete, navigate to your search resource
  6. Under "Settings", find your:
     - Endpoint
     - Admin API key
  7. Create an index that will store your knowledge base documents

## React Frontend

- **Project Structure**:
  The project follows a standard React application structure with a few key directories:
  
  ```
  src/
  ├── components/     # UI components like ChatInterface and Configuration
  ├── services/       # Service classes like AzureSpeechService
  ├── styles/         # Global style definitions
  ├── App.js          # Main application component
  └── index.js        # Entry point
  ```

- **Key Components Overview**:

  1. **App.js** - Main application state management:
     ```jsx
     // Main state management for the application
     function App() {
       const [sessionActive, setSessionActive] = useState(false);
       const [config, setConfig] = useState({
         region: 'westus2',
         apiKey: '',
         // Other configuration values...
       });
       
       return (
         <>
           <GlobalStyle />
           <AppContainer>
             <Header>
               <h1>Azure AI Talking Avatar Chat</h1>
             </Header>
             
             {/* Conditionally render Configuration or ChatInterface */}
             {!sessionActive ? (
               <Configuration 
                 config={config} 
                 setConfig={setConfig} 
                 startSession={() => setSessionActive(true)} 
               />
             ) : (
               <ChatInterface 
                 config={config} 
                 endSession={() => setSessionActive(false)} 
               />
             )}
           </AppContainer>
         </>
       );
     }
     ```
     
     The App component manages the main application state, including the configuration settings and whether a chat session is active. It conditionally renders either the Configuration component (for setup) or the ChatInterface component (for the actual chat).

  2. **Configuration.js** - Key setup patterns:
     ```jsx
     // Tab management for organized configuration
     const [activeTab, setActiveTab] = useState(TABS.SPEECH);
     
     // Handle form input changes
     const handleChange = (e) => {
       const { name, value, type, checked } = e.target;
       setConfig({
         ...config,
         [name]: type === 'checkbox' ? checked : value
       });
     };
     
     // Validate configuration before starting
     const handleStartSession = () => {
       if (!config.apiKey) {
         alert('Please enter your Azure Speech Service API key');
         return;
       }
       // Other validations...
       startSession();
     };
     ```
     
     The Configuration component provides a tabbed interface for setting up various aspects of the application. It handles form inputs and validates the configuration before starting a chat session.

  3. **ChatInterface.js** - Core interaction features:
     ```jsx
     // Initialize the speech service
     useEffect(() => {
       speechService.current = new AzureSpeechService();
       connectToAvatar();
       return () => {
         if (speechService.current) {
           speechService.current.disconnectAvatar();
         }
       };
     }, []);
     
     // Send a message to the avatar
     const handleSendMessage = async () => {
       if (!inputText.trim()) return;
       
       const userMessage = { role: 'user', content: inputText };
       setMessages([...messages, userMessage]);
       setInputText('');
       
       try {
         await speechService.current.handleUserQuery(
           userMessage.content,
           config,
           (response) => updateMessageHistory(response),
           () => {} // Speech start callback
         );
       } catch (error) {
         console.error('Error processing message:', error);
         setMessages(prev => [...prev, { 
           role: 'assistant', 
           content: `Error: ${error.message}. Please try again.` 
         }]);
       }
     };
     
     // Toggle microphone for speech input
     const toggleMicrophone = async () => {
       if (isMicActive) {
         await speechService.current.stopMicrophone();
         setIsMicActive(false);
       } else {
         await speechService.current.startMicrophone((text) => {
           setInputText(text);
           if (config.continuousConversation && text.trim()) {
             // Auto-send in continuous mode
           }
         });
         setIsMicActive(true);
       }
     };
     ```
     
     The ChatInterface component manages the real-time chat interaction, including sending messages, receiving responses, and controlling the microphone for speech input.

- **Key Service Overview**:

  1. **AzureSpeechService.js** - Core integration points:
     ```jsx
     // Connect to the avatar service
     async connectAvatar(config, onStatusChange, onVideoConnected, onSubtitleChange) {
       // Set up Speech Synthesis config
       const speechSynthesisConfig = this.SpeechSDK.SpeechConfig.fromSubscription(config.apiKey, config.region);
       
       // Configure avatar
       const avatarConfig = new this.SpeechSDK.AvatarConfig(
         config.avatarCharacter, 
         config.avatarStyle
       );
       this.avatarSynthesizer = new this.SpeechSDK.AvatarSynthesizer(
         speechSynthesisConfig, 
         avatarConfig
       );
       
       // Set up speech recognition
       const speechRecognitionConfig = // Configuration code
       
       // Get WebRTC token and set up connection
       // ...
     }
     
     // Process user queries through Azure OpenAI
     async handleUserQuery(userQuery, config, onResponseUpdate, onSpeechStart) {
       this.messages.push({ role: "user", content: userQuery });
       
       // Call Azure OpenAI
       // Process streaming response
       // Speak sentences as they complete
     }
     ```
     
     The AzureSpeechService class handles all interactions with Azure services, including setting up speech recognition, text-to-speech, avatar synthesis, and OpenAI integration.

- **UI/UX Considerations for Chatbot Interfaces**:
  1. **Visual Feedback**: Provide clear visual cues when the system is listening, processing, or speaking
  2. **Responsive Design**: Use a layout that adapts to different screen sizes
  3. **Accessibility**: Support both text and voice input for different user needs
  4. **Error Handling**: Implement friendly error messages for common issues
  5. **Language Support**: Allow users to interact in multiple languages

This streamlined approach lets you focus on understanding the key concepts without getting lost in implementation details. The full code is available in the repository for reference.

## Step 3: Implementing Speech Recognition

- **How Speech-to-Text Works**:
  Speech-to-text (STT) technology converts human speech into written text through a series of steps:
   
  1. **Audio Capture**: The microphone input is digitized
  2. **Pre-processing**: The audio signal is cleaned and normalized
  3. **Feature Extraction**: Key audio features are identified
  4. **Acoustic and Language Modeling**: Features are matched to phonemes, then to words
  5. **Transcription**: The final text output is generated

- **Configuring the Azure Speech SDK**:
  
  ```javascript
  // Configure speech recognition with multi-language support
  const speechRecognitionConfig = this.SpeechSDK.SpeechConfig.fromEndpoint(
    new URL(`wss://${region}.stt.speech.microsoft.com/speech/universal/v2`), 
    apiKey
  );
  
  // Enable continuous language identification
  speechRecognitionConfig.setProperty(
    this.SpeechSDK.PropertyId.SpeechServiceConnection_LanguageIdMode, 
    "Continuous"
  );
  
  // Set up language detection with multiple languages
  const sttLocaleArray = sttLocales.split(',');
  const autoDetectSourceLanguageConfig = this.SpeechSDK.AutoDetectSourceLanguageConfig
    .fromLanguages(sttLocaleArray);
  
  // Create the speech recognizer with microphone input
  this.speechRecognizer = this.SpeechSDK.SpeechRecognizer.FromConfig(
    speechRecognitionConfig,
    autoDetectSourceLanguageConfig,
    this.SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
  );
  ```

  This code sets up the Azure Speech SDK to recognize speech in multiple languages. The `SpeechServiceConnection_LanguageIdMode` property enables continuous language identification, allowing the system to detect which language is being spoken without requiring explicit language selection.

- **Handling Recognition Events**:
  
  ```javascript
  // Set up the recognized event handler
  this.speechRecognizer.recognized = (s, e) => {
    if (e.result.reason === this.SpeechSDK.ResultReason.RecognizedSpeech) {
      const text = e.result.text;
      // Get the detected language
      const language = e.result.language;
      
      if (text.trim() !== '') {
        onRecognizedSpeech(text, language);
      }
    }
  };
  
  // Start continuous recognition
  this.speechRecognizer.startContinuousRecognitionAsync();
  ```

  The code above handles speech recognition events. When speech is successfully recognized, it extracts both the text and the detected language, then passes them to a callback function. Continuous recognition means the system keeps listening for speech input until explicitly stopped.

- **Implementing Microphone Controls in the UI**:
  
  ```javascript
  // Microphone toggle button in the ChatInterface component
  <ActionButton
    onClick={toggleMicrophone}
    disabled={!isConnected}
    color={isMicActive ? '#e74c3c' : '#4f85e5'}
  >
    {isMicActive ? <FiMicOff /> : <FiMic />}
  </ActionButton>
  
  // Toggle microphone function
  const toggleMicrophone = async () => {
    if (isMicActive) {
      await speechService.current.stopMicrophone();
      setIsMicActive(false);
    } else {
      await speechService.current.startMicrophone((text, language) => {
        setInputText(text);
        setDetectedLanguage(language || 'en-US');
        
        // Optional: Auto-send in continuous conversation mode
        if (config.continuousConversation && text.trim()) {
          handleSendMessage();
        }
      });
      setIsMicActive(true);
    }
  };
  ```

  This code implements a toggle button for the microphone. When active, recognized speech is displayed in the text input field. The UI also shows the detected language, providing feedback to the user. In continuous conversation mode, recognized speech can automatically trigger message sending.

- **Multi-Language Support Configuration**:
  
  ```javascript
  // User configuration for languages in the Configuration component
  <FormGroup>
    <Label htmlFor="sttLocales">Speech-to-Text Languages</Label>
    <Input 
      type="text" 
      id="sttLocales" 
      name="sttLocales" 
      value={config.sttLocales} 
      onChange={handleChange} 
      placeholder="en-US,es-ES,fr-FR,de-DE,ja-JP,zh-CN"
    />
    <small>Comma-separated list of language codes</small>
  </FormGroup>
  ```

  This allows users to specify which languages they want the system to support. The default configuration includes multiple languages like English, Spanish, French, German, Japanese, and Chinese, making the application accessible to a global audience.

By implementing these features, your application can effectively understand spoken input in multiple languages, significantly enhancing the user experience and accessibility of your AI avatar chat.

## Step 4: Creating the Talking Avatar

- **Available Avatar Options**:
  Azure's Talking Avatar service provides several pre-built avatar characters and styles:
  
  ```javascript
  // Avatar character options in the Configuration component
  <Select 
    id="avatarCharacter" 
    name="avatarCharacter" 
    value={config.avatarCharacter} 
    onChange={handleChange}
  >
    <option value="lisa">Lisa</option>
    <option value="guy">Guy</option>
    <option value="sarah">Sarah</option>
    <option value="ryan">Ryan</option>
  </Select>
  
  // Avatar style options
  <Select 
    id="avatarStyle" 
    name="avatarStyle" 
    value={config.avatarStyle} 
    onChange={handleChange}
  >
    <option value="casual-sitting">Casual Sitting</option>
    <option value="professional-standing">Professional Standing</option>
    <option value="close-up">Close Up</option>
  </Select>
  ```
  
  These options allow you to select different avatar characters and presentation styles to best fit your application's needs and branding.

- **WebRTC Implementation for Video Streaming**:
  The avatar video is streamed to the client using WebRTC (Web Real-Time Communication):
  
  ```javascript
  // Set up WebRTC connection for avatar streaming
  setupWebRTC(iceServerUrl, iceServerUsername, iceServerCredential, onStatusChange, onVideoConnected) {
    // Create WebRTC peer connection with STUN/TURN server credentials
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{
        urls: [iceServerUrl],
        username: iceServerUsername,
        credential: iceServerCredential
      }]
    });
    
    // Handle incoming video track
    this.peerConnection.ontrack = (event) => {
      if (event.track.kind === 'video') {
        // Create video element for avatar
        let videoElement = document.createElement('video');
        videoElement.srcObject = event.streams[0];
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        
        // When video starts playing, update connection status
        videoElement.onplaying = () => {
          onStatusChange('connected');
          onVideoConnected(videoElement);
        };
        
        return videoElement;
      }
    };
    
    // Connect the avatar synthesizer to the WebRTC connection
    this.avatarSynthesizer.connectPeerConnection(this.peerConnection, ["video", "audio"]);
  }
  ```
  
  WebRTC enables real-time, low-latency streaming of the avatar's video and audio directly to the browser without requiring additional plugins.

- **Avatar Configuration and Initialization**:
  
  ```javascript
  // Initialize the avatar with Azure Speech Service
  const avatarConfig = new this.SpeechSDK.AvatarConfig(
    config.avatarCharacter,
    config.avatarStyle
  );
  
  // If using a custom avatar
  avatarConfig.customized = config.customizedAvatar;
  
  // Create the avatar synthesizer
  this.avatarSynthesizer = new this.SpeechSDK.AvatarSynthesizer(
    speechSynthesisConfig,
    avatarConfig
  );
  
  // Acquire WebRTC token from Azure service
  const tokenResponse = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`,
    { headers: { "Ocp-Apim-Subscription-Key": apiKey } }
  );
  
  const tokenData = await tokenResponse.json();
  ```
  
  This code initializes the avatar with the selected character and style. It then acquires a WebRTC token from Azure to establish the streaming connection.

- **Rendering the Avatar in the UI**:
  
  ```jsx
  // Video container component in ChatInterface.js
  <VideoContainer ref={videoContainerRef}>
    {/* Status indicator */}
    <StatusIndicator $connected={isConnected}>
      {isConnected ? 'Connected' : status}
    </StatusIndicator>
    
    {/* Subtitles overlay if enabled */}
    {showSubtitles && subtitlesText && (
      <Subtitles>{subtitlesText}</Subtitles>
    )}
  </VideoContainer>
  
  // Handle video connection
  const handleVideoConnected = (videoElement) => {
    if (videoContainerRef.current) {
      // Clear any existing video elements
      while (videoContainerRef.current.firstChild) {
        videoContainerRef.current.removeChild(videoContainerRef.current.firstChild);
      }
      
      // Append the new video element
      videoContainerRef.current.appendChild(videoElement);
    }
  };
  ```
  
  This code creates a container for the avatar video and handles appending the video element when the WebRTC connection is established. It also includes status indicators and optional subtitles overlay.

- **Handling Avatar Events**:
  
  ```javascript
  // Listen for avatar events
  this.avatarSynthesizer.avatarEventReceived = function (s, e) {
    console.log(`Avatar event received: ${e.description}`);
    
    // React to specific avatar events
    switch (e.description) {
      case 'VisemeReceived':
        // Lip sync event
        break;
      case 'BookmarkReached':
        // SSML bookmark reached
        break;
      case 'TalkingStarted':
        onTalkingStateChanged(true);
        break;
      case 'TalkingEnded':
        onTalkingStateChanged(false);
        break;
    }
  };
  ```
  
  The Azure Avatar service emits events during speech synthesis that allow you to synchronize your UI with the avatar's actions, such as when it starts or stops talking.

The avatar implementation creates a more engaging and human-like interaction with users. The animated facial expressions and synchronized lip movements with the speech make the conversation feel more natural and immersive compared to text-only or voice-only interfaces.

## Step 5: Text-to-Speech Integration

- **Voice Selection and Customization**:
  Azure Speech Service offers a wide range of neural voices in different languages and styles:
  
  ```javascript
  // Voice selection in Configuration component
  <Select 
    id="ttsVoice" 
    name="ttsVoice" 
    value={config.ttsVoice} 
    onChange={handleChange}
  >
    <option value="en-US-AvaMultilingualNeural">Ava (English, US)</option>
    <option value="en-US-AndrewMultilingualNeural">Andrew (English, US)</option>
    <option value="en-GB-SoniaNeural">Sonia (English, UK)</option>
    <option value="de-DE-KatjaNeural">Katja (German)</option>
    <option value="es-ES-ElviraNeural">Elvira (Spanish)</option>
    {/* Additional voices */}
  </Select>
  ```
  
  The multilingual neural voices provide natural-sounding speech with appropriate intonation and rhythm. You can also use custom voices if you've trained them in the Azure portal.

- **Speech Synthesis Markup Language (SSML)**:
  SSML allows fine-grained control over how text is spoken by the avatar:
  
  ```javascript
  // Prepare SSML for speech synthesis
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
                       xmlns:mstts="http://www.w3.org/2001/mstts" 
                       xml:lang="en-US">
    <voice name="${config.ttsVoice}">
      <mstts:silence type="Tailing" value="${endingSilenceMs}ms"/>
      ${this.htmlEncode(text)}
    </voice>
  </speak>`;
  
  // Send SSML to the avatar synthesizer
  this.avatarSynthesizer.speakSsmlAsync(
    ssml,
    (result) => {
      // Success callback
      if (result.reason === this.SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        this.isSpeaking = false;
        // Process next queued text if available
      }
    },
    (error) => {
      // Error callback
      console.error("Speech synthesis error:", error);
    }
  );
  ```
  
  SSML enables advanced features like adding pauses, emphasizing words, changing speaking rate, and controlling pronunciation.

- **Sentence-Level Processing for Natural Speech**:
  To make the avatar speak more naturally, it's best to process text by sentence:
  
  ```javascript
  // List of punctuation that marks sentence endings
  const sentenceLevelPunctuations = ['.', '?', '!', ':', ';', '。', '？', '！', '：', '；'];
  
  // Process streaming text from OpenAI
  if (json.choices && json.choices[0].delta.content) {
    const content = json.choices[0].delta.content;
    accumulatedResponse += content;
    currentSentence += content;
    
    // Update UI with accumulated response
    onResponseUpdate(accumulatedResponse);
    
    // Check if we've reached the end of a sentence
    const lastChar = content[content.length - 1];
    if (sentenceLevelPunctuations.includes(lastChar)) {
      if (currentSentence.trim() !== '') {
        // Speak the completed sentence
        if (onSpeechStart) onSpeechStart();
        this.speak(currentSentence);
        currentSentence = '';
      }
    }
  }
  ```
  
  By detecting sentence boundaries and speaking complete sentences, the avatar sounds more natural and the lip sync is more accurate.

- **Queue Management for Continuous Speech**:
  To handle multiple sentences without interruptions, use a queue system:
  
  ```javascript
  // Speak text using the avatar
  speak(text, endingSilenceMs = 0) {
    if (this.isSpeaking) {
      // Queue the text if already speaking
      this.spokenTextQueue.push(text);
      return false;
    }
    
    return this.speakNext(text, endingSilenceMs);
  }
  
  // Process the next item in the speech queue
  speakNext(text, endingSilenceMs = 0) {
    this.isSpeaking = true;
    
    // Speak the text with SSML
    // ...
    
    // In the success callback
    if (result.reason === this.SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
      this.isSpeaking = false;
      
      // Speak next queued text if available
      if (this.spokenTextQueue.length > 0) {
        this.speakNext(this.spokenTextQueue.shift());
      }
    }
  }
  ```
  
  This queue system ensures that multiple sentences are spoken in sequence without overlap, creating a more natural conversational flow.

- **Synchronizing Speech with Avatar Animations**:
  The Azure Avatar service automatically synchronizes lip movements with speech:
  
  ```javascript
  // Set up data channel for subtitles and sync information
  this.peerConnection.ondatachannel = (event) => {
    this.peerConnectionDataChannel = event.channel;
    this.peerConnectionDataChannel.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      
      // Update subtitles if enabled
      onSubtitleChange(data.message, data.type === "speak" && !this.isSpeaking);
      
      // Visual feedback based on message type
      if (data.type === "speak") {
        // Avatar is speaking
      } else if (data.type === "viseme") {
        // Specific lip position information
      }
    };
  };
  ```
  
  The service handles the complex task of synchronizing audio with visual lip movements (visemes), creating a realistic talking experience.

By implementing these text-to-speech techniques, your avatar can communicate through natural-sounding speech that is synchronized with realistic facial movements, significantly enhancing the user experience.

## Step 6: Adding OpenAI Integration

- **Conversation Flow Implementation**:
  Azure OpenAI is integrated to power the conversation intelligence of the avatar:
  
  ```javascript
  // Process user query through Azure OpenAI
  async handleUserQuery(userQuery, config, onResponseUpdate, onSpeechStart) {
    // Add user message to conversation history
    this.messages.push({
      role: "user",
      content: userQuery
    });
    
    // Prepare API request headers
    const headers = {
      "Content-Type": "application/json",
      "api-key": config.openaiApiKey
    };
    
    // Create request payload with conversation history
    const payload = {
      messages: this.messages,
      temperature: 0.7,
      max_tokens: 800,
      stream: true  // Enable streaming for faster responses
    };
    
    // API endpoint for Azure OpenAI
    const endpointUrl = `${config.openaiEndpoint}/openai/deployments/${config.openaiDeploymentName}/chat/completions?api-version=2023-05-15`;
    
    // Make the API request
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    // Process the streaming response
    // ... (code for handling the streamed response)
  }
  ```
  
  This code sends the conversation history to Azure OpenAI and processes the response. Using streaming mode allows the avatar to start speaking before the full response is received.

- **Token Management and Context Windows**:
  Managing conversation history is crucial to stay within token limits:
  
  ```javascript
  // Simple conversation history management
  function manageConversationHistory(messages, maxTokens = 4000) {
    let tokenCount = 0;
    let tokenEstimate = 0;
    
    // Rough token estimation (4 chars ≈ 1 token)
    for (const msg of messages) {
      tokenEstimate += Math.ceil(msg.content.length / 4) + 20; // +20 for role overhead
    }
    
    // If approaching token limit, remove oldest messages (keeping system prompt)
    if (tokenEstimate > maxTokens) {
      const systemMessage = messages.find(m => m.role === 'system');
      const nonSystemMessages = messages.filter(m => m.role !== 'system')
                                       .sort((a, b) => 
                                          messages.indexOf(a) - messages.indexOf(b));
      
      // Keep removing oldest messages until under token limit
      while (tokenEstimate > maxTokens * 0.8 && nonSystemMessages.length > 1) {
        const removed = nonSystemMessages.shift(); // Remove oldest
        tokenEstimate -= Math.ceil(removed.content.length / 4) + 20;
      }
      
      // Reconstruct messages array
      messages = systemMessage ? [systemMessage, ...nonSystemMessages] : nonSystemMessages;
    }
    
    return messages;
  }
  ```
  
  This helper function estimates token usage and removes older messages when approaching the model's context limit while preserving the system prompt.

- **System Prompts and Conversation History**:
  The system prompt defines the avatar's personality and behavior:
  
  ```javascript
  // Configuration for system prompt
  <FormGroup>
    <Label htmlFor="systemPrompt">System Prompt</Label>
    <textarea 
      id="systemPrompt" 
      name="systemPrompt" 
      value={config.systemPrompt} 
      onChange={handleChange} 
      placeholder="Instructions for the AI assistant"
      rows={4}
      style={{ width: '100%' }}
    />
  </FormGroup>
  
  // Initialize conversation with system prompt
  initMessages(systemPrompt) {
    this.messages = [{
      role: 'system',
      content: systemPrompt
    }];
    this.messageInitiated = true;
  }
  ```
  
  The system prompt is the first message in the conversation history and sets the tone, personality, and constraints for the avatar's responses.

- **Streaming Response Processing**:
  Processing the streaming response allows the avatar to start speaking early:
  
  ```javascript
  // Process the streaming response
  const reader = response.body.getReader();
  let accumulatedResponse = '';
  let currentSentence = '';
  
  // Function to read chunks of the stream
  const read = async (previousChunkString = '') => {
    const { value, done } = await reader.read();
    
    if (done) {
      // End of stream, finalize response
      this.messages.push({
        role: "assistant",
        content: accumulatedResponse
      });
      return;
    }
    
    // Decode the chunk and combine with any previous incomplete chunk
    const chunkString = previousChunkString + new TextDecoder().decode(value);
    let jsonLines = chunkString.split('\n').filter(line => line.trim() !== '');
    
    let incompleteLine = '';
    
    // Process each line in the chunk
    for (const jsonLine of jsonLines) {
      try {
        // Handle "data: " prefix in streaming response
        const jsonStr = jsonLine.startsWith('data: ') ? jsonLine.substring(6) : jsonLine;
        
        // Skip "[DONE]" marker
        if (jsonStr.trim() === '[DONE]') continue;
        
        const json = JSON.parse(jsonStr);
        
        // Extract content from the delta
        if (json.choices && json.choices[0].delta.content) {
          const content = json.choices[0].delta.content;
          accumulatedResponse += content;
          currentSentence += content;
          
          // Update UI with current response
          onResponseUpdate(accumulatedResponse);
          
          // Check if we've reached the end of a sentence
          const lastChar = content[content.length - 1];
          if (sentenceLevelPunctuations.includes(lastChar)) {
            if (currentSentence.trim() !== '') {
              // Speak the completed sentence
              if (onSpeechStart) onSpeechStart();
              this.speak(currentSentence);
              currentSentence = '';
            }
          }
        }
      } catch (error) {
        // This could be an incomplete JSON chunk
        incompleteLine = jsonLine;
      }
    }
    
    // Continue reading the stream
    await read(incompleteLine);
  };
  
  await read();
  
  // Speak any remaining text that didn't end with punctuation
  if (currentSentence.trim() !== '') {
    if (onSpeechStart) onSpeechStart();
    this.speak(currentSentence);
  }
  ```
  
  This streaming implementation allows the avatar to begin speaking as soon as complete sentences are available, rather than waiting for the entire response. This creates a more natural, conversational experience.

By integrating Azure OpenAI, your avatar gains conversational intelligence, allowing it to understand context, remember previous interactions, and provide relevant and coherent responses to user queries.

## Step 7: Adding "On Your Data" Capabilities

- **Azure AI Search Integration**:
  Add document grounding capabilities by connecting to an Azure AI Search index:
  
  ```javascript
  // Azure AI Search Query function
  async searchDocuments(query, config) {
    // Prepare API request headers
    const headers = {
      "Content-Type": "application/json",
      "api-key": config.aiSearchApiKey
    };
    
    // Create semantic search query payload
    const payload = {
      search: query,
      queryType: "semantic",
      semanticConfiguration: "default",
      top: 5,
      captions: {
        highlightEnabled: true
      },
      queryLanguage: "en-us"
    };
    
    // Make the request to Azure AI Search
    const response = await fetch(
      `${config.aiSearchEndpoint}/indexes/${config.aiSearchIndexName}/docs/search?api-version=2023-07-01-Preview`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
      }
    );
    
    const data = await response.json();
    return data.value || [];
  }
  ```
  
  This function performs semantic search against your Azure AI Search index, retrieving the most relevant documents for the user's query.

- **RAG (Retrieval-Augmented Generation) Implementation**:
  Enhance the avatar's responses with knowledge from your documents:
  
  ```javascript
  // Enhanced handleUserQuery with RAG pattern
  async handleUserQuery(userQuery, config, onResponseUpdate, onSpeechStart) {
    // First, search relevant documents
    let contextualInfo = '';
    if (config.useRAG) {
      const searchResults = await this.searchDocuments(userQuery, config);
      
      if (searchResults.length > 0) {
        // Format search results as context for the AI
        contextualInfo = "Relevant information from documents:\n\n";
        searchResults.forEach((result, i) => {
          // Add document title and content
          contextualInfo += `[Document ${i+1}]: ${result.title || 'Untitled'}\n`;
          contextualInfo += `${result.content || result.caption.text}\n\n`;
        });
      }
    }
    
    // Add user message to conversation history
    this.messages.push({
      role: "user",
      content: contextualInfo ? 
        `${userQuery}\n\nHere is some context that might help with the answer:\n${contextualInfo}` : 
        userQuery
    });
    
    // Rest of the code for OpenAI API call remains the same...
  }
  ```
  
  This implementation uses the RAG pattern: first retrieving relevant documents then providing them as context to the AI model before generating a response.

- **Document Context Visualization**:
  Allow users to see which documents are being referenced:
  
  ```jsx
  // Component to display retrieved documents
  const RetrievedDocsPanel = ({ documents, isLoading }) => {
    if (isLoading) {
      return <div className="retrieved-docs-panel">Searching documents...</div>;
    }
    
    if (!documents || documents.length === 0) {
      return <div className="retrieved-docs-panel">No relevant documents found</div>;
    }
    
    return (
      <div className="retrieved-docs-panel">
        <h3>References</h3>
        {documents.map((doc, index) => (
          <div key={index} className="doc-card">
            <h4>{doc.title || `Document ${index + 1}`}</h4>
            <p dangerouslySetInnerHTML={{ 
              __html: doc.caption?.highlights || doc.caption?.text || doc.content?.substring(0, 200) + "..." 
            }} />
            {doc.metadata?.source && (
              <a href={doc.metadata.source} target="_blank" rel="noopener noreferrer">
                View source
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };
  ```
  
  This component displays the documents being used as context, highlighting relevant sections and providing source links when available.

- **Toggle for RAG Capabilities**:
  Allow users to switch between general knowledge and document-specific responses:
  
  ```jsx
  // Toggle for RAG feature
  <FormGroup className="form-check form-switch">
    <Input
      type="checkbox"
      className="form-check-input"
      id="useRAG"
      name="useRAG"
      checked={config.useRAG}
      onChange={(e) => setConfig({...config, useRAG: e.target.checked})}
    />
    <Label className="form-check-label" htmlFor="useRAG">
      Use Document Knowledge
    </Label>
  </FormGroup>
  ```
  
  This simple toggle allows users to switch the avatar between using only its general knowledge and augmenting responses with information from the provided documents.

By implementing "On Your Data" capabilities, your avatar can provide answers grounded in your specific documents, knowledge base, or business information, making it more useful for specialized tasks and domains. This creates a more powerful and contextually relevant experience for users.

## Testing and Deployment

- **Local Testing**:
  Before deploying, thoroughly test your application locally:
  
  ```bash
  # Start the development server
  npm run dev
  
  # Run in development mode with live reloading
  npm run dev -- --open
  ```
  
  Test all features, including:
  - Avatar rendering and animations
  - Text-to-speech functionality
  - Speech-to-text recognition
  - Azure OpenAI integration
  - RAG capabilities with document search

- **Performance Optimization**:
  Improve loading times and responsiveness:
  
  ```javascript
  // Lazy loading avatar models
  const AvatarComponent = React.lazy(() => import('./components/Avatar'));
  
  // In your main component
  <Suspense fallback={<div>Loading avatar...</div>}>
    <AvatarComponent />
  </Suspense>
  ```
  
  Additionally, implement caching for responses and document search results to reduce latency.

- **Deployment Options**:
  
  1. **Azure Static Web Apps**:
     ```bash
     # Install the Azure Static Web Apps CLI
     npm install -g @azure/static-web-apps-cli
     
     # Build your application
     npm run build
     
     # Deploy using the CLI
     swa deploy ./dist --api-location ./api
     ```
  
  2. **Azure App Service**:
     ```bash
     # Install the Azure CLI
     npm install -g azure-cli
     
     # Login to Azure
     az login
     
     # Create an App Service plan
     az appservice plan create --name myAppServicePlan --resource-group myResourceGroup --sku B1
     
     # Create a web app
     az webapp create --name myAvatarChatbot --resource-group myResourceGroup --plan myAppServicePlan
     
     # Deploy the application
     az webapp deployment source config-zip --resource-group myResourceGroup --name myAvatarChatbot --src ./dist.zip
     ```

- **Security Considerations**:
  
  Implement these security best practices:
  
  ```javascript
  // Store sensitive configuration in environment variables
  const config = {
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiEndpoint: process.env.OPENAI_ENDPOINT,
    aiSearchApiKey: process.env.AI_SEARCH_API_KEY,
    // Other config values...
  };
  
  // Configure CORS for API endpoints
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS.split(','),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  ```
  
  Additionally, implement rate limiting and user authentication for production deployments.

- **Monitoring and Analytics**:
  
  Track usage and performance with Application Insights:
  
  ```javascript
  // Initialize Application Insights
  import { ApplicationInsights } from '@microsoft/applicationinsights-web';
  
  const appInsights = new ApplicationInsights({
    config: {
      connectionString: process.env.APPINSIGHTS_CONNECTION_STRING,
      /* ...Other Application Insights configurations... */
    }
  });
  
  appInsights.loadAppInsights();
  
  // Track custom events
  function trackAvatarInteraction(queryType, responseTime) {
    appInsights.trackEvent({
      name: "AvatarInteraction",
      properties: {
        queryType: queryType,
        responseTime: responseTime
      }
    });
  }
  ```
  
  This helps you gather insights on user engagement, common queries, and application performance.

By following these testing and deployment steps, you can ensure your avatar chatbot application is robust, secure, and performs well in production environments. Regular monitoring will help you identify opportunities for improvement and optimization based on actual usage patterns.

## Advanced Customization Options
- Modifying the avatar's appearance and behaviors
- Creating custom voice profiles
- Extending the chat functionality

## Performance Optimization
- Reducing latency in conversation
- Memory management considerations
- Bandwidth optimization strategies

## Security and Privacy Considerations
- Handling sensitive user data
- API key management
- User consent for microphone access

## Future Enhancements
- Multi-modal capabilities
- Local model deployment options
- Integration with additional Azure services

## Conclusion
- Recap of what we've built
- Potential applications
- Resources for further learning

## Resources
- GitHub repository link
- Azure documentation references
- Community support channels 