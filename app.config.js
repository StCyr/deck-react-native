export default ({ config }) => {
    return {
        ...config,
        ... {
            extra: {
                // Fall back to development URL when not set                 
                debug: process.env.DECK_DEBUG,          // eslint-disable-line no-undef 
                server: process.env.DECK_SERVER_URL,    // eslint-disable-line no-undef 
                token: process.env.DECK_SERVER_TOKEN    // eslint-disable-line no-undef 
            }
        }
    }
  }
  