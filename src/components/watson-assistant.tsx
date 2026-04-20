import { useEffect } from "react"

declare global {
  interface Window {
    tdbWatsonLoaded?: boolean
    watsonAssistantChatOptions?: {
      integrationID: string
      region: string
      serviceInstanceID: string
      clientVersion?: string
      namespace?: string
      onLoad: (instance: { render: () => Promise<void> }) => Promise<void>
    }
  }
}

const WATSON_NAMESPACE = "tdb-admin-chat"

export function WatsonAssistant() {
  useEffect(() => {
    if (window.tdbWatsonLoaded) {
      return
    }

    window.tdbWatsonLoaded = true
    window.watsonAssistantChatOptions = {
      integrationID: "bd895952-3d57-499f-b61f-d5be8403c01b",
      region: "us-south",
      serviceInstanceID: "3f90c1ee-2bff-42ce-a52c-c913159d6f24",
      namespace: WATSON_NAMESPACE,
      onLoad: async (instance) => {
        await instance.render()
      },
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-watson-assistant="tdb-admin-chat"]',
    )

    if (existingScript) {
      return
    }

    const script = document.createElement("script")
    script.src =
      "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
      (window.watsonAssistantChatOptions.clientVersion || "latest") +
      "/WatsonAssistantChatEntry.js"
    script.async = true
    script.dataset.watsonAssistant = WATSON_NAMESPACE
    document.head.appendChild(script)
  }, [])

  return null
}
