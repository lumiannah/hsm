import { API_URL } from "../main.js"
export default {
    methods: {
        async logoutUser() {
            await fetch(`${API_URL}/logout`, {
                method: 'GET',
                credentials: 'include',
            })
            this.$root.user = {}
            this.$root.currentView = 'SigninForm'
        }
    },
    template: `
    <button @pointerup="logoutUser()">Logout</button>
    `
}