import { createStore } from 'idb-keyval'

export const entriesStore = createStore('code-chronicle-db', 'entries')
