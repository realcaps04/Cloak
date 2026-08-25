export {}

declare const google: {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (response: { credential?: string }) => void
        use_fedcm_for_prompt?: boolean
        use_fedcm_for_button?: boolean
      }) => void
      prompt: () => void
      renderButton: (
        parent: HTMLElement,
        options: {
          theme?: string
          size?: string
          width?: number
          text?: string
          shape?: string
        },
      ) => void
    }
  }
}

declare global {
  interface Window {
    google?: typeof google
  }
}
