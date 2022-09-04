import SigninForm from './views/SigninForm.js'
import Welcome from './views/Welcome.js'

export const API_URL = 'http://localhost:3004'

const app = Vue.createApp({
    components: {
        SigninForm,
        Welcome,
    },
    data() {
        return {
            data: {},
            user: {},
            currentView: null
        }
    },
    watch: {
        
    },
    async mounted() {
        try {
            console.log('main mount get user')
            this.user = await this.getUser()
            
            if (this.user) {
                this.currentView = 'Welcome'
            } 

        } catch {
            console.log('no cookies');
            this.currentView = 'SigninForm'
        }

    },
    computed: {

    },
    methods: {
        async getUser() {
            const response = await fetch(`${API_URL}/user`, {
                method: 'GET',
                credentials: 'include',
            })
            if (!response.ok) {
                // not working
                console.log('ng');
            }
            return await response.json()
        },

    }
})

app.mount('#app')

setInterval( () => {
    window.location.reload()
}, 60000);