import { useEffect } from "react"

declare global {
  interface Window {
    watsonAssistantChatOptions: {
      integrationID: string
      region: string
      serviceInstanceID: string
      clientVersion?: string
      onLoad: (instance: { render: () => Promise<void> }) => Promise<void>
    }
  }
}

export function WatsonAssistant() {
  useEffect(() => {
    // Configuração do Watson Assistant
    window.watsonAssistantChatOptions = {
      integrationID: "bd895952-3d57-499f-b61f-d5be8403c01b",
      region: "us-south",
      serviceInstanceID: "3f90c1ee-2bff-42ce-a52c-c913159d6f24",
      onLoad: async (instance) => {
        await instance.render()
      },
    }

    // Carrega o script do Watson Assistant
    const script = document.createElement("script")
    script.src =
      "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
      (window.watsonAssistantChatOptions.clientVersion || "latest") +
      "/WatsonAssistantChatEntry.js"
    script.async = true
    document.head.appendChild(script)

    // Cleanup ao desmontar o componente
    return () => {
      const watsonScript = document.querySelector(
        'script[src*="WatsonAssistantChatEntry.js"]'
      )
      if (watsonScript) {
        watsonScript.remove()
      }
    }
  }, [])

  return null
}
