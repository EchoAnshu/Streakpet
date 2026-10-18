import { mount } from 'svelte'
import './styles/global.css'
import App from './App.svelte'
import { initTheme } from './stores/settings.svelte'

initTheme()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
