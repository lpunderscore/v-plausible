import defu from 'defu'
import Plausible from 'plausible-tracker'
import type { PlausibleOptions } from 'plausible-tracker'
import type { App } from 'vue'
import { inject } from 'vue'

interface ScriptLoaderOption extends Partial<HTMLScriptElement> {
  'data-domain': string
  partytown: boolean
}

function loadScript(source: string, options: ScriptLoaderOption = {} as ScriptLoaderOption) {
  return new Promise((resolve, reject) => {
    const head = document.head || document.getElementsByTagName('head')[0]
    const script = document.createElement('script')
    const {
      src,
      type = options.partytown ? 'text/partytown' : 'text/javascript',
      defer = false,
      async = false,
      ...restAttrs
    } = options
    script.type = type
    script.defer = defer
    script.async = async
    script.src = src || source
    script.setAttribute('data-domain', options['data-domain'])

    Object.keys(restAttrs).forEach((key) => {
      (script as any)[key] = (restAttrs as any)[key]
    })

    head.appendChild(script)
    script.onload = resolve
    script.onerror = reject
  })
}

export type IPlausible = typeof Plausible
export type ReturnUsePlasuible = Omit<
  ReturnType<typeof Plausible>,
  'enableAutoPageviews' | 'enableAutoOutboundTracking'
>

export interface OptionPlugin {
  /**
   * Plausible options
   * @type PlausibleOptions
   */
  init: PlausibleOptions

  /**
   * Plausible Settings
   * @type InstallOptions
   */
  settings: InstallOptions

  /**
   * Partytown support
   * @default false
   * @type boolean
   * @link https://partytown.builder.io/how-does-partytown-work
   */
  partytown?: boolean
}

export interface InstallOptions {
  /**
   * Enables automatic page view tracking for SPAs
   * @default false
   * @see https://github.com/plausible/plausible-tracker
   * @type boolean
   */
  enableAutoPageviews?: boolean
  /**
   * Outbound link click tracking
   * @default false
   * @see https://plausible.io/docs/outbound-link-click-tracking
   * @type boolean
   *
   */
  enableAutoOutboundTracking?: boolean
}

export function createPlausible(options: OptionPlugin) {
  const plausible = {
    install(app: App): void {
      const data = defu(options.init, {
        apiHost: 'https://plausible.io',
        enableAutoPageviews: true,
      } as OptionPlugin['init'])
      const plausible = Plausible(data)

      if (options.settings.enableAutoPageviews === true)
        plausible.enableAutoPageviews()

      if (options.settings.enableAutoOutboundTracking === true)
        plausible.enableAutoOutboundTracking()

      loadScript(`${data.apiHost}/js/script.js`, {
        'defer': true,
        'data-domain': data.domain || 'https://plausible.io',
        'partytown': options.partytown || false,
      })

      app.config.globalProperties.$plausible = plausible
      app.provide('$plausible', plausible)
    },
  }
  return plausible
}

export function usePlausible() {
  const plausible = inject('$plausible') as ReturnUsePlasuible

  return {
    ...plausible,
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $plausible: ReturnType<typeof Plausible>
  }
}
