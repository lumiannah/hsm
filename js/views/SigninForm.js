import { API_URL } from "../main.js"
export default {
    data() {
        return {
            username: null,
            password: null
        }
    },
    methods: {
        async signinUser() {
            const creds = {
                username: this.username,
                password: this.password,
            }
            const response = await fetch(`${API_URL}/signin`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                  },
                body: JSON.stringify(creds)
            })
            if (!response.ok) {
                const message = `Unauthorized`
                throw new Error(message)
            }
            this.$root.user = await response.json()
            this.$root.currentView = 'Welcome'
            
        }
        
    },
    template: `
    <div class="content">

        <h1>Smart Home Signin</h1>
        <form class="signin_form" @submit.prevent="signinUser()">

            <label for="username">Username</label>
            <input id="username" v-model="username" type="username" required/>

            <label for="password">password</label>
            <input id="password" v-model="password" type="password" required/>

            <input class="margintop2" type="submit" value="Signin"/>

        </form>
        
    </div>
    `
}