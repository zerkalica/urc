import {mem, action, object2} from 'urc-atom'
import {LocationStore} from './LocationStore'

export interface BasePage {
    id: string
    title: string
}

export interface SetPageIdEvent {
    preventDefault(): void
    target: any
}

export class PageRepository<Page extends BasePage> extends object2 {
    readonly pages: Page[]

    protected readonly key: string

    constructor(
        protected readonly _: {
            locationStore: LocationStore
        },
        id: string,
        opts: {
            pages: Page[]
            key: string
        }
    ) {
        super()
        this[Symbol.toStringTag] = id
        this.pages = opts.pages
        this.key = opts.key
    }

    @action.event setPageId(e: SetPageIdEvent) {
        e.preventDefault()
        const id = e.target.dataset.id
        action(() => {
            this.page = this.pages.find(page => page.id === id)
        })
    }

    getPageUrl(page: string): string {
        return this._.locationStore.toUrl({page})
    }

    @mem get page(): Page {
        const pageId: string = this._.locationStore.values[this.key]
        if (!pageId) return this.pages[0]

        return this.pages.find(page => page.id === pageId)
    }

    set page(page: Page) {
        if (!page) throw new Error(
            `Provide data-id attribute for ${String(this)}.setPageId`
        )

        this._.locationStore.values[this.key] = page.id
    }
}
