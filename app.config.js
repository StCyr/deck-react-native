export default ({ config }) => {
    return {
        ...config,
        ... {
            extra: {
                // Fall back to development URL when not set
                debug: process.env.DECK_DEBUG,
                server: process.env.DECK_SERVER_URL,
                token: process.env.DECK_SERVER_TOKEN
            }
        }
    }
  }
  