// ZEROLLUP_CONFIG_BASE_URL = /

export interface Config {
    /**
     * Some property description
     */
    some: string

    /**
     * Base url to current configuration
     */
    configBaseUrl: string

    /**
     * Base url to images, fonts, etc
     */
    assetsUrl: string

    /**
     * Url-friendly package name
     */
    id: string
}

const configBaseUrl = 'ZEROLLUP_CONFIG_BASE_URL'

const config: Config = {
    some: 'index',
    configBaseUrl,
    assetsUrl: `${configBaseUrl}i`,
    id: 'PKG_NAME'
}

export default config
