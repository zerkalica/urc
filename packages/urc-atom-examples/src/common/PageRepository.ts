import {mem, action} from 'urc-atom'
import {LocationStore} from './LocationStore'

export interface BasePage {
    id: string
    title: string
}

export interface SetPageIdEvent {
    preventDefault(): void
    target: any
}

export interface PageRepositoryContext {
    locationStore: LocationStore
}

export class PageRepository<Page extends BasePage> {
    protected readonly pages: Page[]
    protected readonly key: string
    protected readonly _: PageRepositoryContext
    protected id: string

    constructor(opts: {
        id: string
        pages: Page[]
        key: string
        _: PageRepositoryContext
    }) {
        this.id = opts.id
        this.pages = opts.pages
        this.key = opts.key
        this._ = opts._
    }

    toString() { return this.id }

    @action setPageId(e: SetPageIdEvent) {
        e.preventDefault()
        const id = e.target.dataset.id
        this.page = this.pages.find(page => page.id === id)
    }

    @action getPageUrl(page: string): string {
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
