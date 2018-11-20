export class ModelStorage<Model> {
    constructor(
        protected storage: Storage,
        protected key: string,
        protected defaults?: Model
    ) {}

    get(): Model {
        const {defaults} = this
        const value: string = this.storage.getItem(this.key)

        if (!value && defaults) {
            this.set(defaults)
            return defaults
        }

        return JSON.parse(value)
    }

    set(value: Model): void {
        this.storage.setItem(this.key, JSON.stringify(value))
    }

    clear(): void {
        this.storage.removeItem(this.key)
    }
}
